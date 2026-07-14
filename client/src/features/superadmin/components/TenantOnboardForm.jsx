import { useState, useEffect } from 'react';
import { useOnboardTenant } from '../hooks/useSuperAdmin';
import { toast } from 'sonner';
import { CheckSquare, Square, ShieldCheck, Key, Clipboard, X, AlertCircle, ChevronLeft } from 'lucide-react';
import { getDatabase } from '../../../db/database';
import { Link } from 'react-router-dom';

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

const nicheFeaturesMap = {
  GYM: ['BMI Tracker', 'Instructor Payroll'],
  RESTAURANT: ['Kitchen Order Ticket', 'Table Management'],
  GARMENTS: ['Barcode Printing', 'Size-Color Matrix']
};

const globalFeatures = ['Custom Brand Colors'];

export const TenantOnboardForm = ({ onSuccess }) => {
  const [businessName, setBusinessName] = useState('');
  const [niche, setNiche] = useState('GYM');
  const [plan, setPlan] = useState('STARTER');
  const [activeModules, setActiveModules] = useState(['POS']);
  const [trialDays, setTrialDays] = useState('30');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [dbURI, setDbURI] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  
  const [lightPrimary, setLightPrimary] = useState('#d97706');
  const [darkPrimary, setDarkPrimary] = useState('#f59e0b');
  const [credentials, setCredentials] = useState(null);
  const [blockMobileAccess, setBlockMobileAccess] = useState(false);
  const [pricingTiers, setPricingTiers] = useState([]);

  // Real-time Validation Errors
  const [businessNameError, setBusinessNameError] = useState('');
  const [trialDaysError, setTrialDaysError] = useState('');
  const [dbURIError, setDbURIError] = useState('');
  const [ownerPasswordError, setOwnerPasswordError] = useState('');
  const [ownerNameError, setOwnerNameError] = useState('');
  const [ownerEmailError, setOwnerEmailError] = useState('');

  const onboardTenantMutation = useOnboardTenant();

  // Regex rules
  const businessNameRegex = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,39}$/;
  const trialDaysRegex = /^(0|[1-9]\d*)$/;
  const dbURIRegex = /^mongodb(\+srv)?:\/\/.+$/;
  const passwordRegex = /^.{6,20}$/;
  const ownerNameRegex = /^[A-Za-z][A-Za-z\s]{1,29}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    let sub;
    getDatabase().then((db) => {
      sub = db.pricing_tiers
        .find({ selector: { isActive: true } })
        .$.subscribe((docs) => {
          setPricingTiers(docs.map(d => ({ name: d.name, price: d.price, niche: d.niche, features: d.features || [] })));
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const handlePlanChange = (selectedPlanName) => {
    setPlan(selectedPlanName);
    
    const matchedTier = pricingTiers.find(t => t.name.toUpperCase() === selectedPlanName.toUpperCase());
    if (matchedTier) {
      if (matchedTier.niche) {
        setNiche(matchedTier.niche.toUpperCase());
      }
      setSelectedFeatures(matchedTier.features || []);
    } else {
      setSelectedFeatures([]);
    }
  };

  useEffect(() => {
    setActiveModules(planDefaults[plan] || ['POS']);
  }, [plan]);

  const handleBusinessNameChange = (val) => {
    setBusinessName(val);
    if (!val) {
      setBusinessNameError('Business Name is required.');
    } else if (!businessNameRegex.test(val)) {
      setBusinessNameError('Must be 3-40 characters. Alphanumeric, spaces, or hyphens only.');
    } else {
      setBusinessNameError('');
    }
  };

  const handleTrialDaysChange = (val) => {
    setTrialDays(val);
    if (val === '') {
      setTrialDaysError('');
    } else if (!trialDaysRegex.test(val)) {
      setTrialDaysError('Must be a non-negative integer.');
    } else {
      setTrialDaysError('');
    }
  };

  const handleDbURIChange = (val) => {
    setDbURI(val);
    if (!val) {
      setDbURIError('Database URI is required.');
    } else if (!dbURIRegex.test(val)) {
      setDbURIError('Must be a valid MongoDB Connection String (e.g. mongodb://host/db).');
    } else {
      setDbURIError('');
    }
  };

  const handleOwnerPasswordChange = (val) => {
    setOwnerPassword(val);
    if (!val) {
      setOwnerPasswordError('Password is required.');
    } else if (!passwordRegex.test(val)) {
      setOwnerPasswordError('Password must be 6-20 characters.');
    } else {
      setOwnerPasswordError('');
    }
  };

  const handleOwnerNameChange = (val) => {
    setOwnerName(val);
    if (!val) {
      setOwnerNameError('Owner Name is required.');
    } else if (!ownerNameRegex.test(val)) {
      setOwnerNameError('Name must be 2-30 characters (letters and spaces only).');
    } else {
      setOwnerNameError('');
    }
  };

  const handleOwnerEmailChange = (val) => {
    setOwnerEmail(val);
    if (!val) {
      setOwnerEmailError('Email is required.');
    } else if (!emailRegex.test(val)) {
      setOwnerEmailError('Please enter a valid email address (e.g. name@domain.com).');
    } else {
      setOwnerEmailError('');
    }
  };

  const handleModuleToggle = (moduleId) => {
    setActiveModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleFeatureToggle = (feature) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleOnboard = (e) => {
    e.preventDefault();

    // final sanity check
    if (
      businessNameError ||
      trialDaysError ||
      dbURIError ||
      ownerPasswordError ||
      ownerNameError ||
      ownerEmailError ||
      !businessName ||
      !ownerName ||
      !ownerEmail ||
      !ownerPassword ||
      !dbURI
    ) {
      toast.error('Please fix all validation errors before deploying.');
      return;
    }

    const parsedDays = trialDays ? parseInt(trialDays, 10) : 0;
    onboardTenantMutation.mutate(
      {
        businessName,
        niche,
        plan,
        activeModules,
        trialDays: parsedDays,
        ownerName,
        ownerEmail,
        ownerPassword,
        customTheme: { lightPrimary, darkPrimary },
        dbURI,
        features: selectedFeatures,
        blockMobileAccess
      },
      {
        onSuccess: (response) => {
          toast.success(`Tenant "${response.data.businessName}" successfully onboarded!`);
          setCredentials(response.credentials);
          if (onSuccess) onSuccess(response.credentials);
          setBusinessName('');
          setOwnerName('');
          setOwnerEmail('');
          setOwnerPassword('');
          setDbURI('');
          setSelectedFeatures([]);
          setPlan('STARTER');
          setNiche('GYM');
          setTrialDays('30');
          setLightPrimary('#d97706');
          setDarkPrimary('#f59e0b');
          setBlockMobileAccess(false);
        },
        onError: (error) => {
          toast.error(error.message || 'Onboarding failed');
        }
      }
    );
  };

  const currentNicheFeatures = nicheFeaturesMap[niche] || [];
  const renderedFeaturesList = [...currentNicheFeatures, ...globalFeatures];

  const hasAnyErrors = 
    !!businessNameError || 
    !!trialDaysError || 
    !!dbURIError || 
    !!ownerPasswordError || 
    !!ownerNameError || 
    !!ownerEmailError;

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-semibold">
      <div className="flex flex-row items-center justify-between gap-4 border-b border-border dark:border-zinc-700 pb-3">
        <div className="flex items-center gap-3">
          <Link
            to="/superadmin"
            className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition-colors border border-border dark:border-zinc-700"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground dark:text-white">
              Tenant Onboarding
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Deploy and configure new business workspaces on the POS engine
            </p>
          </div>
        </div>
      </div>

      {credentials && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm relative overflow-hidden animate-slide-in w-full">
          <div className="absolute top-0 right-0 p-3">
            <button
              onClick={() => setCredentials(null)}
              className="rounded-lg hover:bg-amber-500/10 p-1 text-amber-600 dark:text-amber-500 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="flex items-start gap-3 pr-6">
            <div className="rounded-full bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-500 border border-amber-500/20 shrink-0">
              <Key className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm tracking-tight text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-550" />
                <span>Default Credentials Seeded</span>
              </h3>
              <p className="text-[10px] text-amber-700/80 dark:text-amber-500/80 font-medium">
                Copy and share these tenant administrator credentials:
              </p>

              <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700">
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Email Address</p>
                    <p className="text-xs font-bold truncate text-foreground dark:text-slate-200">{credentials.email}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.email)}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border dark:hover:bg-zinc-700"
                  >
                    <Clipboard className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700">
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Password</p>
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

      <div className="w-full bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300">
        <form onSubmit={handleOnboard} className="p-5 flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Left Column: Input Fields */}
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => handleBusinessNameChange(e.target.value)}
                    className={`w-full rounded-lg border bg-slate-50/50 dark:bg-zinc-900/20 px-3 py-2 text-xs font-semibold text-foreground dark:text-zinc-200 focus:outline-none focus:ring-1 ${
                      businessNameError
                        ? 'border-red-500 focus:ring-red-500 bg-red-50/5'
                        : businessName && !businessNameError
                        ? 'border-green-500 focus:ring-green-500 bg-green-50/5'
                        : 'border-border dark:border-zinc-700 focus:ring-[var(--accent)]'
                    }`}
                    placeholder="e.g. FitZone Club"
                  />
                  {businessNameError && (
                    <p className="text-[9px] text-red-500 font-bold mt-0.5">{businessNameError}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trial Period (Days, 0 for none)</label>
                  <input
                    type="text"
                    value={trialDays}
                    onChange={(e) => handleTrialDaysChange(e.target.value)}
                    className={`w-full rounded-lg border bg-slate-50/50 dark:bg-zinc-900/20 px-3 py-2 text-xs font-semibold text-foreground dark:text-zinc-200 focus:outline-none focus:ring-1 ${
                      trialDaysError
                        ? 'border-red-500 focus:ring-red-500 bg-red-50/5'
                        : trialDays && !trialDaysError
                        ? 'border-green-500 focus:ring-green-500 bg-green-50/5'
                        : 'border-border dark:border-zinc-700 focus:ring-[var(--accent)]'
                    }`}
                  />
                  {trialDaysError && (
                    <p className="text-[9px] text-red-500 font-bold mt-0.5">{trialDaysError}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Database Connection String (URI) *</label>
                <input
                  type="text"
                  required
                  value={dbURI}
                  onChange={(e) => handleDbURIChange(e.target.value)}
                  className={`w-full rounded-lg border bg-slate-50/50 dark:bg-zinc-900/20 px-3 py-2 text-xs font-mono font-semibold text-foreground dark:text-zinc-200 focus:outline-none focus:ring-1 ${
                    dbURIError
                      ? 'border-red-500 focus:ring-red-500 bg-red-50/5'
                      : dbURI && !dbURIError
                      ? 'border-green-500 focus:ring-green-500 bg-green-50/5'
                      : 'border-border dark:border-zinc-700 focus:ring-[var(--accent)]'
                  }`}
                  placeholder="mongodb://localhost:27017/pos_tenant_database"
                />
                {dbURIError && (
                  <p className="text-[9px] text-red-500 font-bold mt-0.5">{dbURIError}</p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => handleOwnerNameChange(e.target.value)}
                    className={`w-full rounded-lg border bg-slate-50/50 dark:bg-zinc-900/20 px-3 py-2 text-xs font-semibold text-foreground dark:text-zinc-200 focus:outline-none focus:ring-1 ${
                      ownerNameError
                        ? 'border-red-500 focus:ring-red-500 bg-red-50/5'
                        : ownerName && !ownerNameError
                        ? 'border-green-500 focus:ring-green-500 bg-green-50/5'
                        : 'border-border dark:border-zinc-700 focus:ring-[var(--accent)]'
                    }`}
                    placeholder="e.g. John Doe"
                  />
                  {ownerNameError && (
                    <p className="text-[9px] text-red-500 font-bold mt-0.5">{ownerNameError}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Owner Email Address *</label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => handleOwnerEmailChange(e.target.value)}
                    className={`w-full rounded-lg border bg-slate-50/50 dark:bg-zinc-900/20 px-3 py-2 text-xs font-semibold text-foreground dark:text-zinc-200 focus:outline-none focus:ring-1 ${
                      ownerEmailError
                        ? 'border-red-500 focus:ring-red-500 bg-red-50/5'
                        : ownerEmail && !ownerEmailError
                        ? 'border-green-500 focus:ring-green-500 bg-green-50/5'
                        : 'border-border dark:border-zinc-700 focus:ring-[var(--accent)]'
                    }`}
                    placeholder="owner@fitzone.com"
                  />
                  {ownerEmailError && (
                    <p className="text-[9px] text-red-500 font-bold mt-0.5">{ownerEmailError}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Owner Password *</label>
                  <input
                    type="password"
                    required
                    value={ownerPassword}
                    onChange={(e) => handleOwnerPasswordChange(e.target.value)}
                    className={`w-full rounded-lg border bg-slate-50/50 dark:bg-zinc-900/20 px-3 py-2 text-xs font-semibold text-foreground dark:text-zinc-200 focus:outline-none focus:ring-1 ${
                      ownerPasswordError
                        ? 'border-red-500 focus:ring-red-500 bg-red-50/5'
                        : ownerPassword && !ownerPasswordError
                        ? 'border-green-500 focus:ring-green-500 bg-green-50/5'
                        : 'border-border dark:border-zinc-700 focus:ring-[var(--accent)]'
                    }`}
                    placeholder="Secret password..."
                  />
                  {ownerPasswordError && (
                    <p className="text-[9px] text-red-500 font-bold mt-0.5">{ownerPasswordError}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Niche Category</label>
                  <select
                    value={niche}
                    onChange={(e) => {
                      setNiche(e.target.value);
                      setSelectedFeatures([]);
                    }}
                    className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 px-3 py-2 text-xs font-bold text-foreground dark:text-zinc-200 outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    <option value="GYM">Gym & Fitness Center</option>
                    <option value="RESTAURANT">Restaurant & Cafe</option>
                    <option value="GARMENTS">Garments & Retail Boutique</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pricing Tier</label>
                <select
                  value={plan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 px-3 py-2 text-xs font-bold text-foreground dark:text-zinc-200 outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">Select pricing plan...</option>
                  {pricingTiers.map((tier) => (
                    <option key={tier.name} value={tier.name.toUpperCase()}>
                      {tier.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column: Modules, Features, Colors, Mobile Access */}
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Modules</label>
                  <div className="max-h-[105px] overflow-y-auto pr-1 space-y-1 border border-border dark:border-zinc-700 rounded-lg p-2 bg-slate-50/30 dark:bg-zinc-900/10 scrollbar-thin">
                    {allModules.map((mod) => {
                      const isChecked = activeModules.includes(mod.id);
                      return (
                        <button
                          type="button"
                          key={mod.id}
                          onClick={() => handleModuleToggle(mod.id)}
                          className="flex items-center gap-1.5 py-1 px-1 text-[11px] text-left hover:bg-muted/40 rounded transition-colors text-slate-700 dark:text-zinc-200 select-none font-semibold w-full"
                        >
                          {isChecked ? (
                            <CheckSquare className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
                          ) : (
                            <Square className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-650 shrink-0" />
                          )}
                          <span className="truncate">{mod.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Niche Features</label>
                  <div className="max-h-[105px] overflow-y-auto pr-1 space-y-1 border border-border dark:border-zinc-700 rounded-lg p-2 bg-slate-50/30 dark:bg-zinc-900/10 scrollbar-thin">
                    {renderedFeaturesList.map((feat) => {
                      const isChecked = selectedFeatures.includes(feat);
                      return (
                        <button
                          type="button"
                          key={feat}
                          onClick={() => handleFeatureToggle(feat)}
                          className="flex items-center gap-1.5 py-1 px-1 text-[11px] text-left hover:bg-muted/40 rounded transition-colors text-slate-700 dark:text-zinc-200 select-none font-semibold w-full"
                        >
                          {isChecked ? (
                            <CheckSquare className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
                          ) : (
                            <Square className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-650 shrink-0" />
                          )}
                          <span className="truncate">{feat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Access Control</label>
                <div className="p-3 rounded-lg border border-border dark:border-zinc-700 bg-slate-50/30 dark:bg-zinc-900/10 flex items-center justify-between font-semibold">
                  <div>
                    <p className="text-xs font-bold text-foreground dark:text-zinc-200">Block Mobile/Tablet Access</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Restrict workspace logins to desktop terminals</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBlockMobileAccess(!blockMobileAccess)}
                    className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-slate-200 dark:bg-zinc-700"
                    style={{ backgroundColor: blockMobileAccess ? 'var(--accent)' : '' }}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        blockMobileAccess ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Custom Brand Colors (Optional)</label>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border dark:border-zinc-700 bg-slate-50/30 dark:bg-zinc-900/10">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={lightPrimary}
                      onChange={(e) => setLightPrimary(e.target.value)}
                      className="h-7 w-7 border-none cursor-pointer rounded overflow-hidden bg-transparent shrink-0"
                    />
                    <div>
                      <p className="text-[9px] font-bold text-foreground dark:text-zinc-300">Light Accent</p>
                      <p className="text-[9px] text-muted-foreground font-mono truncate max-w-[50px]">{lightPrimary}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={darkPrimary}
                      onChange={(e) => setDarkPrimary(e.target.value)}
                      className="h-7 w-7 border-none cursor-pointer rounded overflow-hidden bg-transparent shrink-0"
                    />
                    <div>
                      <p className="text-[9px] font-bold text-foreground dark:text-zinc-300">Dark Accent</p>
                      <p className="text-[9px] text-muted-foreground font-mono truncate max-w-[50px]">{darkPrimary}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={onboardTenantMutation.isPending || hasAnyErrors}
            className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white hover:opacity-90 font-bold px-4 py-2.5 text-xs transition-opacity shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {onboardTenantMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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
