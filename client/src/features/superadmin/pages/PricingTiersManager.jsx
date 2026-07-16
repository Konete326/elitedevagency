import { useState, useEffect } from 'react';
import { getDatabase } from '../../../db/database';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';
import { Layers, Plus, Trash2, Edit2, Check, ChevronLeft } from 'lucide-react';
import { AdminTable } from '../../../components/ui/AdminTable';
import { useModalStore } from '../../../store/useModalStore';
import { CardSkeleton } from '../../../components/ui/CardSkeleton';

export const PricingTiersManager = () => {
  const { user } = useAuthStore();
  const [tiers, setTiers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { openModal } = useModalStore();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [niche, setNiche] = useState('Garments');
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');

  // Real-time regex validation rules
  const nameRegex = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,24}$/;
  const priceRegex = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

  const featureGroups = {
    Garments: ['Barcode Printing', 'Size-Color Matrix'],
    Restaurant: ['Kitchen Order Ticket', 'Table Management'],
    Gym: ['BMI Tracker', 'Instructor Payroll']
  };

  useEffect(() => {
    let sub;
    setIsLoading(true);
    getDatabase().then((db) => {
      sub = db.pricing_tiers
        .find({
          selector: {
            isDeleted: false
          }
        })
        .$.subscribe((docs) => {
          setTiers(docs.map((doc) => ({
            id: doc._id,
            name: doc.name,
            price: doc.price,
            description: doc.description || '',
            niche: doc.niche || 'Garments',
            features: doc.features || [],
            isActive: doc.isActive !== false
          })));
          setIsLoading(false);
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const handleNameChange = (val) => {
    setName(val);
    if (!val) {
      setNameError('Plan name is required.');
    } else if (!nameRegex.test(val)) {
      setNameError('Must be 3-25 characters. Alphanumeric, spaces, or hyphens only.');
    } else {
      setNameError('');
    }
  };

  const handlePriceChange = (val) => {
    setPrice(val);
    if (val === '') {
      setPriceError('Price is required.');
    } else if (!priceRegex.test(val)) {
      setPriceError('Must be a valid positive amount (e.g. 19.99 or 49).');
    } else {
      setPriceError('');
    }
  };

  const handleFeatureToggle = (feat) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // final validation check
    if (!name || !nameRegex.test(name)) {
      toast.error('Please enter a valid plan name.');
      return;
    }
    if (price === '' || !priceRegex.test(price)) {
      toast.error('Please enter a valid monthly price.');
      return;
    }

    const parsedPrice = parseFloat(price);

    try {
      const db = await getDatabase();
      const id = editingId || crypto.randomUUID();
      const doc = {
        _id: id,
        tenantId: user?.tenantId || 'superadmin',
        name,
        price: parsedPrice,
        description,
        niche,
        isActive: true,
        features: selectedFeatures,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      };

      await db.pricing_tiers.upsert(doc);
      toast.success(editingId ? 'Plan updated successfully!' : 'Plan created successfully!');
      
      // Reset form state
      setName('');
      setPrice('');
      setDescription('');
      setNiche('Garments');
      setSelectedFeatures([]);
      setEditingId(null);
      setIsFormOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save plan.');
    }
  };

  const handleEdit = (tier) => {
    setEditingId(tier.id);
    setName(tier.name);
    setPrice(tier.price.toString());
    setDescription(tier.description);
    setNiche(tier.niche || 'Garments');
    setSelectedFeatures(tier.features);
    setNameError('');
    setPriceError('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const db = await getDatabase();
      const doc = await db.pricing_tiers.findOne(id).exec();
      if (doc) {
        await doc.patch({
          isDeleted: true,
          updatedAt: new Date().toISOString()
        });
        toast.success('Plan deleted successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete plan.');
    }
  };

  const handleBackToList = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setName('');
    setPrice('');
    setDescription('');
    setNiche('Garments');
    setSelectedFeatures([]);
    setNameError('');
    setPriceError('');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-semibold">
      <div className="flex flex-row items-center justify-between gap-4 border-b border-border dark:border-zinc-700 pb-3">
        <div className="flex items-center gap-3">
          {isFormOpen && (
            <button
              type="button"
              onClick={handleBackToList}
              className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition-colors border border-border dark:border-zinc-700"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground dark:text-white">
              {isFormOpen ? (editingId ? 'Edit Pricing Plan' : 'Compose Plan Tier') : 'SaaS Pricing Plans'}
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isFormOpen ? 'Configure subscription tier parameters and feature set' : 'Configure subscription tiers and bundle granular product feature sets'}
            </p>
          </div>
        </div>
      </div>

      {isFormOpen ? (
        <div className="flex justify-center items-center py-2">
          <div className="max-w-4xl w-full bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300">
            <form onSubmit={handleSave} className="p-5 flex flex-col space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* Left Column: Form Fields */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Custom Plan Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Growth Tier"
                      className={`w-full rounded-lg border bg-slate-50/50 dark:bg-zinc-900/20 px-3 py-2 text-xs font-semibold text-foreground dark:text-zinc-200 focus:outline-none focus:ring-1 ${
                        nameError
                          ? 'border-red-500 focus:ring-red-500 bg-red-50/5'
                          : name && !nameError
                          ? 'border-green-500 focus:ring-green-500 bg-green-50/5'
                          : 'border-border dark:border-zinc-700 focus:ring-[var(--accent)]'
                      }`}
                    />
                    {nameError && (
                      <p className="text-[9px] text-red-500 font-bold mt-0.5">{nameError}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Monthly Price (PKR) *
                    </label>
                    <input
                      type="text"
                      required
                      value={price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      placeholder="e.g. 49.00"
                      className={`w-full rounded-lg border bg-slate-50/50 dark:bg-zinc-900/20 px-3 py-2 text-xs font-semibold text-foreground dark:text-zinc-200 focus:outline-none focus:ring-1 ${
                        priceError
                          ? 'border-red-500 focus:ring-red-500 bg-red-50/5'
                          : price && !priceError
                          ? 'border-green-500 focus:ring-green-500 bg-green-50/5'
                          : 'border-border dark:border-zinc-700 focus:ring-[var(--accent)]'
                      }`}
                    />
                    {priceError && (
                      <p className="text-[9px] text-red-500 font-bold mt-0.5">{priceError}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Target Niche / Category *
                    </label>
                    <select
                      value={niche}
                      onChange={(e) => {
                        setNiche(e.target.value);
                        setSelectedFeatures([]);
                      }}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 px-3 py-2 text-xs font-semibold text-foreground dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    >
                      <option value="Garments">Garments</option>
                      <option value="Restaurant">Restaurant</option>
                      <option value="Gym">Gym</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Summarize subscription tier benefits..."
                      rows={2}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 px-3 py-2 text-xs font-semibold text-foreground dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
                    />
                  </div>
                </div>

                {/* Right Column: Feature Permission Matrix */}
                <div className="space-y-2">
                  <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-border dark:border-zinc-700 pb-1">
                    Feature Permissions Matrix
                  </h4>

                  {/* Scrollable container showing only features matching the selected niche */}
                  <div className="max-h-[170px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
                    <div className="space-y-1">
                      <p className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 tracking-wide">
                        {niche} Features
                      </p>
                      <div className="grid gap-1">
                        {(featureGroups[niche] || []).map((feat) => {
                          const isChecked = selectedFeatures.includes(feat);
                          return (
                            <div
                              key={feat}
                              onClick={() => handleFeatureToggle(feat)}
                              className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                                isChecked
                                  ? 'bg-[var(--accent)]/5 border-[var(--accent)] text-foreground dark:text-zinc-200'
                                  : 'bg-slate-50/30 dark:bg-zinc-900/10 border-border dark:border-zinc-700 text-slate-655 dark:text-zinc-350 hover:bg-slate-50/80 dark:hover:bg-zinc-800/80'
                              }`}
                            >
                              <span className="text-[11px] font-bold">{feat}</span>
                              <div
                                className={`h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                                    : 'bg-white dark:bg-zinc-800 border-border dark:border-zinc-700 text-transparent'
                                }`}
                              >
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-border dark:border-zinc-700 justify-end">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="px-4 py-2 text-xs font-bold border border-border dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-lg text-slate-700 dark:text-zinc-250 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!nameError || !!priceError || !name || price === ''}
                  className="px-5 py-2 bg-[var(--accent)] text-white font-bold text-xs rounded-lg hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingId ? 'Update Tier' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : isLoading ? (
        <CardSkeleton count={3} />
      ) : (
        <AdminTable
          title="Available Pricing Tiers"
          description="Configure subscription tiers and default system permissions"
          icon={Layers}
          actionButton={
            <button
              onClick={() => {
                setEditingId(null);
                setName('');
                setPrice('');
                setDescription('');
                setNiche('Garments');
                setSelectedFeatures([]);
                setNameError('');
                setPriceError('');
                setIsFormOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--accent)] text-white font-bold text-xs rounded-lg hover:opacity-90 transition-opacity shadow-md select-none cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Pricing Tier</span>
            </button>
          }
          data={tiers}
          pageSize={7}
          viewType="grid"
          renderGridItem={(tier) => (
            <div
              key={tier.id}
              className="p-4 border border-border dark:border-zinc-700 rounded-xl bg-slate-50/50 dark:bg-zinc-900/20 flex flex-col justify-between space-y-3 hover:border-slate-350 dark:hover:border-zinc-600 hover:shadow-md transition-all duration-200"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-foreground dark:text-white uppercase tracking-wide truncate">
                        {tier.name}
                      </h4>
                      <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-zinc-700 px-1.5 py-0.5 text-[8px] font-black uppercase text-slate-600 dark:text-zinc-300">
                        {tier.niche}
                      </span>
                    </div>
                    {tier.description && (
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                        {tier.description}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[var(--accent)] text-white px-2 py-0.5 text-[10px] font-black tracking-wide shrink-0">
                    Rs. {tier.price.toFixed(2)}/mo
                  </span>
                </div>

                {tier.features.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {tier.features.map((feat) => (
                      <span
                        key={feat}
                        className="inline-flex items-center rounded-full bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 px-1.5 py-0.5 text-[8px] font-black uppercase text-slate-600 dark:text-zinc-300"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] font-extrabold text-slate-400 italic pt-1">
                    No features assigned to this plan
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 pt-1.5 border-t border-border dark:border-zinc-700">
                <button
                  onClick={() => handleEdit(tier)}
                  className="flex-1 py-1 rounded-lg border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 text-[9px] font-bold transition-colors inline-flex items-center justify-center gap-1 shadow-sm"
                >
                  <Edit2 className="h-2.5 w-2.5" />
                  <span>Edit Plan</span>
                </button>
                <button
                  onClick={() => {
                    openModal({
                      title: 'Delete Pricing Plan',
                      message: 'Are you sure you want to delete this pricing plan? This action cannot be undone.',
                      type: 'danger',
                      confirmText: 'Delete Plan',
                      onConfirm: () => handleDelete(tier.id)
                    });
                  }}
                  className="p-1 rounded-lg border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-650 dark:hover:text-red-400 transition-colors shadow-sm"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
};

export default PricingTiersManager;
