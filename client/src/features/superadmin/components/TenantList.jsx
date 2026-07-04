import { useState } from 'react';
import { useTenants, useToggleTenantLock } from '../hooks/useSuperAdmin';
import { toast } from 'sonner';
import { Lock, Unlock, ChevronLeft, ChevronRight, Database } from 'lucide-react';

export const TenantList = () => {
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
        toast.success(`Tenant ${updatedTenant.businessName} has been ${action}!`);
      },
      onError: (error) => {
        toast.error(error.message);
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
        return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-600 dark:text-zinc-400';
      case 'GROWTH':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400';
      case 'PRO':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400';
      default:
        return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-600 dark:text-zinc-400';
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Onboarded Tenants</h2>
          <p className="text-sm text-muted-foreground">Manage databases, trial expirations, and subscription locks</p>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading tenants...</p>
        ) : tenants.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No tenants onboarded yet.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3.5 px-4 font-bold">Business Name</th>
                <th className="py-3.5 px-4 font-bold">Niche</th>
                <th className="py-3.5 px-4 font-bold">Plan</th>
                <th className="py-3.5 px-4 font-bold">Database URI</th>
                <th className="py-3.5 px-4 font-bold">Subscription Expiry</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm font-semibold">
              {tenants.map((tenant) => (
                <tr key={tenant._id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-4 px-4 font-extrabold">{tenant.businessName}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-500">
                      {tenant.niche}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getPlanBadgeClass(tenant.plan)}`}>
                      {tenant.plan || 'STARTER'}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Database className="h-3.5 w-3.5 text-muted-foreground/60" />
                      <span className="max-w-[200px] truncate">{tenant.databaseURI}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-medium">
                    {formatDate(tenant.subscriptionExpiry)}
                  </td>
                  <td className="py-4 px-4">
                    {tenant.rentOverdue ? (
                      <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
                        Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 text-xs font-bold text-green-600 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleToggleLock(tenant._id)}
                      disabled={toggleLockMutation.isPending}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                        tenant.rentOverdue
                          ? 'bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/20'
                          : 'bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-500/20'
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
                          <span>Lock</span>
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

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground font-semibold">
            Showing Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
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
export default TenantList;
