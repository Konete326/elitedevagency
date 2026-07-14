import { useState } from 'react';
import { TenantManager } from '../components/TenantManager';
import { TenantOnboardForm } from '../components/TenantOnboardForm';
import { UserPlus, ChevronLeft } from 'lucide-react';

export const TenantsPage = () => {
  const [view, setView] = useState('list');

  return (
    <div className="space-y-4">
      {view === 'list' ? (
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
              onClick={() => setView('new')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white hover:opacity-90 px-3 py-2 text-xs font-bold transition-opacity shadow-sm"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Tenant</span>
            </button>
          </div>
          <TenantManager />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-border dark:border-zinc-700 pb-3">
            <button
              onClick={() => setView('list')}
              className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition-colors border border-border dark:border-zinc-700"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground dark:text-white">
                Onboard New Tenant
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Initialize business profiles, target connection databases, and set pricing models
              </p>
            </div>
          </div>
          <TenantOnboardForm onSuccess={() => setView('list')} hideHeader />
        </div>
      )}
    </div>
  );
};

export default TenantsPage;
