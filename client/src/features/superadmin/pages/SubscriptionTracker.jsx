import { useState, useMemo } from 'react';
import { useTenants, useUpdateTenantFeatures, useUpdateTenantSubscription } from '../hooks/useSuperAdmin';
import { toast } from 'sonner';
import { ShieldAlert, CheckCircle, AlertTriangle, X, ChevronLeft, Sliders, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';

export const SubscriptionTracker = () => {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useTenants(1, 100);
  const updateFeaturesMutation = useUpdateTenantFeatures();
  const updateSubscriptionMutation = useUpdateTenantSubscription();

  const [selectedFeaturesTenant, setSelectedFeaturesTenant] = useState(null);
  const [selectedSubscriptionTenant, setSelectedSubscriptionTenant] = useState(null);

  const [featuresForm, setFeaturesForm] = useState([]);
  const [subscriptionForm, setSubscriptionForm] = useState({
    trialPeriod: 30,
    pricingTier: 'STARTER'
  });

  const [statusFilter, setStatusFilter] = useState(null);

  const tenants = useMemo(() => data?.data || [], [data?.data]);

  const getRemainingDays = (expiryStr) => {
    if (!expiryStr) return 0;
    const expiry = new Date(expiryStr);
    const now = new Date();
    const diffTime = expiry - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredTenants = useMemo(() => {
    if (!statusFilter) return tenants;
    return tenants.filter(tenant => {
      const remaining = getRemainingDays(tenant.subscriptionExpiry);
      if (statusFilter === 'expired') {
        return remaining <= 0;
      }
      if (statusFilter === 'expiringSoon') {
        return remaining <= 3 && remaining > 0;
      }
      if (statusFilter === 'active') {
        return remaining > 3;
      }
      return true;
    });
  }, [tenants, statusFilter]);

  const metrics = useMemo(() => {
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;

    tenants.forEach(tenant => {
      const remaining = getRemainingDays(tenant.subscriptionExpiry);
      if (remaining <= 0) {
        expired++;
      } else if (remaining <= 3) {
        expiringSoon++;
      } else {
        active++;
      }
    });

    return { active, expiringSoon, expired };
  }, [tenants]);

  const handleOpenFeatures = (tenant) => {
    setSelectedFeaturesTenant(tenant);
    setFeaturesForm(tenant.features || []);
  };

  const handleFeatureCheckbox = (feature) => {
    setFeaturesForm(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handleSaveFeatures = async () => {
    try {
      await updateFeaturesMutation.mutateAsync({
        tenantId: selectedFeaturesTenant._id,
        features: featuresForm
      });
      toast.success('Tenant features updated successfully!');
      setSelectedFeaturesTenant(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to update features');
    }
  };

  const handleOpenSubscription = (tenant) => {
    setSelectedSubscriptionTenant(tenant);
    const remaining = Math.max(0, getRemainingDays(tenant.subscriptionExpiry));
    setSubscriptionForm({
      trialPeriod: remaining,
      pricingTier: tenant.plan || 'STARTER'
    });
  };

  const handleSaveSubscription = async () => {
    try {
      await updateSubscriptionMutation.mutateAsync({
        tenantId: selectedSubscriptionTenant._id,
        trialPeriod: parseInt(subscriptionForm.trialPeriod, 10) || 0,
        pricingTier: subscriptionForm.pricingTier
      });
      toast.success('Subscription plan extended successfully!');
      setSelectedSubscriptionTenant(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to update subscription');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border dark:border-zinc-700 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/superadmin')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition-colors border border-border dark:border-zinc-700"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground dark:text-white">
              Subscription & Billing Tracker
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Monitor active SaaS contracts, extension histories, and toggle active modules locks
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div
          onClick={() => setStatusFilter(prev => prev === 'active' ? null : 'active')}
          className={`p-4 rounded-xl border bg-white dark:bg-zinc-800 flex items-center gap-4 shadow-sm cursor-pointer transition-all ${
            statusFilter === 'active'
              ? 'border-green-500 ring-1 ring-green-500'
              : 'border-border dark:border-zinc-700 hover:border-green-550/30'
          }`}
        >
          <div className="p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 shrink-0">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Workspace Trials</p>
            <p className="text-xl font-black text-foreground dark:text-white mt-1">{metrics.active}</p>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(prev => prev === 'expiringSoon' ? null : 'expiringSoon')}
          className={`p-4 rounded-xl border bg-white dark:bg-zinc-800 flex items-center gap-4 shadow-sm cursor-pointer transition-all ${
            statusFilter === 'expiringSoon'
              ? 'border-amber-500 ring-1 ring-amber-500'
              : 'border-border dark:border-zinc-700 hover:border-amber-550/30'
          }`}
        >
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Expiring Soon (&lt; 3 Days)</p>
            <p className="text-xl font-black text-foreground dark:text-white mt-1">{metrics.expiringSoon}</p>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(prev => prev === 'expired' ? null : 'expired')}
          className={`p-4 rounded-xl border bg-white dark:bg-zinc-800 flex items-center gap-4 shadow-sm cursor-pointer transition-all ${
            statusFilter === 'expired'
              ? 'border-red-500 ring-1 ring-red-500'
              : 'border-border dark:border-zinc-700 hover:border-red-550/30'
          }`}
        >
          <div className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Expired Tenants</p>
            <p className="text-xl font-black text-foreground dark:text-white mt-1">{metrics.expired}</p>
          </div>
        </div>
      </div>

      {statusFilter && (
        <div className="flex items-center gap-2 text-[10px] font-extrabold bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 px-2.5 py-1 rounded-lg w-fit select-none">
          <span>FILTER: <span className="uppercase">{statusFilter === 'expiringSoon' ? 'Expiring Soon' : statusFilter}</span></span>
          <button onClick={() => setStatusFilter(null)} className="hover:text-red-500 cursor-pointer">
            <X className="h-3 w-3 inline" />
          </button>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton cols={5} rows={5} />
      ) : (
        <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[56rem]">
              <thead>
                <tr className="border-b border-border dark:border-zinc-700 bg-slate-100/60 dark:bg-zinc-800/40 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Business Workspace</th>
                  <th className="py-3 px-4">Owner Contact</th>
                  <th className="py-3 px-4">Pricing Tier</th>
                  <th className="py-3 px-4 w-64">Contract Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-zinc-700 text-xs font-semibold">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-muted-foreground">
                      No active tenant contracts registered
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map(tenant => {
                    const remaining = getRemainingDays(tenant.subscriptionExpiry);
                    const isExpired = remaining <= 0;
                    const isWarning = remaining <= 3 && remaining > 0;
                    
                    const progressPercent = Math.max(0, Math.min(100, (remaining / 30) * 100));

                    return (
                      <tr key={tenant._id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-4 font-extrabold text-foreground dark:text-white">
                          {tenant.businessName}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono">
                          {tenant.ownerEmail || 'anonymous'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-zinc-700 px-2 py-0.5 text-[9px] font-black uppercase text-slate-650 dark:text-zinc-350">
                            {tenant.plan}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-extrabold text-muted-foreground uppercase">
                              <span>{isExpired ? 'Trial Expired' : `${remaining} days remaining`}</span>
                              <span>{Math.round(progressPercent)}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-zinc-750 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${progressPercent}%` }}
                                className={`h-full transition-all duration-300 ${
                                  isExpired 
                                    ? 'bg-red-500' 
                                    : isWarning 
                                    ? 'bg-amber-500' 
                                    : 'bg-green-500'
                                }`}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/30 px-2 py-0.5 text-[10px] font-extrabold text-red-650 dark:text-red-400">
                              <ShieldAlert className="h-3 w-3" />
                              <span>Expired</span>
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/30 px-2 py-0.5 text-[10px] font-extrabold text-amber-650 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Near Expiry</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-950/30 px-2 py-0.5 text-[10px] font-extrabold text-green-650 dark:text-green-400">
                              <CheckCircle className="h-3 w-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => handleOpenFeatures(tenant)}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-650 text-slate-700 dark:text-zinc-200 text-[10px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Sliders className="h-3 w-3" />
                              <span>Access</span>
                            </button>
                            <button
                              onClick={() => handleOpenSubscription(tenant)}
                              className="px-2.5 py-1 rounded bg-[var(--accent)] text-white text-[10px] font-bold hover:opacity-90 transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Calendar className="h-3 w-3" />
                              <span>Subscription</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedFeaturesTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-xl max-w-lg w-full shadow-lg overflow-hidden flex flex-col font-semibold">
            <div className="p-4 border-b border-border dark:border-zinc-700 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-800/20">
              <div>
                <h3 className="text-sm font-bold text-foreground dark:text-white">Manage Module Access</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{selectedFeaturesTenant.businessName}</p>
              </div>
              <button
                onClick={() => setSelectedFeaturesTenant(null)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border dark:hover:bg-zinc-700 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-border dark:border-zinc-700 pb-1 mb-2">Garments Features</h4>
                  <div className="space-y-2">
                    {['Barcode Printing', 'Size-Color Matrix'].map(feature => (
                      <label key={feature} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={featuresForm.includes(feature)}
                          onChange={() => handleFeatureCheckbox(feature)}
                          className="rounded border-border dark:border-zinc-700 text-[var(--accent)] focus:ring-[var(--accent)] h-4 w-4"
                        />
                        <span className="font-bold text-foreground dark:text-zinc-200">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-border dark:border-zinc-700 pb-1 mb-2">Restaurant Features</h4>
                  <div className="space-y-2">
                    {['Kitchen Order Ticket', 'Table Management'].map(feature => (
                      <label key={feature} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={featuresForm.includes(feature)}
                          onChange={() => handleFeatureCheckbox(feature)}
                          className="rounded border-border dark:border-zinc-700 text-[var(--accent)] focus:ring-[var(--accent)] h-4 w-4"
                        />
                        <span className="font-bold text-foreground dark:text-zinc-200">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-border dark:border-zinc-700 pb-1 mb-2">Gym Features</h4>
                  <div className="space-y-2">
                    {['BMI Tracker', 'Instructor Payroll'].map(feature => (
                      <label key={feature} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={featuresForm.includes(feature)}
                          onChange={() => handleFeatureCheckbox(feature)}
                          className="rounded border-border dark:border-zinc-700 text-[var(--accent)] focus:ring-[var(--accent)] h-4 w-4"
                        />
                        <span className="font-bold text-foreground dark:text-zinc-200">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-border dark:border-zinc-700 pb-1 mb-2">Global Features</h4>
                  <div className="space-y-2">
                    {['Custom Brand Colors'].map(feature => (
                      <label key={feature} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={featuresForm.includes(feature)}
                          onChange={() => handleFeatureCheckbox(feature)}
                          className="rounded border-border dark:border-zinc-700 text-[var(--accent)] focus:ring-[var(--accent)] h-4 w-4"
                        />
                        <span className="font-bold text-foreground dark:text-zinc-200">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border dark:border-zinc-700 flex justify-end gap-2 bg-slate-50/50 dark:bg-zinc-800/10">
              <button
                onClick={() => setSelectedFeaturesTenant(null)}
                className="px-4 py-2 text-xs font-bold border border-border hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-lg text-slate-700 dark:text-zinc-250 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFeatures}
                disabled={updateFeaturesMutation.isPending}
                className="px-5 py-2 bg-[var(--accent)] text-white font-bold text-xs rounded-lg hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 cursor-pointer"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSubscriptionTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-xl max-w-sm w-full shadow-lg overflow-hidden flex flex-col font-semibold">
            <div className="p-4 border-b border-border dark:border-zinc-700 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-800/20">
              <div>
                <h3 className="text-sm font-bold text-foreground dark:text-white">Override Subscription</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{selectedSubscriptionTenant.businessName}</p>
              </div>
              <button
                onClick={() => setSelectedSubscriptionTenant(null)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border dark:hover:bg-zinc-700 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pricing Plan Plan</label>
                <select
                  value={subscriptionForm.pricingTier}
                  onChange={(e) => setSubscriptionForm(prev => ({ ...prev, pricingTier: e.target.value }))}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 px-3 py-2 text-xs font-bold text-foreground dark:text-zinc-250 focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                >
                  <option value="STARTER">STARTER</option>
                  <option value="GROWTH">GROWTH</option>
                  <option value="PRO">PRO</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Manual Trial Period Days</label>
                <input
                  type="number"
                  min="0"
                  value={subscriptionForm.trialPeriod}
                  onChange={(e) => setSubscriptionForm(prev => ({ ...prev, trialPeriod: e.target.value }))}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 px-3 py-2 text-xs font-semibold text-foreground dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder="e.g. 30"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border dark:border-zinc-700 flex justify-end gap-2 bg-slate-50/50 dark:bg-zinc-800/10">
              <button
                onClick={() => setSelectedSubscriptionTenant(null)}
                className="px-4 py-2 text-xs font-bold border border-border hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-lg text-slate-700 dark:text-zinc-250 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubscription}
                disabled={updateSubscriptionMutation.isPending}
                className="px-5 py-2 bg-[var(--accent)] text-white font-bold text-xs rounded-lg hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 cursor-pointer"
              >
                Save Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionTracker;
