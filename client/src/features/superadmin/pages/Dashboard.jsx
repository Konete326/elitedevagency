import { useState } from 'react';
import { usePendingDevices, useTenants } from '../hooks/useSuperAdmin';
import { TenantOnboardForm } from '../components/TenantOnboardForm';
import { TenantManager } from '../components/TenantManager';
import { HardwareApproval } from '../components/HardwareApproval';
import { toast } from 'sonner';
import { Users, X, Key, Clipboard, Building, DollarSign, Cpu, AlertCircle } from 'lucide-react';

export const Dashboard = () => {
  const [credentials, setCredentials] = useState(null);

  // Fetch pending devices to get the queue count
  const { data: devices = [] } = usePendingDevices();
  
  // Fetch first 100 tenants to calculate total tenants count and estimate MRR
  const { data: tenantsData } = useTenants(1, 100);
  const tenants = tenantsData?.data || [];
  const totalTenants = tenantsData?.meta?.total || 0;
  const pendingCount = devices.length;

  // Calculate MRR based on plans of active tenants
  const estimatedMRR = tenants.reduce((acc, tenant) => {
    if (tenant.rentOverdue) return acc;
    const plan = tenant.plan || 'STARTER';
    if (plan === 'PRO') return acc + 199;
    if (plan === 'GROWTH') return acc + 99;
    return acc + 49; // STARTER
  }, 0);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          System Overview
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time metrics, active hardware approvals, and tenant provisioning
        </p>
      </div>

      {/* Default Owner Credentials Banner */}
      {credentials && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-sm relative overflow-hidden animate-slide-in">
          <div className="absolute top-0 right-0 p-4">
            <button
              onClick={() => setCredentials(null)}
              className="rounded-lg hover:bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-start gap-4 pr-8">
            <div className="rounded-full bg-amber-500/10 p-3 text-amber-600 dark:text-amber-500 border border-amber-500/20 shrink-0">
              <Key className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base tracking-tight text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Tenant Provisioned Successfully</span>
              </h3>
              <p className="text-xs text-amber-700/80 dark:text-amber-500/80 font-medium">
                Copy and share these default administrator login details with the tenant owner:
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email Address</p>
                    <p className="text-xs font-bold truncate text-foreground">{credentials.email}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.email)}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border"
                  >
                    <Clipboard className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Temporary Password</p>
                    <p className="text-xs font-mono font-bold tracking-wider text-foreground">{credentials.password}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.password)}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border"
                  >
                    <Clipboard className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Monthly Recurring Revenue */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Estimated Monthly MRR
            </p>
            <p className="text-2xl font-black tracking-tight text-foreground">
              ${estimatedMRR.toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
              <span>● Active subscriptions contribution</span>
            </p>
          </div>
          <div className="rounded-full bg-emerald-500/10 p-3.5 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 shrink-0 shadow-sm">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Total Tenants Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Total Active Tenants
            </p>
            <p className="text-2xl font-black tracking-tight text-foreground">
              {totalTenants}
            </p>
            <p className="text-[10px] text-amber-600 dark:text-amber-500 font-extrabold">
              <span>● Gym / Restaurant / Garments</span>
            </p>
          </div>
          <div className="rounded-full bg-amber-500/10 p-3.5 text-amber-600 dark:text-amber-500 border border-amber-500/20 shrink-0 shadow-sm">
            <Building className="h-6 w-6" />
          </div>
        </div>

        {/* Pending Devices Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Pending approvals
            </p>
            <p className="text-2xl font-black tracking-tight text-foreground">
              {pendingCount}
            </p>
            <p className={`text-[10px] font-extrabold flex items-center gap-1 ${
              pendingCount > 0 ? 'text-rose-500' : 'text-slate-500'
            }`}>
              <span>● {pendingCount > 0 ? 'Requires administrative action' : 'System whitelisted'}</span>
            </p>
          </div>
          <div className={`rounded-full p-3.5 border shrink-0 shadow-sm transition-colors ${
            pendingCount > 0 
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' 
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 border-border'
          }`}>
            <Cpu className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TenantOnboardForm onSuccess={setCredentials} />
        <HardwareApproval />
      </div>

      {/* Tenants Management Area */}
      <TenantManager />

    </div>
  );
};

export default Dashboard;
