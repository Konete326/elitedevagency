import { useSearchParams } from 'react-router-dom';
import { TenantManager } from '../components/TenantManager';
import { TenantOnboardForm } from '../components/TenantOnboardForm';
import { useTenants } from '../hooks/useSuperAdmin';
import { UserPlus, ChevronLeft } from 'lucide-react';

export const TenantsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const showNew = searchParams.get('new') === 'true';
  const { data: tenantsData } = useTenants(1, 100);
  const tenants = tenantsData?.data || [];
  const editingTenant = editId ? tenants.find(t => t._id === editId) : null;

  return (
    <div className="space-y-4">
      {!showNew && !editId ? (
        <div className="space-y-4">
          <div className="flex flex-row items-center justify-between gap-4 border-b border-border dark:border-zinc-700 pb-3">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground dark:text-white">
                Tenants Management
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Register new customer accounts and manage active tenant subscription states
              </p>
            </div>
            <button
              onClick={() => setSearchParams({ new: 'true' })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white hover:opacity-90 px-3 py-2 text-xs font-bold transition-opacity shadow-sm"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Tenant</span>
            </button>
          </div>
          <TenantManager onEdit={(tenant) => setSearchParams({ edit: tenant._id })} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-border dark:border-zinc-700 pb-3">
            <button
              onClick={() => setSearchParams({})}
              className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition-colors border border-border dark:border-zinc-700"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground dark:text-white">
                {editId ? 'Edit Tenant Profile' : 'Onboard New Tenant'}
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {editId ? 'Update tenant connection credentials and pricing attributes' : 'Initialize business profiles, target connection databases, and set pricing models'}
              </p>
            </div>
          </div>
          <TenantOnboardForm 
            onSuccess={() => setSearchParams({})} 
            editingTenant={editingTenant}
            hideHeader 
          />
        </div>
      )}
    </div>
  );
};

export default TenantsPage;
