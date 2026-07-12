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

  const numRegex = /^[0-9]+(\.[0-9]{1,2})?$/;
  const intRegex = /^[0-9]+$/;

  const isPriceValid = !planPrice || numRegex.test(planPrice);
  const isDurationValid = !planDuration || intRegex.test(planDuration);

  const handleCreatePlan = async (e) => {
    e.preventDefault();

    if (!isPriceValid || !isDurationValid) {
      toast.error('Please fix the highlighted invalid input fields before proceeding.');
      return;
    }

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
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              <span>Membership Plans</span>
            </h1>
            <p className="text-[10px] text-muted-foreground font-semibold">Manage club subscription pricing bundles</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Plan</span>
        </button>
      </header>

      <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-2xl text-muted-foreground bg-white dark:bg-zinc-800 p-8 space-y-3">
            <Award className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="font-extrabold text-base tracking-tight text-foreground">No membership plans</h3>
            <p className="text-xs text-center max-w-xs font-semibold">
              Create club membership packages for your frontdesk cashiers to select and bind to members.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className="flex flex-col justify-between p-6 rounded-2xl border border-border bg-white dark:bg-zinc-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-black text-foreground uppercase tracking-wide">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 min-h-[2rem] line-clamp-2">{plan.description}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] px-3 py-1 text-xs font-black text-white">
                      ${plan.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-zinc-900/40 border border-border dark:border-zinc-700 rounded-xl">
                    <Shield className="h-4 w-4 text-accent shrink-0" />
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      Access Validity: <strong className="text-foreground">{plan.durationInDays} Days</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border dark:border-zinc-700 flex items-center justify-end">
                  <button
                    onClick={() => handleDeletePlan(plan._id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-red-50 hover:text-red-600 p-2 text-xs font-bold text-slate-650 transition-colors shadow-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Package</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 font-semibold">
          <div className="w-full max-w-md rounded-2xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-xl relative overflow-hidden flex flex-col">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-6 flex items-center gap-1.5 text-foreground">
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
                    className={`w-full rounded-lg border bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 transition-all ${
                      isPriceValid 
                        ? 'border-border dark:border-zinc-700 focus:ring-ring' 
                        : 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    }`}
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
                    className={`w-full rounded-lg border bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 transition-all ${
                      isDurationValid 
                        ? 'border-border dark:border-zinc-700 focus:ring-ring' 
                        : 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    }`}
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
                className="w-full rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white py-3 text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
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
