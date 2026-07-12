import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { ArrowLeft, Wallet, Plus, Coins, ShieldAlert, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CashDrawer = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activeShift, setActiveShift] = useState(null);
  const [openingBalanceInput, setOpeningBalanceInput] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [closingBalanceInput, setClosingBalanceInput] = useState('');
  const [isCloseOpen, setIsCloseOpen] = useState(false);

  useEffect(() => {
    let sub;
    getDatabase().then((db) => {
      sub = db.cash_shifts
        .find({ selector: { status: 'OPEN', isDeleted: false } })
        .$.subscribe((docs) => {
          setActiveShift(docs[0] || null);
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const handleOpenRegister = async (e) => {
    e.preventDefault();
    const opBal = parseFloat(openingBalanceInput);
    if (isNaN(opBal) || opBal < 0) {
      toast.error('Please enter a valid opening balance');
      return;
    }

    try {
      const db = await getDatabase();
      const shiftId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      
      await db.cash_shifts.insert({
        _id: shiftId,
        tenantId: user?.tenantId || 'default',
        openedAt: new Date().toISOString(),
        openingBalance: opBal,
        cashSales: 0,
        expenses: 0,
        status: 'OPEN',
        openedBy: user?.name || user?.email || 'System',
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      });

      toast.success('Register opened successfully');
      setOpeningBalanceInput('');
    } catch {
      toast.error('Failed to open cash drawer');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid expense amount');
      return;
    }

    if (!activeShift) return;

    try {
      const db = await getDatabase();
      const doc = await db.cash_shifts.findOne(activeShift._id).exec();
      if (doc) {
        const currentExp = doc.expenses || 0;
        await doc.patch({
          expenses: currentExp + amt,
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
        toast.success('Expense recorded successfully');
        setExpenseAmount('');
        setExpenseReason('');
        setIsExpenseOpen(false);
      }
    } catch {
      toast.error('Failed to update cash register expenses');
    }
  };

  const handleCloseRegister = async (e) => {
    e.preventDefault();
    if (!activeShift) return;

    const clBal = parseFloat(closingBalanceInput);
    if (isNaN(clBal) || clBal < 0) {
      toast.error('Please enter a valid closing balance');
      return;
    }

    try {
      const db = await getDatabase();
      const doc = await db.cash_shifts.findOne(activeShift._id).exec();
      if (doc) {
        await doc.patch({
          status: 'CLOSED',
          closedAt: new Date().toISOString(),
          closingBalance: clBal,
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
        toast.success('Register closed successfully');
        setClosingBalanceInput('');
        setIsCloseOpen(false);
      }
    } catch {
      toast.error('Failed to close cash register shift');
    }
  };

  const expectedCash = activeShift
    ? (activeShift.openingBalance + activeShift.cashSales - activeShift.expenses)
    : 0;

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
          <span className="font-extrabold text-lg tracking-tight">Cash Drawer</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 overflow-y-auto">
        {!activeShift ? (
          <div className="max-w-md mx-auto rounded-2xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-8 shadow-md text-center mt-10">
            <Coins className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-foreground">Register Closed</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Opening the cash register is required to record sales. Enter the opening cash balance to start the shift.
            </p>

            <form onSubmit={handleOpenRegister} className="mt-6 space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Opening Cash (Rs) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={openingBalanceInput}
                  onChange={(e) => setOpeningBalanceInput(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-3 text-sm font-semibold text-foreground focus:outline-none"
                  placeholder="e.g. 5000"
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity uppercase tracking-wider"
              >
                Open Register
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border dark:border-zinc-700 pb-4 mb-6">
                <div>
                  <h3 className="text-base font-black tracking-tight text-foreground">Active Shift (Opened)</h3>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Started by {activeShift.openedBy} on {new Date(activeShift.openedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black">
                  REGISTER OPEN
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg border border-border dark:border-zinc-750 bg-slate-50/50 dark:bg-zinc-900/20 p-4">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Opening Cash</p>
                  <p className="text-lg font-black text-foreground mt-1">Rs. {activeShift.openingBalance.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-border dark:border-zinc-750 bg-slate-50/50 dark:bg-zinc-900/20 p-4">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Cash Sales</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">Rs. {(activeShift.cashSales || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-border dark:border-zinc-750 bg-slate-50/50 dark:bg-zinc-900/20 p-4">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Expenses (Petty Cash)</p>
                  <p className="text-lg font-black text-red-500 mt-1">Rs. {(activeShift.expenses || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-border dark:border-zinc-750 bg-slate-50/50 dark:bg-zinc-900/20 p-4">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Expected Cash</p>
                  <p className="text-lg font-black text-foreground mt-1">Rs. {expectedCash.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsExpenseOpen(true)}
                  className="flex-1 py-3 px-4 rounded-xl border border-border dark:border-zinc-700 hover:bg-muted font-bold text-xs flex items-center justify-center gap-1.5 transition-colors text-foreground"
                >
                  <Plus className="h-4 w-4 text-emerald-500" />
                  <span>Add Expense</span>
                </button>
                <button
                  onClick={() => setIsCloseOpen(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:bg-red-500 transition-colors"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Close Register</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {isExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsExpenseOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-1.5 text-foreground">
              <Coins className="h-5 w-5 text-red-500" /> Record Petty Cash Expense
            </h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expense Amount (Rs) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  placeholder="e.g. 250"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reason / Remind Notes</label>
                <input
                  type="text"
                  value={expenseReason}
                  onChange={(e) => setExpenseReason(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  placeholder="e.g. Milk or Tea buy"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-red-600 text-white font-bold py-3 text-xs shadow-sm"
              >
                Submit Expense Log
              </button>
            </form>
          </div>
        </div>
      )}

      {isCloseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsCloseOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-1.5 text-foreground">
              <ShieldAlert className="h-5 w-5 text-red-500" /> Close Cash Shift Register
            </h3>
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-3.5 rounded-lg mb-4 text-xs font-semibold">
              Expected Cash in Drawer is <strong>Rs. {expectedCash.toFixed(2)}</strong>. Please verify physical cash before locking the drawer status.
            </div>
            <form onSubmit={handleCloseRegister} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Physical Cash (Rs) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={closingBalanceInput}
                  onChange={(e) => setClosingBalanceInput(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  placeholder={`e.g. ${expectedCash}`}
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-red-600 text-white font-bold py-3 text-xs shadow-sm"
              >
                Close & Complete Shift
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashDrawer;
