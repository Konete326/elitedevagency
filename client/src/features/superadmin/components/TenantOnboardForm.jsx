import { useState, useEffect } from 'react';
import { useOnboardTenant } from '../hooks/useSuperAdmin';
import { toast } from 'sonner';

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

  const handleOnboard = (e) => {
    e.preventDefault();
    if (!businessName || !ownerName || !ownerEmail) {
      toast.error('All onboarding fields are required');
      return;
    }

    const parsedDays = parseInt(trialDays, 10);
    if (isNaN(parsedDays) || parsedDays <= 0) {
      toast.error('Please enter a positive number of trial days');
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
          toast.success(`Tenant ${response.data.businessName} onboarded!`);
          onSuccess(response.credentials);
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
          toast.error(error.message);
        }
      }
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight">Onboard New Tenant</h2>
        <p className="text-sm text-muted-foreground">Provision a new business client and isolated database</p>
      </div>

      <form onSubmit={handleOnboard} className="space-y-5">
        <div className="grid gap-4 grid-cols-2">
          <div>
            <label className="block text-sm font-semibold mb-1">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. FitZone Center"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Trial Period (Days)</label>
            <input
              type="number"
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              min="1"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2">
          <div>
            <label className="block text-sm font-semibold mb-1">Owner Name</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Owner Email</label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="owner@fitzone.com"
            />
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2">
          <div>
            <label className="block text-sm font-semibold mb-1">Business Niche</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
            >
              <option value="GYM">Gym / Fitness</option>
              <option value="RESTAURANT">Restaurant / Cafe</option>
              <option value="GARMENTS">Garments / Retail</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Pricing Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-semibold"
            >
              <option value="STARTER">Starter</option>
              <option value="GROWTH">Growth</option>
              <option value="PRO">Pro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Custom Modules</label>
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-background">
            {allModules.map((mod) => (
              <label
                key={mod.id}
                className="flex items-center gap-2.5 text-sm font-medium cursor-pointer py-1.5 select-none"
              >
                <input
                  type="checkbox"
                  checked={activeModules.includes(mod.id)}
                  onChange={() => handleModuleToggle(mod.id)}
                  className="rounded border-border text-foreground bg-background focus:ring-0 h-4 w-4"
                />
                <span>{mod.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Custom Brand Colors <span className="text-xs font-normal text-muted-foreground">(optional — overrides niche defaults)</span></label>
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border border-border bg-background">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={lightPrimary}
                onChange={(e) => setLightPrimary(e.target.value)}
                className="h-10 w-10 rounded-lg border border-border cursor-pointer bg-transparent"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">Light Mode</p>
                <p className="text-xs text-muted-foreground font-mono">{lightPrimary}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={darkPrimary}
                onChange={(e) => setDarkPrimary(e.target.value)}
                className="h-10 w-10 rounded-lg border border-border cursor-pointer bg-transparent"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground font-mono">{darkPrimary}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={onboardTenantMutation.isPending}
          className="w-full inline-flex items-center justify-center rounded-lg bg-foreground text-background hover:bg-foreground/90 font-bold px-4 py-3 text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {onboardTenantMutation.isPending ? 'Provisioning & Seeding...' : 'Onboard Business'}
        </button>
      </form>
    </div>
  );
};
