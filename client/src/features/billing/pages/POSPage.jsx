import { useEffect, useState, useCallback } from 'react';
import { ProductGrid } from '../components/ProductGrid';
import { Cart } from '../components/Cart';
import { useAuthStore } from '../../../store/useAuthStore';
import { Wallet, Bell, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { getDatabase } from '../../../db/database';
import { useCartStore } from '../../../store/useCartStore';

export const POSPage = () => {
  const { user } = useAuthStore();

  const [payments, setPayments] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (user?.role === 'SUPER_ADMIN') return;
    try {
      const res = await fetch('/api/table-order/pending-payments');
      const data = await res.json();
      if (data.success && data.data) {
        setPayments(data.data);
        const pending = data.data.find(p => p.status === 'PENDING');
        if (pending) {
          setActiveAlert(pending);
        } else {
          setActiveAlert(null);
        }
      }
    } catch {
    }
  }, [user]);

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(() => {
      fetchPayments();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchPayments]);

  const handleConfirm = async (paymentId) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/table-order/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Payment confirmed successfully!');
        if (activeAlert?._id === paymentId) {
          setActiveAlert(null);
        }
        fetchPayments();
      } else {
        toast.error(data.error || 'Failed to confirm payment');
      }
    } catch {
      toast.error('Network error confirming payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismiss = async (paymentId) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/table-order/dismiss-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      });
      const data = await res.json();
      if (data.success) {
        toast.info('Alert dismissed to tray');
        if (activeAlert?._id === paymentId) {
          setActiveAlert(null);
        }
        fetchPayments();
      } else {
        toast.error(data.error || 'Failed to dismiss alert');
      }
    } catch {
      toast.error('Network error dismissing alert');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = async (e) => {
      const now = Date.now();
      if (now - lastKeyTime > 50) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key.length === 1) {
        buffer += e.key;
      } else if (e.key === 'Enter') {
        if (buffer.length >= 8) {
          e.preventDefault();
          const scannedCode = buffer;
          buffer = '';
          
          try {
            const db = await getDatabase();
            const allProducts = await db.products.find({ selector: { isDeleted: false } }).exec();
            
            let matchedProduct = null;
            let matchedVariant = null;
            
            for (const prod of allProducts) {
              if (prod.variants && prod.variants.length > 0) {
                const foundVar = prod.variants.find(v => v.barcode === scannedCode || v.sku === scannedCode);
                if (foundVar) {
                  matchedProduct = prod;
                  matchedVariant = foundVar;
                  break;
                }
              }
              if (prod.sku === scannedCode) {
                matchedProduct = prod;
                matchedVariant = null;
                break;
              }
            }
            
            if (matchedProduct) {
              const addToCart = useCartStore.getState().addToCart;
              addToCart({
                id: matchedProduct._id,
                name: matchedProduct.name,
                price: matchedProduct.price,
                image: matchedProduct.image,
                promotionalDiscount: matchedProduct.promotionalDiscount,
                selectedVariant: matchedVariant
              });
              const desc = matchedVariant 
                ? `${matchedProduct.name} (${matchedVariant.size}/${matchedVariant.color})` 
                : matchedProduct.name;
              toast.success(`Scanned: ${desc}`);
            } else {
              toast.error('Scanned barcode or SKU not found');
            }
          } catch {
            toast.error('Failed to query scanned code');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 overflow-hidden p-4 md:p-6 w-full mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
          <div className="lg:col-span-2 h-full flex flex-col min-h-0">
            <ProductGrid />
          </div>
          <div className="h-full flex flex-col min-h-0">
            <Cart />
          </div>
        </div>

        {payments.length > 0 && (
          <button
            onClick={() => setIsTrayOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground font-black px-4 py-3 shadow-lg hover:scale-105 transition-transform cursor-pointer text-xs"
          >
            <Wallet className="h-4 w-4" />
            <span>Payments Tray</span>
            <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
              {payments.length}
            </span>
          </button>
        )}

        {activeAlert && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6 text-foreground">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Manual Payment Notification</h3>
                  <p className="text-xs text-muted-foreground">Action required for guest checkout confirmation</p>
                </div>
              </div>

              <div className="divide-y divide-border rounded-xl border border-border bg-muted/40 p-4 text-xs space-y-3">
                <div className="flex justify-between pt-1">
                  <span className="font-semibold text-muted-foreground">Customer Name:</span>
                  <span className="font-bold">{activeAlert.customerName}</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="font-semibold text-muted-foreground">Table Number:</span>
                  <span className="font-bold">Table {activeAlert.tableNo}</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="font-semibold text-muted-foreground">Account Number / TRX ID:</span>
                  <span className="font-mono font-bold">{activeAlert.accountNumberUsed}</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="font-semibold text-muted-foreground">Amount:</span>
                  <span className="font-bold text-primary">Rs. {activeAlert.amount}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  disabled={actionLoading}
                  onClick={() => handleConfirm(activeAlert._id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-650 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>Confirm Payment</span>
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleDismiss(activeAlert._id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-bold px-4 py-2.5 text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  <span>Dismiss Alert</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {isTrayOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs">
            <div className="w-full max-w-sm border-l border-border bg-card p-5 h-full flex flex-col justify-between shadow-2xl text-foreground">
              <div className="space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Pending Payments Tray</h3>
                    <p className="text-[10px] text-muted-foreground">Review manual wallet transactions</p>
                  </div>
                  <button
                    onClick={() => setIsTrayOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.map(p => (
                      <div key={p._id} className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold">{p.customerName} (Table {p.tableNo})</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider ${
                            p.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground space-y-1">
                          <div><span className="font-semibold">Number/TRX:</span> {p.accountNumberUsed}</div>
                          <div><span className="font-semibold">Amount:</span> Rs. {p.amount}</div>
                        </div>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleConfirm(p._id)}
                          className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 text-white font-bold py-1.5 text-[10px] hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          <Check className="h-3 w-3" />
                          <span>Confirm</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground text-center py-8">No payments in pending tray.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default POSPage;
