import { useState, useEffect } from 'react';
import { getDatabase } from '../../../db/database';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { printHardwareReceipt } from '../../../lib/device';
import { toast } from 'sonner';
import { ArrowLeft, Printer, ShoppingBag, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedPrinter } = useSettingsStore();

  useEffect(() => {
    let sub;
    getDatabase().then((db) => {
      sub = db.orders
        .find({
          selector: {
            isDeleted: false
          },
          sort: [{ updatedAt: 'desc' }]
        })
        .$.subscribe((docs) => {
          setOrders(docs);
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const handleReprint = async (order) => {
    if (!selectedPrinter) {
      toast.error('No printer selected. Please configure one in Settings.');
      return;
    }

    const subtotal = order.totalAmount / 1.05;
    const tax = subtotal * 0.05;

    const receiptData = {
      printerName: selectedPrinter,
      data: {
        orderId: order._id,
        items: order.items.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        })),
        subtotal,
        tax,
        total: order.totalAmount,
        timestamp: order.updatedAt
      }
    };

    try {
      await printHardwareReceipt(receiptData);
      toast.success('Reprint request sent to printer');
    } catch {
      toast.error('Failed to reprint receipt');
    }
  };

  const filteredOrders = orders.filter(o => 
    o._id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (o.paymentMode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Order History</h1>
          <p className="text-xs text-muted-foreground">Browse and search all completed local order transactions</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-fit">
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <ShoppingBag className="h-5 w-5 text-accent" />
              <div>
                <h2 className="text-lg font-bold tracking-tight">Recent Transactions</h2>
                <p className="text-xs text-muted-foreground font-semibold font-mono">Offline-first local orders index</p>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-0 rounded-lg border border-border dark:border-zinc-700 bg-card overflow-hidden shadow-xs">
              <div className="col-span-12 p-2 flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <input
                  type="text"
                  placeholder="Search transactions by Order ID, item name, or payment mode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs focus:outline-none font-semibold text-foreground dark:text-zinc-200"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            {filteredOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">No orders found matching filters.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Order ID</th>
                    <th className="py-3 px-4 font-bold">Date</th>
                    <th className="py-3 px-4 font-bold">Method</th>
                    <th className="py-3 px-4 font-bold">Return Status</th>
                    <th className="py-3 px-4 font-bold">Total Amount</th>
                    <th className="py-3 px-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[10px] text-muted-foreground">
                        #{order._id.slice(0, 8)}...
                      </td>
                      <td className="py-3.5 px-4">
                        {new Date(order.updatedAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px] text-muted-foreground">
                        {order.paymentMode || 'CASH'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          order.returnStatus === 'FULL'
                            ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                            : order.returnStatus === 'PARTIAL'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {order.returnStatus === 'NONE' || !order.returnStatus ? 'Original' : order.returnStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-accent">
                        Rs. {order.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleReprint(order)}
                          className="rounded-lg bg-muted hover:bg-muted/80 text-foreground px-2.5 py-1.5 transition-colors border border-border inline-flex items-center gap-1 text-[10px]"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Reprint</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderHistory;
