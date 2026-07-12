import { useState, useEffect } from 'react';
import { getDatabase } from '../../../db/database';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';
import { Layers, Plus, Trash2, Edit2, ShieldAlert, Check } from 'lucide-react';

export const PricingTiersManager = () => {
  const { user } = useAuthStore();
  const [tiers, setTiers] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  const featureGroups = {
    Garments: ['Barcode Printing', 'Size-Color Matrix'],
    Restaurant: ['Kitchen Order Ticket', 'Table Management'],
    Gym: ['BMI Tracker', 'Instructor Payroll']
  };

  useEffect(() => {
    let sub;
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
            features: doc.features || [],
            isActive: doc.isActive !== false
          })));
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const handleFeatureToggle = (feat) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || price === '') {
      toast.error('Plan Name and Monthly Price are required.');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error('Monthly Price must be a positive number.');
      return;
    }

    try {
      const db = await getDatabase();
      const id = editingId || crypto.randomUUID();
      const doc = {
        _id: id,
        tenantId: user?.tenantId || 'superadmin',
        name,
        price: parsedPrice,
        description,
        isActive: true,
        features: selectedFeatures,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      };

      await db.pricing_tiers.upsert(doc);
      toast.success(editingId ? 'Plan updated successfully!' : 'Plan created successfully!');
      
      setName('');
      setPrice('');
      setDescription('');
      setSelectedFeatures([]);
      setEditingId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save plan.');
    }
  };

  const handleEdit = (tier) => {
    setEditingId(tier.id);
    setName(tier.name);
    setPrice(tier.price.toString());
    setDescription(tier.description);
    setSelectedFeatures(tier.features);
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-semibold">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          SaaS Pricing Plans
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure subscription tiers and bundle granular product feature sets
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-[var(--accent)]" />
              <span>Available Pricing Tiers</span>
            </h3>

            {tiers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl bg-slate-50/50">
                <ShieldAlert className="h-10 w-10 text-slate-400 mb-2" />
                <p className="text-sm font-bold text-foreground">No custom plans configured</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Create pricing tiers using the composition panel to deploy custom SaaS workspaces.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="p-5 border border-border rounded-xl bg-slate-50/50 flex flex-col justify-between space-y-4 hover:border-slate-350 hover:shadow-md transition-all duration-200"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-base font-black text-foreground uppercase tracking-wide">
                            {tier.name}
                          </h4>
                          {tier.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {tier.description}
                            </p>
                          )}
                        </div>
                        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white px-3 py-1 text-xs font-black tracking-wide">
                          ${tier.price.toFixed(2)}/mo
                        </span>
                      </div>

                      {tier.features.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {tier.features.map((feat) => (
                            <span
                              key={feat}
                              className="inline-flex items-center rounded-full bg-white border border-border px-2 py-0.5 text-[9px] font-black uppercase text-slate-650"
                            >
                              {feat}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] font-extrabold text-slate-400 italic pt-1">
                          No features assigned to this plan
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => handleEdit(tier)}
                        className="flex-1 py-1.5 rounded-lg border border-border bg-white text-slate-700 hover:bg-slate-50 text-[10px] font-bold transition-colors inline-flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit Plan</span>
                      </button>
                      <button
                        onClick={() => handleDelete(tier.id)}
                        className="p-1.5 rounded-lg border border-border bg-white hover:bg-red-50 text-slate-500 hover:text-red-650 transition-colors shadow-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-border bg-slate-50/50">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="h-5 w-5 text-[var(--accent)]" />
                <span>{editingId ? 'Edit Pricing Plan' : 'Compose Plan Tier'}</span>
              </h3>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Custom Plan Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Growth Tier"
                  className="w-full rounded-lg border border-border bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Monthly Price ($) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 49.00"
                  className="w-full rounded-lg border border-border bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize subscription tier benefits..."
                  rows={2}
                  className="w-full rounded-lg border border-border bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
                />
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-border pb-1">
                  Feature Permissions Matrix
                </h4>

                {Object.entries(featureGroups).map(([niche, feats]) => (
                  <div key={niche} className="space-y-2">
                    <p className="text-[10px] font-extrabold text-slate-500 tracking-wide">
                      {niche} Features
                    </p>
                    <div className="grid gap-2">
                      {feats.map((feat) => {
                        const isChecked = selectedFeatures.includes(feat);
                        return (
                          <div
                            key={feat}
                            onClick={() => handleFeatureToggle(feat)}
                            className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-colors ${
                              isChecked
                                ? 'bg-gradient-to-r from-[var(--accent)]/5 to-[var(--accent-secondary)]/5 border-[var(--accent)] text-foreground'
                                : 'bg-slate-50/30 border-border text-slate-650 hover:bg-slate-50/80'
                            }`}
                          >
                            <span className="text-xs font-bold">{feat}</span>
                            <div
                              className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                                isChecked
                                  ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                                  : 'bg-white border-border text-transparent'
                              }`}
                            >
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setName('');
                      setPrice('');
                      setDescription('');
                      setSelectedFeatures([]);
                    }}
                    className="flex-1 py-3 text-xs font-bold border border-border hover:bg-slate-50 rounded-lg text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white font-bold text-xs rounded-lg hover:opacity-90 transition-opacity shadow-md"
                >
                  {editingId ? 'Update Tier' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingTiersManager;
