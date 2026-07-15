import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { Wallet, Plus, Coins, ShieldAlert, X, Edit3, Trash2, FileText } from 'lucide-react';
export const CashDrawer = () => {
  const { user } = useAuthStore();

  const [shifts, setShifts] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [openingBalanceInput, setOpeningBalanceInput] = useState('');
  const [openedByInput, setOpenedByInput] = useState('');

  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');

  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [closingBalanceInput, setClosingBalanceInput] = useState('');

  const [editingShift, setEditingShift] = useState(null);
  const [editOpeningBalance, setEditOpeningBalance] = useState('');
  const [editCashSales, setEditCashSales] = useState('');
  const [editExpenses, setEditExpenses] = useState('');
  const [editClosingBalance, setEditClosingBalance] = useState('');
  const [editStatus, setEditStatus] = useState('OPEN');
  const [editOpenedBy, setEditOpenedBy] = useState('');

  useEffect(() => {
    let sub;
    getDatabase().then((db) => {
      sub = db.cash_shifts
        .find({ selector: { isDeleted: false } })
        .sort({ openedAt: 'desc' })
        .$.subscribe((docs) => {
          setShifts(docs);
          const active = docs.find((d) => d.status === 'OPEN');
          setActiveShift(active || null);
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
        openedBy: openedByInput || user?.name || user?.email || 'System',
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      });

      toast.success('Register opened successfully');
      setOpeningBalanceInput('');
      setOpenedByInput('');
      setIsAddOpen(false);
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

  const handleEditClick = (shift) => {
    setEditingShift(shift);
    setEditOpeningBalance(shift.openingBalance.toString());
    setEditCashSales((shift.cashSales || 0).toString());
    setEditExpenses((shift.expenses || 0).toString());
    setEditClosingBalance((shift.closingBalance || 0).toString());
    setEditStatus(shift.status);
    setEditOpenedBy(shift.openedBy || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingShift) return;

    const opBal = parseFloat(editOpeningBalance);
    const sales = parseFloat(editCashSales);
    const exp = parseFloat(editExpenses);
    const clBal = parseFloat(editClosingBalance);

    if (isNaN(opBal) || isNaN(sales) || isNaN(exp) || isNaN(clBal)) {
      toast.error('Please enter valid numeric values');
      return;
    }

    try {
      const db = await getDatabase();
      const doc = await db.cash_shifts.findOne(editingShift._id).exec();
      if (doc) {
        const patchData = {
          openingBalance: opBal,
          cashSales: sales,
          expenses: exp,
          closingBalance: clBal,
          status: editStatus,
          openedBy: editOpenedBy,
          isSynced: false,
          updatedAt: new Date().toISOString()
        };
        if (editStatus === 'CLOSED' && doc.status === 'OPEN') {
          patchData.closedAt = new Date().toISOString();
        } else if (editStatus === 'OPEN' && doc.status === 'CLOSED') {
          patchData.closedAt = undefined;
        }
        await doc.patch(patchData);
        toast.success('Shift record updated successfully');
        setEditingShift(null);
      }
    } catch {
      toast.error('Failed to update shift record');
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (!confirm('Are you sure you want to delete this shift record?')) return;
    try {
      const db = await getDatabase();
      const doc = await db.cash_shifts.findOne(shiftId).exec();
      if (doc) {
        await doc.patch({
          isDeleted: true,
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
        toast.success('Shift record deleted');
      }
    } catch {
      toast.error('Failed to delete shift record');
    }
  };

  const expectedCash = activeShift
    ? activeShift.openingBalance + activeShift.cashSales - activeShift.expenses
    : 0;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 w-full space-y-6 p-6 md:p-8 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Cash Register Ledger</h1>
            <p className="text-xs text-muted-foreground">Manage real-time cash shifts, expense allocations, and complete cash till drawers</p>
          </div>
          <div className="flex items-center gap-2">
            {!activeShift ? (
              <button
                onClick={() => {
                  setOpenedByInput(user?.name || user?.email || '');
                  setIsAddOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--primary-accent)] to-[var(--secondary-accent)] text-white hover:opacity-95 font-bold text-xs px-4 py-2.5 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Open New Shift</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpenseOpen(true)}
                  className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-700 text-foreground cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-emerald-500" />
                  <span>Record Expense</span>
                </button>
                <button
                  onClick={() => {
                    setClosingBalanceInput(expectedCash.toString());
                    setIsCloseOpen(true);
                  }}
                  className="rounded-xl bg-red-600 text-white py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Close Current Shift</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {activeShift && (
          <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border dark:border-zinc-700 pb-4 mb-6">
              <div>
                <h3 className="text-base font-black tracking-tight text-foreground">Active Register Shift</h3>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  Opened by {activeShift.openedBy} on {new Date(activeShift.openedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black">
                ACTIVE
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 p-4">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Opening Till</p>
                <p className="text-lg font-black text-foreground mt-1">Rs. {activeShift.openingBalance.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 p-4">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Cash Invoices</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">Rs. {(activeShift.cashSales || 0).toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 p-4">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total Expenses</p>
                <p className="text-lg font-black text-red-500 mt-1">Rs. {(activeShift.expenses || 0).toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 p-4">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Expected Balance</p>
                <p className="text-lg font-black text-foreground mt-1">Rs. {expectedCash.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden flex flex-col">
          <div className="py-4 px-5 border-b border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <FileText className="h-4.5 w-4.5 text-slate-500" />
              <span>Shift Register Logs Directory</span>
            </h2>
          </div>

          <div className="flex-1 overflow-x-auto w-full">
            {shifts.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground font-bold">
                No cash shift logs found in local database.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[36rem] [&_tbody_tr]:hover:bg-slate-50/40 [&_tbody_tr]:dark:hover:bg-zinc-700/20 [&_tbody_tr]:transition-colors">
                <thead>
                  <tr className="border-b border-border dark:border-zinc-700 bg-slate-100/65 dark:bg-zinc-800/40 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Opened By</th>
                    <th className="py-3 px-4">Opened Date</th>
                    <th className="py-3 px-4">Closed Date</th>
                    <th className="py-3 px-4">Opening</th>
                    <th className="py-3 px-4">Sales</th>
                    <th className="py-3 px-4">Expenses</th>
                    <th className="py-3 px-4">Closing Till</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-zinc-700 text-xs font-semibold text-foreground">
                  {shifts.map((shift) => (
                    <tr key={shift._id} className="align-middle">
                      <td className="py-3 px-4 font-bold">{shift.openedBy}</td>
                      <td className="py-3 px-4 text-[10px] text-slate-500 font-medium">
                        {new Date(shift.openedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-4 text-[10px] text-slate-500 font-medium">
                        {shift.closedAt 
                          ? new Date(shift.closedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                          : '--'}
                      </td>
                      <td className="py-3 px-4">Rs. {shift.openingBalance.toFixed(0)}</td>
                      <td className="py-3 px-4 text-emerald-600 dark:text-emerald-450">Rs. {(shift.cashSales || 0).toFixed(0)}</td>
                      <td className="py-3 px-4 text-red-500">Rs. {(shift.expenses || 0).toFixed(0)}</td>
                      <td className="py-3 px-4 font-bold">
                        {shift.status === 'CLOSED' ? `Rs. ${(shift.closingBalance || 0).toFixed(0)}` : '--'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                          shift.status === 'OPEN'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-655 border-border dark:bg-zinc-700 dark:text-zinc-300'
                        }`}>
                          {shift.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(shift)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-350 rounded transition-colors cursor-pointer"
                            title="Edit Log"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteShift(shift._id)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-655 dark:text-red-400 rounded transition-colors cursor-pointer"
                            title="Delete Log"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsAddOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-1.5 text-foreground">
              <Coins className="h-5 w-5 text-emerald-500" /> Open Cash Till Shift
            </h3>
            <form onSubmit={handleOpenRegister} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Opening Cash Balance (Rs) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={openingBalanceInput}
                  onChange={(e) => setOpeningBalanceInput(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  placeholder="e.g. 5000"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cashier/Opened By Name</label>
                <input
                  type="text"
                  value={openedByInput}
                  onChange={(e) => setOpenedByInput(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  placeholder="Defaults to current user"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[var(--primary-accent)] to-[var(--secondary-accent)] text-white font-bold text-xs shadow-sm hover:opacity-95 transition-opacity"
              >
                Start Active Cash Shift
              </button>
            </form>
          </div>
        </div>
      )}

      {isExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsExpenseOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer">
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
                className="w-full rounded-lg bg-red-600 text-white font-bold py-3 text-xs shadow-sm hover:bg-red-500 transition-colors"
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
            <button onClick={() => setIsCloseOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer">
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
                className="w-full rounded-lg bg-red-600 text-white font-bold py-3 text-xs shadow-sm hover:bg-red-500 transition-colors"
              >
                Close & Complete Shift
              </button>
            </form>
          </div>
        </div>
      )}

      {editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setEditingShift(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-1.5 text-foreground">
              <Edit3 className="h-5 w-5 text-[var(--primary-accent)]" /> Edit Shift Log
            </h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cashier/Opened By</label>
                <input
                  type="text"
                  required
                  value={editOpenedBy}
                  onChange={(e) => setEditOpenedBy(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Opening Cash (Rs)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editOpeningBalance}
                    onChange={(e) => setEditOpeningBalance(e.target.value)}
                    className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cash Sales (Rs)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editCashSales}
                    onChange={(e) => setEditCashSales(e.target.value)}
                    className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expenses (Rs)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editExpenses}
                    onChange={(e) => setEditExpenses(e.target.value)}
                    className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Closing Cash (Rs)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editClosingBalance}
                    onChange={(e) => setEditClosingBalance(e.target.value)}
                    className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Shift Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="OPEN">OPEN / ACTIVE</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-[var(--primary-accent)] text-white font-bold text-xs shadow-sm hover:opacity-95 transition-opacity"
              >
                Save Shift Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashDrawer;
