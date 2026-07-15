import { useState } from 'react';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { Search, RotateCcw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ReturnsPage = () => {
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState('');
  const [order, setOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [processing, setProcessing] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchId.trim()) return;

    try {
      const db = await getDatabase();
      const doc = await db.orders.findOne(searchId.trim()).exec();
      if (doc) {
        setOrder(doc);
        setSelectedItems({});
      } else {
        toast.error('Order not found');
        setOrder(null);
      }
    } catch {
      toast.error('Failed to query database');
    }
  };

  const handleCheckboxToggle = (itemId) => {
    setSelectedItems((prev) => {
      const existing = prev[itemId];
      if (existing) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: { qty: 1, reason: 'Size Issue' }
      };
    });
  };

  const handleQtyChange = (itemId, val, max) => {
    setSelectedItems((prev) => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: { ...prev[itemId], qty: Math.min(max, Math.max(1, parseInt(val, 10) || 1)) }
      };
    });
  };

  const handleReasonChange = (itemId, val) => {
    setSelectedItems((prev) => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: { ...prev[itemId], reason: val }
      };
    });
  };

  const handleProcessRefund = async () => {
    if (Object.keys(selectedItems).length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    setProcessing(true);
    try {
      const db = await getDatabase();
      
      const updatedItems = order.items.map((item, idx) => {
        const returnSelect = selectedItems[idx];
        if (returnSelect) {
          const newReturnedQty = (item.returnedQty || 0) + returnSelect.qty;
          return {
            ...item,
            returnedQty: newReturnedQty,
            returnReason: returnSelect.reason
          };
        }
        return item;
      });

      let allFullyReturned = true;
      let hasSomeReturn = false;
      for (const item of updatedItems) {
        if ((item.returnedQty || 0) > 0) {
          hasSomeReturn = true;
        }
        if ((item.returnedQty || 0) < item.quantity) {
          allFullyReturned = false;
        }
      }

      const returnStatus = allFullyReturned ? 'FULL' : (hasSomeReturn ? 'PARTIAL' : 'NONE');

      const orderDoc = await db.orders.findOne(order._id).exec();
      if (orderDoc) {
        await orderDoc.patch({
          items: updatedItems,
          returnStatus,
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
      }

      for (const idx of Object.keys(selectedItems)) {
        const item = order.items[idx];
        const returnSelect = selectedItems[idx];
        const productDoc = await db.products.findOne(item.productId).exec();
        if (productDoc) {
          if (item.variantSku) {
            const updatedVariants = (productDoc.variants || []).map((v) => {
              if (v.sku === item.variantSku) {
                return { ...v, stock: (v.stock || 0) + returnSelect.qty };
              }
              return v;
            });
            await productDoc.patch({
              variants: updatedVariants,
              stock: (productDoc.stock || 0) + returnSelect.qty,
              isSynced: false,
              updatedAt: new Date().toISOString()
            });
          } else {
            await productDoc.patch({
              stock: (productDoc.stock || 0) + returnSelect.qty,
              isSynced: false,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }

      toast.success('Refund processed and items restocked');
      setOrder(null);
      setSelectedItems({});
      setSearchId('');
    } catch {
      toast.error('Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  const refundTotal = order
    ? Object.keys(selectedItems).reduce((sum, idx) => {
        const item = order.items[idx];
        const select = selectedItems[idx];
        return sum + item.price * select.qty;
      }, 0)
    : 0;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Returns & Refunds</h1>
          <p className="text-xs text-muted-foreground">Lookup customer order details to issue product return and store refund vouchers</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Scan or enter Order ID"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 px-4 py-2.5 text-sm font-bold transition-colors"
          >
            <span>Search</span>
          </button>
        </form>

        {order && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
                <div className="flex justify-between items-start border-b border-border pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold tracking-tight">Order #{order._id.slice(0, 8)}...</h3>
                    <p className="text-xs text-muted-foreground font-semibold">{new Date(order.updatedAt).toLocaleString()}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border transition-colors ${
                    order.returnStatus === 'FULL'
                      ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                      : order.returnStatus === 'PARTIAL'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {order.returnStatus === 'NONE' || !order.returnStatus ? 'Original Order' : `${order.returnStatus} Returned`}
                  </span>
                </div>

                <div className="divide-y divide-border">
                  {order.items.map((item, idx) => {
                    const remainingQty = item.quantity - (item.returnedQty || 0);
                    const isChecked = !!selectedItems[idx];
                    return (
                      <div key={idx} className="py-4 flex gap-4 items-start">
                        {remainingQty > 0 ? (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxToggle(idx)}
                            className="rounded border-border text-primary focus:ring-primary mt-1"
                          />
                        ) : (
                          <span className="text-[10px] bg-muted text-muted-foreground font-bold rounded px-1.5 py-0.5 mt-1 shrink-0">Returned</span>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-semibold">
                            Purchased: {item.quantity} | Returned: {item.returnedQty || 0}
                          </p>
                          {isChecked && (
                            <div className="grid gap-2 grid-cols-2 mt-3 animate-fade-in">
                              <div>
                                <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">Return Qty</label>
                                <input
                                  type="number"
                                  min="1"
                                  max={remainingQty}
                                  value={selectedItems[idx].qty}
                                  onChange={(e) => handleQtyChange(idx, e.target.value, remainingQty)}
                                  className="w-full rounded border border-border bg-background px-2.5 py-1 text-xs focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">Reason</label>
                                <select
                                  value={selectedItems[idx].reason}
                                  onChange={(e) => handleReasonChange(idx, e.target.value)}
                                  className="w-full rounded border border-border bg-background px-2.5 py-1 text-xs focus:outline-none h-7"
                                >
                                  <option value="Size Issue">Size Issue</option>
                                  <option value="Defect">Defect</option>
                                  <option value="Change of Mind">Change of Mind</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-extrabold text-foreground shrink-0">Rs. {item.price.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Refund Summary</h3>
                <div className="space-y-2 text-sm font-semibold">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Selected items</span>
                    <span className="text-foreground font-bold">{Object.keys(selectedItems).length}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold border-t border-border pt-3 mt-2">
                    <span>Refund Total</span>
                    <span className="text-red-500 font-black">Rs. {refundTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProcessRefund}
                  disabled={processing}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-700 font-bold px-4 py-2.5 text-sm transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  <span>{processing ? 'Processing...' : 'Process Refund'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ReturnsPage;
