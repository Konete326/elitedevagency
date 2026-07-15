import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { ArrowLeft, Landmark, Ruler, Activity, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MeasurementTracker = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [historyLogs, setHistoryLogs] = useState([]);

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState(0);
  const [bicep, setBicep] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');

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
      setHistoryLogs([]);
      return;
    }
    let sub;
    getDatabase().then((db) => {
      sub = db.measurements
        .find({ selector: { memberId: selectedMemberId, isDeleted: false } })
        .$.subscribe((docs) => {
          const sorted = docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          setHistoryLogs(sorted);
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [selectedMemberId]);

  useEffect(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!isNaN(w) && !isNaN(h) && h > 0) {
      const calculatedBmi = w / (h * h);
      setBmi(parseFloat(calculatedBmi.toFixed(1)));
    } else {
      setBmi(0);
    }
  }, [weight, height]);

  const handlePostMetrics = async (e) => {
    e.preventDefault();
    if (!selectedMemberId || !weight || !height) {
      toast.error('Member, Weight, and Height are required');
      return;
    }

    const wNum = parseFloat(weight);
    const hNum = parseFloat(height);

    if (isNaN(wNum) || wNum <= 0) {
      toast.error('Please enter a valid weight in kg');
      return;
    }
    if (isNaN(hNum) || hNum <= 0) {
      toast.error('Please enter a valid height in meters');
      return;
    }

    try {
      const db = await getDatabase();
      const logId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

      await db.measurements.insert({
        _id: logId,
        tenantId: user?.tenantId || 'default',
        memberId: selectedMemberId,
        weight: wNum,
        height: hNum,
        bmi,
        bicep: parseFloat(bicep) || 0,
        chest: parseFloat(chest) || 0,
        waist: parseFloat(waist) || 0,
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      });

      toast.success('Member body metrics recorded');
      setWeight('');
      setHeight('');
      setBicep('');
      setChest('');
      setWaist('');
    } catch {
      toast.error('Failed to save measurement log');
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      const db = await getDatabase();
      const doc = await db.measurements.findOne(logId).exec();
      if (doc) {
        await doc.patch({
          isDeleted: true,
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
        toast.success('Metrics log deleted');
      }
    } catch {
      toast.error('Failed to delete metrics record');
    }
  };

  const selectedMember = members.find(m => m._id === selectedMemberId);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 max-w-7xl w-full mx-auto space-y-6 p-6 md:p-8 overflow-y-auto">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Body Measurements Tracker</h1>
          <p className="text-xs text-muted-foreground">Log and track gym member BMI metrics and weight measurements</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-1 rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm flex flex-col min-h-0">
          <h3 className="text-base font-black tracking-tight mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" /> Gym Members Catalog
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
                <h3 className="text-sm font-black tracking-tight mb-4 flex items-center gap-1.5">
                  <Ruler className="h-5 w-5 text-accent" /> Record Body Measurement Logs
                </h3>
                <form onSubmit={handlePostMetrics} className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Weight (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
                      placeholder="e.g. 78.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Height (m) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
                      placeholder="e.g. 1.75"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Calculated BMI</label>
                    <div className="w-full rounded-lg border border-border dark:border-zinc-750 bg-muted px-3 py-2 text-xs font-mono font-black text-foreground select-none">
                      {bmi > 0 ? bmi : '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bicep Size (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={bicep}
                      onChange={(e) => setBicep(e.target.value)}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
                      placeholder="e.g. 14.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Chest Size (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={chest}
                      onChange={(e) => setChest(e.target.value)}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
                      placeholder="e.g. 40"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Waist Size (inches)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
                      placeholder="e.g. 32.5"
                    />
                  </div>
                  <button
                    type="submit"
                    className="sm:col-span-3 rounded-lg bg-foreground text-background font-bold py-3 text-xs shadow-sm hover:bg-foreground/90 transition-colors"
                  >
                    Save Metrics Log
                  </button>
                </form>
              </div>

              <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  {historyLogs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No historical measurements logs recorded yet.</p>
                  ) : (
                    <table className="w-full text-left border-collapse min-w-[30rem]">
                      <thead>
                        <tr className="border-b border-border dark:border-zinc-700 bg-slate-100/60 dark:bg-zinc-800/40 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4">Weight</th>
                          <th className="py-2.5 px-4">Height</th>
                          <th className="py-2.5 px-4">BMI</th>
                          <th className="py-2.5 px-4">Bicep</th>
                          <th className="py-2.5 px-4">Chest</th>
                          <th className="py-2.5 px-4">Waist</th>
                          <th className="py-2.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border dark:divide-zinc-700 text-xs font-semibold">
                        {historyLogs.map((log) => (
                          <tr key={log._id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-3 px-4 text-muted-foreground">{new Date(log.updatedAt).toLocaleDateString()}</td>
                            <td className="py-3 px-4 text-foreground">{log.weight} kg</td>
                            <td className="py-3 px-4 text-foreground">{log.height} m</td>
                            <td className="py-3 px-4 text-foreground">{log.bmi}</td>
                            <td className="py-3 px-4 text-foreground">{log.bicep ? `${log.bicep}"` : '-'}</td>
                            <td className="py-3 px-4 text-foreground">{log.chest ? `${log.chest}"` : '-'}</td>
                            <td className="py-3 px-4 text-foreground">{log.waist ? `${log.waist}"` : '-'}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteLog(log._id)}
                                className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
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
              <p className="text-xs font-bold text-foreground">Select a Gym Member</p>
              <p className="text-[10px] text-center max-w-xs text-muted-foreground mt-0.5">Please pick a member from the left panel to review and record biometric weight/height/sizes progress log sheets</p>
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
};

export default MeasurementTracker;
