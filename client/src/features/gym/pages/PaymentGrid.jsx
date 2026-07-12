import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Landmark, CircleDollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const PaymentGrid = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberPayments, setMemberPayments] = useState([]);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [monthPaidFor, setMonthPaidFor] = useState(MONTHS[new Date().getMonth()]);
  const [receiptNo, setReceiptNo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let sub;
    getDatabase().then((db) => {
      sub = db.members
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setMembers(docs);
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!selectedMemberId) {
      setMemberPayments([]);
      return;
    }
    let sub;
    getDatabase().then((db) => {
      sub = db.payments
        .find({ selector: { memberId: selectedMemberId, isDeleted: false } })
        .$.subscribe((docs) => {
          setMemberPayments(docs);
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [selectedMemberId]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedMemberId || !amount || !monthPaidFor) {
      toast.error('Member, Amount, and Month are required');
      return;
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const db = await getDatabase();
      const paymentId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

      await db.payments.insert({
        _id: paymentId,
        tenantId: user?.tenantId || 'default',
        memberId: selectedMemberId,
        amountReceived: amtNum,
        paymentMethod,
        monthPaidFor,
        receiptNo: receiptNo || `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        notes: notes || '',
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      });

      toast.success(`Recorded fee payment for ${monthPaidFor}`);
      setAmount('');
      setReceiptNo('');
      setNotes('');
    } catch {
      toast.error('Failed to save fee payment');
    }
  };

  const selectedMember = members.find(m => m._id === selectedMemberId);

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
          <span className="font-extrabold text-lg tracking-tight">12-Month Fees Ledger</span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 md:p-8 overflow-hidden items-stretch">
        <div className="lg:col-span-1 rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm flex flex-col min-h-0">
          <h3 className="text-base font-black tracking-tight mb-4 flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-accent" /> Gym Members Catalog
          </h3>
          <div className="flex-1 overflow-y-auto divide-y divide-border dark:divide-zinc-750 pr-1">
            {members.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No members found.</p>
            ) : (
              members.map((member) => (
                <button
                  key={member._id}
                  onClick={() => setSelectedMemberId(member._id)}
                  className={`w-full text-left py-3 px-3.5 rounded-lg transition-colors flex flex-col gap-0.5 border ${
                    selectedMemberId === member._id
                      ? 'bg-foreground text-background border-foreground font-bold shadow-sm'
                      : 'border-transparent hover:bg-muted text-foreground'
                  }`}
                >
                  <span className="text-xs font-black">{member.name}</span>
                  <span className={`text-[10px] ${selectedMemberId === member._id ? 'text-background/80' : 'text-muted-foreground'}`}>{member.phone}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto min-h-0 pr-1">
          {selectedMember ? (
            <>
              <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4">
                  Annual Payment Tracker: <span className="text-foreground">{selectedMember.name}</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {MONTHS.map((month) => {
                    const payment = memberPayments.find(p => p.monthPaidFor === month);
                    return (
                      <div
                        key={month}
                        className={`rounded-lg border p-3 flex flex-col justify-between h-20 transition-all ${
                          payment 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-slate-100/50 dark:bg-zinc-900/40 border-border dark:border-zinc-700 text-muted-foreground'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-wide">{month}</span>
                        {payment ? (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-black">${payment.amountReceived.toFixed(2)}</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold">Unpaid</span>
                            <AlertCircle className="h-4 w-4 text-slate-400 dark:text-zinc-600" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm">
                <h3 className="text-sm font-black tracking-tight mb-4 flex items-center gap-1.5">
                  <CreditCard className="h-5 w-5 text-accent" /> Post Membership Fee Payout
                </h3>
                <form onSubmit={handleRecordPayment} className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Month *</label>
                    <select
                      value={monthPaidFor}
                      onChange={(e) => setMonthPaidFor(e.target.value)}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                    >
                      {MONTHS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount Received ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Receipt Number (Optional)</label>
                    <input
                      type="text"
                      value={receiptNo}
                      onChange={(e) => setReceiptNo(e.target.value)}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none h-16 resize-none"
                      placeholder="Additional remarks..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="sm:col-span-2 rounded-lg bg-foreground text-background font-bold py-3 text-xs shadow-sm hover:bg-foreground/90 transition-colors"
                  >
                    Post Payment Entry
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-white dark:bg-zinc-800 text-muted-foreground p-8">
              <Landmark className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-xs font-bold text-foreground">Select a Gym Member</p>
              <p className="text-[10px] text-center max-w-xs text-muted-foreground mt-0.5">Please pick a member from the left panel to review and record monthly membership fee logs</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentGrid;
