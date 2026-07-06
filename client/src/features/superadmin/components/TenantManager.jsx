import { useState } from 'react';
import { useTenants, useToggleTenantLock } from '../hooks/useSuperAdmin';
import { toast } from 'sonner';
import { Lock, Unlock, ChevronLeft, ChevronRight, Database, Layers } from 'lucide-react';

export const TenantManager = () => {
  const [page, setPage] = useState(1);
  const limit = 5;

  const { data, isLoading } = useTenants(page, limit);
  const toggleLockMutation = useToggleTenantLock();

  const tenants = data?.data || [];
  const meta = data?.meta || { total: 0 };
  const totalPages = Math.ceil(meta.total / limit) || 1;

  const handleToggleLock = (tenantId) => {
    toggleLockMutation.mutate(tenantId, {
      onSuccess: (updatedTenant) => {
        const action = updatedTenant.rentOverdue ? 'locked' : 'unlocked';
        toast.success(`Tenant "${updatedTenant.businessName}" has been ${action}!`);
      },
      onError: (error) => {
        toast.error(error.message || 'Operation failed');
      }
    });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlanBadgeClass = (plan) => {
    switch (plan) {
      case 'STARTER':
        return 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300';
      case 'GROWTH':
        return 'bg-blue-55 border-blue-100 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/30 dark:text-blue-400';
      case 'PRO':
        return 'bg-purple-55 border-purple-100 text-purple-700 dark:bg-purple-950/30 dark:border-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300';
    }
  };

  const getNicheBadgeClass = (niche) => {
    switch (niche) {
      case 'GYM':
        return 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/30 dark:text-amber-400';
      case 'RESTAURANT':
        return 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/30 dark:text-emerald-400';
      case 'GARMENTS':
        return 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/30 dark:text-rose-400';
      default:
        return 'bg-zinc-50 border-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400';
    }
  };

  return (
    <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
      <div className="p-6 border-b border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <span>Onboarded Tenants</span>
            {!isLoading && meta.total > 0 && (
              <span className="text-[11px] bg-slate-200/80 dark:bg-zinc-750 px-2 py-0.5 rounded-full font-extrabold text-slate-600 dark:text-zinc-300">
                {meta.total} total
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage databases, trials, licenses, and locking state</p>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading onboarded tenants...</p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground p-6">
            <p className="text-sm font-semibold text-foreground">No Tenants Found</p>
            <p className="text-xs text-muted-foreground mt-1">Onboard your first customer to populate this table</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[56rem]">
            <thead>
              <tr className="border-b border-border dark:border-zinc-700 bg-slate-100/60 dark:bg-zinc-800/40 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Business Name</th>
                <th className="py-3 px-4">Niche</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Database Path</th>
                <th className="py-3 px-4">Subscription End</th>
                <th className="py-3 px-4">License Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-zinc-700 text-sm font-semibold">
              {tenants.map((tenant) => (
                <tr key={tenant._id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-foreground">{tenant.businessName}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${getNicheBadgeClass(tenant.niche)}`}>
                      {tenant.niche}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${getPlanBadgeClass(tenant.plan)}`}>
                      {tenant.plan || 'STARTER'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Database className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="max-w-[11rem] truncate" title={tenant.databaseURI}>
                        {tenant.databaseURI}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-foreground/80">
                    {formatDate(tenant.subscriptionExpiry)}
                  </td>
                  <td className="py-3.5 px-4">
                    {tenant.rentOverdue ? (
                      <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
                        Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-xs font-bold text-green-600 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleLock(tenant._id)}
                      disabled={toggleLockMutation.isPending}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                        tenant.rentOverdue
                          ? 'bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/20 dark:border-green-550/20'
                          : 'bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-500/20 dark:border-red-550/20'
                      }`}
                    >
                      {tenant.rentOverdue ? (
                        <>
                          <Unlock className="h-3.5 w-3.5" />
                          <span>Unlock</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          <span>Lock (Kill)</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="p-4 border-t border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20 flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-semibold">
            Page <span className="font-bold text-foreground">{page}</span> of <span className="font-bold text-foreground">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-md border border-border dark:border-zinc-700 px-3 py-1.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-750 disabled:opacity-50 disabled:pointer-events-none transition-colors text-slate-700 dark:text-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 rounded-md border border-border dark:border-zinc-700 px-3 py-1.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-750 disabled:opacity-50 disabled:pointer-events-none transition-colors text-slate-700 dark:text-slate-200"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManager;
