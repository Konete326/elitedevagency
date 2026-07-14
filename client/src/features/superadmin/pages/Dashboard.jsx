import { usePendingDevices, useTenants } from '../hooks/useSuperAdmin';
import { TenantManager } from '../components/TenantManager';
import { Building, DollarSign, Cpu } from 'lucide-react';

export const Dashboard = () => {
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

      <TenantManager />

    </div>
  );
};

export default Dashboard;
