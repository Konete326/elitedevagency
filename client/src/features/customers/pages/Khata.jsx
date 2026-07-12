import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus, CircleDollarSign, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Khata = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [customers, setCustomers] = useState([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    let sub;
    getDatabase().then((db) => {
      sub = db.customers
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setCustomers(docs);
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      toast.error('All fields are required');
      return;
    }

    try {
      const db = await getDatabase();
      const customerId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

      await db.customers.insert({
        _id: customerId,
        tenantId: user?.tenantId || 'default',
        name: customerName,
        phone: customerPhone,
        receivableBalance: 0,
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      });

      toast.success('Customer registered in Khata Ledger');
      setIsCustomerModalOpen(false);
      setCustomerName('');
      setCustomerPhone('');
    } catch {
      toast.error('Failed to register customer');
    }
  };

  const handleReceivePayment = async (e) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const customer = customers.find(c => c._id === selectedCustomerId);
    if (!customer) return;

    if (amt > customer.receivableBalance) {
      toast.error(`Amount exceeds customer's outstanding balance of Rs. ${customer.receivableBalance}`);
      return;
    }

    try {
      const db = await getDatabase();
      
      const custDoc = await db.customers.findOne(selectedCustomerId).exec();
      if (custDoc) {
        await custDoc.patch({
          receivableBalance: Math.max(0, custDoc.receivableBalance - amt),
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
      }

      const activeShiftDoc = await db.cash_shifts.findOne({ selector: { status: 'OPEN', isDeleted: false } }).exec();
      if (activeShiftDoc) {
        const curSales = activeShiftDoc.cashSales || 0;
        await activeShiftDoc.patch({
          cashSales: curSales + amt,
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
        toast.success(`Received Rs. ${amt} & added to Active Cash Drawer`);
      } else {
        toast.success(`Received Rs. ${amt} (Cash shift was closed, balance updated offline)`);
      }

      setPaymentAmount('');
      setIsPaymentModalOpen(false);
    } catch {
      toast.error('Failed to process payment');
    }
  };

  const debitCustomers = customers.filter(c => c.receivableBalance > 0);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 px-6 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center p-2 rounded-lg border border-border dark:border-zinc-700 hover:bg-muted transition-colors mr-2 text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="font-extrabold text-lg tracking-tight">Customer Credit Ledger</span>
        </div>
        <button
          onClick={() => setIsCustomerModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Credit Account</span>
        </button>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 overflow-y-auto">
        <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20">
             <h3 className="text-base font-black tracking-tight text-foreground">Outstanding Credit Accounts</h3>
          </div>
          <div className="overflow-x-auto">
            {debitCustomers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-10 font-bold">No outstanding credit accounts currently.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border dark:border-zinc-700 bg-slate-100/60 dark:bg-zinc-800/40 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Receivable Balance</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-zinc-700 text-xs font-semibold">
                  {debitCustomers.map((cust) => (
                    <tr key={cust._id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 px-4 font-black text-foreground">{cust.name}</td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono">{cust.phone}</td>
                      <td className="py-3.5 px-4 font-black text-red-500 font-mono">Rs. {cust.receivableBalance.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedCustomerId(cust._id);
                            setIsPaymentModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-500 shadow-sm transition-colors"
                        >
                          Receive Payment
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

      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsCustomerModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-1.5 text-foreground">
              <UserPlus className="h-5 w-5 text-emerald-500" /> Create Credit Ledger Account
            </h3>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  placeholder="e.g. Asif Khan"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  placeholder="e.g. 0300-1234567"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-foreground text-background py-3 text-xs font-bold shadow-sm"
              >
                Register Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-1.5 text-foreground">
              <CircleDollarSign className="h-5 w-5 text-emerald-500" /> Receive Credit Payment
            </h3>
            <form onSubmit={handleReceivePayment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount Received (Rs) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  placeholder="e.g. 1000"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 text-white font-bold py-3 text-xs shadow-sm"
              >
                Submit Payment Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Khata;
