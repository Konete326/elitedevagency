import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Plus, X, Award, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PlanManager = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [plans, setPlans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planDuration, setPlanDuration] = useState('');
  const [planDesc, setPlanDesc] = useState('');

  useEffect(() => {
    let sub;
    getDatabase().then((db) => {
      sub = db.plans
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setPlans(docs);
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!planName || !planPrice || !planDuration) {
      toast.error('Name, Price, and Duration are required');
      return;
    }

    const priceNum = parseFloat(planPrice);
    const durationNum = parseInt(planDuration, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (isNaN(durationNum) || durationNum <= 0) {
      toast.error('Please enter a valid duration in days');
      return;
    }

    try {
      const db = await getDatabase();
      const planId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

      await db.plans.insert({
        _id: planId,
        tenantId: user?.tenantId || 'default',
        name: planName,
        price: priceNum,
        durationInDays: durationNum,
        description: planDesc,
        isActive: true,
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      });

      toast.success('Membership plan created successfully');
      setIsModalOpen(false);
      setPlanName('');
      setPlanPrice('');
      setPlanDuration('');
      setPlanDesc('');
    } catch {
      toast.error('Failed to create membership plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      const db = await getDatabase();
      const doc = await db.plans.findOne(planId).exec();
      if (doc) {
        await doc.patch({
          isDeleted: true,
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
        toast.success('Membership plan deleted successfully');
      }
    } catch {
      toast.error('Failed to delete membership plan');
    }
  };

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
          <span className="font-extrabold text-lg tracking-tight">Membership Plans</span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Create Plan</span>
        </button>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
        <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
          <div className="overflow-x-auto w-full">
            {plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-6">
                <Award className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-semibold text-foreground">No Plans Configured</p>
                <p className="text-xs text-muted-foreground mt-1">Configure gym plans to begin registering members</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[40rem]">
                <thead>
                  <tr className="border-b border-border dark:border-zinc-700 bg-slate-100/60 dark:bg-zinc-800/40 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Plan Name</th>
                    <th className="py-3.5 px-6">Price</th>
                    <th className="py-3.5 px-6">Duration</th>
                    <th className="py-3.5 px-6">Description</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-zinc-700 text-sm font-semibold">
                  {plans.map((plan) => (
                    <tr key={plan._id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-4 px-6 font-extrabold text-foreground flex items-center gap-2">
                        <Shield className="h-4 w-4 text-accent" /> {plan.name}
                      </td>
                      <td className="py-4 px-6 font-bold text-accent">${plan.price.toFixed(2)}</td>
                      <td className="py-4 px-6 font-semibold text-foreground">{plan.durationInDays} Days</td>
                      <td className="py-4 px-6 text-xs text-muted-foreground font-medium">{plan.description || '-'}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDeletePlan(plan._id)}
                          className="p-2 hover:bg-red-500/10 text-red-500 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
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
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-1.5">
              <Award className="h-5 w-5 text-accent" /> Create Membership Plan
            </h3>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="e.g. Monthly Standard"
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    placeholder="e.g. 49.99"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Duration (Days) *</label>
                  <input
                    type="number"
                    required
                    value={planDuration}
                    onChange={(e) => setPlanDuration(e.target.value)}
                    className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    placeholder="e.g. 30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all h-24 resize-none"
                  placeholder="Details about plan privileges..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-foreground text-background py-3 text-xs font-bold shadow-sm"
              >
                Save Plan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanManager;
