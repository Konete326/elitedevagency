import { usePendingDevices, useTenants } from '../hooks/useSuperAdmin';
import { Building, DollarSign, Cpu, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { data: devices = [] } = usePendingDevices();
  const { data: tenantsData } = useTenants(1, 100);
  
  const tenants = tenantsData?.data || [];
  const totalTenants = tenantsData?.meta?.total || 0;
  const pendingCount = devices.length;

  const estimatedMRR = tenants.reduce((acc, tenant) => {
    if (tenant.rentOverdue) return acc;
    const plan = tenant.plan || 'STARTER';
    if (plan === 'PRO') return acc + 199;
    if (plan === 'GROWTH') return acc + 99;
    return acc + 49;
  }, 0);

  const upcomingRenewals = [...tenants]
    .sort((a, b) => new Date(a.subscriptionExpiry) - new Date(b.subscriptionExpiry))
    .slice(0, 5);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlanBadgeClass = (plan) => {
    switch (plan) {
      case 'STARTER':
        return 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/30 dark:text-blue-400';
      case 'GROWTH':
        return 'bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-950/30 dark:border-purple-900/30 dark:text-purple-400';
      case 'PRO':
        return 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900/30 dark:text-indigo-400';
      default:
        return 'bg-zinc-50 border-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">
          System Overview
        </h1>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Real-time metrics and active tenant management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-sm flex items-center justify-between transition-colors duration-300">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Estimated Monthly MRR
            </p>
            <p className="text-xl font-black tracking-tight text-foreground dark:text-white">
              Rs. {estimatedMRR.toLocaleString()}
            </p>
            <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
              <span>● Active subscriptions contribution</span>
            </p>
          </div>
          <div className="rounded-full bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30 shrink-0 shadow-sm">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-sm flex items-center justify-between transition-colors duration-300">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Total Active Tenants
            </p>
            <p className="text-xl font-black tracking-tight text-foreground dark:text-white">
              {totalTenants}
            </p>
            <p className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold">
              <span>● Gym / Restaurant / Garments</span>
            </p>
          </div>
          <div className="rounded-full bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30 shrink-0 shadow-sm">
            <Building className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-sm flex items-center justify-between transition-colors duration-300">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Pending approvals
            </p>
            <p className="text-xl font-black tracking-tight text-foreground dark:text-white">
              {pendingCount}
            </p>
            <p className={`text-[9px] font-extrabold flex items-center gap-1 ${
              pendingCount > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
            }`}>
              <span>● {pendingCount > 0 ? 'Requires administrative action' : 'System whitelisted'}</span>
            </p>
          </div>
          <div className={`rounded-full p-2.5 border shrink-0 shadow-sm transition-colors ${
            pendingCount > 0 
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/30' 
              : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-slate-400 border-border dark:border-zinc-700'
          }`}>
            <Cpu className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
        <div className="py-3 px-5 border-b border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20 flex flex-row items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Calendar className="h-4.5 w-4.5 text-amber-600 dark:text-amber-500" />
              <span>Upcoming Fee Renewals</span>
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Quick overview of customer expiry profiles</p>
          </div>
          <button 
            onClick={() => navigate('/superadmin/tenants/new')}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--accent)] hover:underline"
          >
            <span>View All Tenants</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="divide-y divide-border dark:divide-zinc-700">
          {upcomingRenewals.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No active tenant subscriptions found.
            </div>
          ) : (
            upcomingRenewals.map((tenant) => (
              <button
                key={tenant._id}
                onClick={() => navigate(`/superadmin/tenants/new?view=${tenant._id}`)}
                className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-semibold text-xs text-foreground dark:text-zinc-200"
              >
                <div className="space-y-1">
                  <p className="font-extrabold text-foreground">{tenant.businessName}</p>
                  <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-slate-500">
                    <span>{tenant.niche}</span>
                    <span>•</span>
                    <span className={`px-1.5 py-0.5 rounded border ${getPlanBadgeClass(tenant.plan)} font-bold`}>
                      {tenant.plan}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Renewal/Expiry Date</p>
                  <p className={`font-bold ${tenant.rentOverdue ? 'text-red-500' : 'text-foreground'}`}>
                    {formatDate(tenant.subscriptionExpiry)}
                    {tenant.rentOverdue && <span className="ml-1.5 text-[9px] bg-red-500/10 text-red-550 border border-red-500/20 px-1 rounded font-black uppercase">Locked</span>}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
