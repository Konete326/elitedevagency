import { useState, useEffect } from 'react';
import { useOnboardTenant } from '../hooks/useSuperAdmin';
import { toast } from 'sonner';
import { UserPlus, CheckSquare, Square, Palette, ShieldCheck, Key, Clipboard, X, AlertCircle } from 'lucide-react';

const allModules = [
  { id: 'POS', label: 'Point of Sale' },
  { id: 'INVENTORY', label: 'Inventory' },
  { id: 'ANALYTICS', label: 'Analytics' },
  { id: 'FINANCIALS', label: 'Financials' },
  { id: 'HR', label: 'HR Management' },
  { id: 'PROMOTIONS', label: 'Promotions' }
];

const planDefaults = {
  STARTER: ['POS'],
  GROWTH: ['POS', 'INVENTORY', 'ANALYTICS'],
  PRO: ['POS', 'INVENTORY', 'ANALYTICS', 'FINANCIALS', 'HR', 'PROMOTIONS']
};

export const TenantOnboardForm = ({ onSuccess }) => {
  const [businessName, setBusinessName] = useState('');
  const [niche, setNiche] = useState('GYM');
  const [plan, setPlan] = useState('STARTER');
  const [activeModules, setActiveModules] = useState(['POS']);
  const [trialDays, setTrialDays] = useState(30);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [lightPrimary, setLightPrimary] = useState('#d97706');
  const [darkPrimary, setDarkPrimary] = useState('#f59e0b');
  const [credentials, setCredentials] = useState(null);

  const onboardTenantMutation = useOnboardTenant();

  useEffect(() => {
    setActiveModules(planDefaults[plan] || ['POS']);
  }, [plan]);

  const handleModuleToggle = (moduleId) => {
    setActiveModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleOnboard = (e) => {
    e.preventDefault();
    if (!businessName || !ownerName || !ownerEmail) {
      toast.error('Please fill in all required onboarding fields.');
      return;
    }

    const parsedDays = parseInt(trialDays, 10);
    if (isNaN(parsedDays) || parsedDays <= 0) {
      toast.error('Trial period must be a positive integer.');
      return;
    }

    onboardTenantMutation.mutate(
      {
        businessName,
        niche,
        plan,
        activeModules,
        trialDays: parsedDays,
        ownerName,
        ownerEmail,
        customTheme: { lightPrimary, darkPrimary }
      },
      {
        onSuccess: (response) => {
          toast.success(`Tenant "${response.data.businessName}" successfully onboarded!`);
          setCredentials(response.credentials);
          if (onSuccess) onSuccess(response.credentials);
          setBusinessName('');
          setOwnerName('');
          setOwnerEmail('');
          setPlan('STARTER');
          setNiche('GYM');
          setTrialDays(30);
          setLightPrimary('#d97706');
          setDarkPrimary('#f59e0b');
        },
        onError: (error) => {
          toast.error(error.message || 'Onboarding failed');
        }
      }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Tenant Onboarding
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Deploy and configure new business workspaces on the POS engine
        </p>
      </div>

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
                <span>Default Credentials Seeded</span>
              </h3>
              <p className="text-xs text-amber-700/80 dark:text-amber-500/80 font-medium">
                Copy and share these tenant administrator credentials:
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email Address</p>
                    <p className="text-xs font-bold truncate text-foreground dark:text-slate-200">{credentials.email}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.email)}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border dark:hover:bg-zinc-700"
                  >
                    <Clipboard className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Password</p>
                    <p className="text-xs font-mono font-bold tracking-wider text-foreground dark:text-slate-200">{credentials.password}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.password)}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border dark:hover:bg-zinc-700"
                  >
                    <Clipboard className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
        <div className="p-6 border-b border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/20">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <span>Onboard New Tenant</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Provision an isolated workspace and database</p>
        </div>

        <form onSubmit={handleOnboard} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 px-3.5 py-2.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
                  placeholder="e.g. FitZone Club"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">Trial Period (Days) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 px-3.5 py-2.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">Owner Full Name *</label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 px-3.5 py-2.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">Owner Email Address *</label>
                <input
                  type="email"
                  required
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 px-3.5 py-2.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
                  placeholder="owner@fitzone.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">Niche Category</label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 px-3.5 py-2.5 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
                >
                  <option value="GYM">Gym & Fitness Center</option>
                  <option value="RESTAURANT">Restaurant & Cafe</option>
                  <option value="GARMENTS">Garments & Retail Boutique</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider mb-1">pricing tier</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 px-3.5 py-2.5 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
                >
                  <option value="STARTER">Starter Tier</option>
                  <option value="GROWTH">Growth Tier</option>
                  <option value="PRO">Enterprise Pro Tier</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-2">Feature Permissions Module</label>
              <div className="grid grid-cols-2 gap-2 p-3.5 rounded-lg border border-border dark:border-zinc-700 bg-slate-50/30 dark:bg-zinc-900/10">
                {allModules.map((mod) => {
                  const isChecked = activeModules.includes(mod.id);
                  return (
                    <button
                      type="button"
                      key={mod.id}
                      onClick={() => handleModuleToggle(mod.id)}
                      className="flex items-center gap-2 py-1 px-1.5 text-xs text-left hover:bg-muted/40 rounded transition-colors text-foreground select-none font-semibold"
                    >
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400 dark:text-zinc-650 shrink-0" />
                      )}
                      <span>{mod.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-2">Custom Brand Colors (Optional)</label>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border border-border dark:border-zinc-700 bg-slate-50/30 dark:bg-zinc-900/10">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={lightPrimary}
                    onChange={(e) => setLightPrimary(e.target.value)}
                    className="h-9 w-9 border-none cursor-pointer rounded-lg overflow-hidden bg-transparent"
                  />
                  <div>
                    <p className="text-[10px] font-bold text-foreground">Light Accent</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{lightPrimary}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={darkPrimary}
                    onChange={(e) => setDarkPrimary(e.target.value)}
                    className="h-9 w-9 border-none cursor-pointer rounded-lg overflow-hidden bg-transparent"
                  />
                  <div>
                    <p className="text-[10px] font-bold text-foreground">Dark Accent</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{darkPrimary}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={onboardTenantMutation.isPending}
            className="w-full inline-flex items-center justify-center rounded-lg bg-foreground text-background hover:bg-foreground/90 font-bold px-4 py-3.5 text-sm transition-colors shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            {onboardTenantMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin"></span>
                <span>Deploying Tenant Database...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>Deploy & Activate Tenant</span>
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TenantOnboardForm;
