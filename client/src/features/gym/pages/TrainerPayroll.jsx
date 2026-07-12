import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus, Banknote, Landmark, Plus, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TrainerPayroll = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [trainers, setTrainers] = useState([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState([]);

  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [trainerName, setTrainerName] = useState('');
  const [trainerPhone, setTrainerPhone] = useState('');
  const [trainerSalary, setTrainerSalary] = useState('');

  const [entryType, setEntryType] = useState('Advance');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    let sub;
    getDatabase().then((db) => {
      sub = db.trainers
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setTrainers(docs);
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!selectedTrainerId) {
      setLedgerEntries([]);
      return;
    }
    let sub;
    getDatabase().then((db) => {
      sub = db.trainer_ledgers
        .find({ selector: { trainerId: selectedTrainerId, isDeleted: false } })
        .$.subscribe((docs) => {
          setLedgerEntries(docs);
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [selectedTrainerId]);

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    if (!trainerName || !trainerPhone || !trainerSalary) {
      toast.error('All fields are required');
      return;
    }

    const salNum = parseFloat(trainerSalary);
    if (isNaN(salNum) || salNum <= 0) {
      toast.error('Please enter a valid salary');
      return;
    }

    try {
      const db = await getDatabase();
      const trainerId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

      await db.trainers.insert({
        _id: trainerId,
        tenantId: user?.tenantId || 'default',
        name: trainerName,
        phone: trainerPhone,
        baseSalary: salNum,
        advanceBalance: 0,
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      });

      toast.success('Trainer onboarded successfully');
      setIsTrainerModalOpen(false);
      setTrainerName('');
      setTrainerPhone('');
      setTrainerSalary('');
    } catch {
      toast.error('Failed to onboard trainer');
    }
  };

  const handlePostLedgerEntry = async (e) => {
    e.preventDefault();
    if (!selectedTrainerId || !entryAmount || !entryDate) {
      toast.error('Amount and Date are required');
      return;
    }

    const amtNum = parseFloat(entryAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const trainer = trainers.find(t => t._id === selectedTrainerId);
    if (!trainer) return;

    try {
      const db = await getDatabase();
      const entryId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

      await db.trainer_ledgers.insert({
        _id: entryId,
        tenantId: user?.tenantId || 'default',
        trainerId: selectedTrainerId,
        type: entryType,
        amount: amtNum,
        date: new Date(entryDate).toISOString(),
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      });

      let newAdvance = trainer.advanceBalance || 0;
      if (entryType === 'Advance') {
        newAdvance += amtNum;
      } else if (entryType === 'Salary') {
        newAdvance = 0;
      }

      const trainerDoc = await db.trainers.findOne(selectedTrainerId).exec();
      if (trainerDoc) {
        await trainerDoc.patch({
          advanceBalance: newAdvance,
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
      }

      toast.success(`Successfully posted ${entryType} transaction`);
      setEntryAmount('');
    } catch {
      toast.error('Failed to post ledger entry');
    }
  };

  const selectedTrainer = trainers.find(t => t._id === selectedTrainerId);
  const baseSalary = selectedTrainer?.baseSalary || 0;
  const advanceBalance = selectedTrainer?.advanceBalance || 0;
  const netSalary = Math.max(0, baseSalary - advanceBalance);

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
          <span className="font-extrabold text-lg tracking-tight">Trainer Payroll & Advance Management</span>
        </div>
        <button
          onClick={() => setIsTrainerModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Onboard Trainer</span>
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 md:p-8 overflow-hidden items-stretch">
        <div className="lg:col-span-1 rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm flex flex-col min-h-0">
          <h3 className="text-base font-black tracking-tight mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" /> Gym Trainers
          </h3>
          <div className="flex-1 overflow-y-auto divide-y divide-border dark:divide-zinc-750 pr-1">
            {trainers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No trainers registered.</p>
            ) : (
              trainers.map((t) => (
                <button
                  key={t._id}
                  onClick={() => setSelectedTrainerId(t._id)}
                  className={`w-full text-left py-3.5 px-4 rounded-lg transition-colors flex justify-between items-center border ${
                    selectedTrainerId === t._id
                      ? 'bg-foreground text-background border-foreground font-bold shadow-sm'
                      : 'border-transparent hover:bg-muted text-foreground'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-black">{t.name}</span>
                    <span className={`text-[10px] ${selectedTrainerId === t._id ? 'text-background/80' : 'text-muted-foreground'}`}>{t.phone}</span>
                  </div>
                  <span className={`text-[11px] font-black rounded-full px-2 py-0.5 ${
                    t.advanceBalance > 0
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    Adv: ${t.advanceBalance.toFixed(2)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto min-h-0 pr-1">
          {selectedTrainer ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base Salary</p>
                  <p className="text-xl font-black text-foreground mt-1">${baseSalary.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Outstanding Advance</p>
                  <p className="text-xl font-black text-red-500 mt-1">${advanceBalance.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Net Salary</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">${netSalary.toFixed(2)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm">
                <h3 className="text-sm font-black tracking-tight mb-4 flex items-center gap-1.5">
                  <Banknote className="h-5 w-5 text-accent" /> Post Ledger Transaction
                </h3>
                <form onSubmit={handlePostLedgerEntry} className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Entry Type *</label>
                    <select
                      value={entryType}
                      onChange={(e) => setEntryType(e.target.value)}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                    >
                      <option value="Advance">Advance Draw</option>
                      <option value="Salary">Final Salary Payout</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={entryAmount}
                      onChange={(e) => setEntryAmount(e.target.value)}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
                      placeholder="e.g. 100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="sm:col-span-3 rounded-lg bg-foreground text-background font-bold py-3 text-xs shadow-sm hover:bg-foreground/90 transition-colors"
                  >
                    Submit Ledger Entry
                  </button>
                </form>
              </div>

              <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  {ledgerEntries.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No payroll/advance ledger entries recorded yet.</p>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border dark:border-zinc-700 bg-slate-100/60 dark:bg-zinc-800/40 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 px-4">Type</th>
                          <th className="py-2.5 px-4">Amount</th>
                          <th className="py-2.5 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border dark:divide-zinc-700 text-xs font-semibold">
                        {ledgerEntries.map((entry) => (
                          <tr key={entry._id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-foreground">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                entry.type === 'Salary'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              }`}>
                                {entry.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-foreground">${entry.amount.toFixed(2)}</td>
                            <td className="py-3 px-4 text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-white dark:bg-zinc-800 text-muted-foreground p-8">
              <Landmark className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-xs font-bold text-foreground">Select a Trainer</p>
              <p className="text-[10px] text-center max-w-xs text-muted-foreground mt-0.5">Pick a trainer from the left list to review base salary, post advance draws, or payout monthly salaries</p>
            </div>
          )}
        </div>
      </main>

      {isTrainerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsTrainerModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-1.5">
              <UserPlus className="h-5 w-5 text-accent" /> Onboard Gym Trainer
            </h3>
            <form onSubmit={handleCreateTrainer} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Trainer Name *</label>
                <input
                  type="text"
                  required
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  placeholder="e.g. Bruce Wayne"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={trainerPhone}
                  onChange={(e) => setTrainerPhone(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  placeholder="e.g. +1 555-0100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Base Salary ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={trainerSalary}
                  onChange={(e) => setTrainerSalary(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none"
                  placeholder="e.g. 1500"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-foreground text-background py-3 text-xs font-bold shadow-sm"
              >
                Onboard Trainer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerPayroll;
