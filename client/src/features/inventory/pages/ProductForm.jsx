import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { compressImageToBase64 } from '../../../lib/imageUtils';
import { VariantSection } from '../components/VariantSection';

export const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuthStore();

  const placeholders = {
    name: user?.niche === 'restaurant'
      ? 'e.g. Chicken Club Sandwich'
      : user?.niche === 'gym'
        ? 'e.g. Whey Protein Powder'
        : 'e.g. Premium Cotton T-Shirt',
    sku: user?.niche === 'restaurant'
      ? 'e.g. FD-001'
      : user?.niche === 'gym'
        ? 'e.g. GYM-001'
        : 'e.g. TS-PRM-001',
    cost: user?.niche === 'restaurant'
      ? 'e.g. 150.00'
      : user?.niche === 'gym'
        ? 'e.g. 1200.00'
        : 'e.g. 500.00',
    price: user?.niche === 'restaurant'
      ? 'e.g. 299.00'
      : user?.niche === 'gym'
        ? 'e.g. 1999.00'
        : 'e.g. 999.00',
    stock: 'e.g. 50',
    alert: 'e.g. 10'
  };

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState('');
  const [compressing, setCompressing] = useState(false);

  const [selectedPrimaryCategoryId, setSelectedPrimaryCategoryId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [alertLevel, setAlertLevel] = useState('');
  const [promoActive, setPromoActive] = useState(false);
  const [promoRate, setPromoRate] = useState('');
  const [promoPrice, setPromoPrice] = useState('');
  const [promoLabel, setPromoLabel] = useState('');
  const [variants, setVariants] = useState([]);
  const [kitchenSection, setKitchenSection] = useState('Main Kitchen');

  useEffect(() => {
    let subCat;
    getDatabase().then((db) => {
      subCat = db.categories
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setCategories(docs);
        });

      if (isEdit) {
        db.products.findOne(id).exec().then((doc) => {
          if (doc) {
            setName(doc.name || '');
            setPrice(doc.price ? doc.price.toString() : '');
            setSku(doc.sku || '');
            setStock(doc.stock ? doc.stock.toString() : '');
            setImage(doc.image || '');
            setCostPrice(doc.costPrice ? doc.costPrice.toString() : '');
            setAlertLevel(doc.alertLevel ? doc.alertLevel.toString() : '');
            setKitchenSection(doc.kitchenSection || 'Main Kitchen');
            setVariants(doc.variants || []);
            
            if (doc.categoryId) {
              db.categories.findOne(doc.categoryId).exec().then((catDoc) => {
                if (catDoc) {
                  if (catDoc.parentCategoryId) {
                    setSelectedPrimaryCategoryId(catDoc.parentCategoryId);
                    setSelectedSubCategoryId(catDoc._id);
                  } else {
                    setSelectedPrimaryCategoryId(catDoc._id);
                    setSelectedSubCategoryId('');
                  }
                }
              });
            }

            if (doc.promotionalDiscount) {
              setPromoActive(true);
              setPromoRate(doc.promotionalDiscount.rate?.toString() || '');
              setPromoPrice(doc.promotionalDiscount.price?.toString() || '');
              setPromoLabel(doc.promotionalDiscount.label || '');
            }
          }
        });
      }
    });

    return () => {
      if (subCat) subCat.unsubscribe();
    };
  }, [id, isEdit]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCompressing(true);
    try {
      const base64 = await compressImageToBase64(file);
      setImage(base64);
    } catch {
      toast.error('Failed to compress image');
    } finally {
      setCompressing(false);
    }
  };

  const handleAutoGenerateSku = async () => {
    try {
      const db = await getDatabase();
      const allProds = await db.products.find({ selector: { isDeleted: false } }).exec();
      const prefix = user?.niche === 'restaurant' ? 'FD' : user?.niche === 'gym' ? 'GYM' : 'SKU';
      
      let maxNum = 1000;
      const regex = new RegExp(`^${prefix}-(\\d+)$`);
      
      allProds.forEach(p => {
        if (p.sku) {
          const match = p.sku.toUpperCase().match(regex);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) {
              maxNum = num;
            }
          }
        }
      });
      
      const nextNum = maxNum + 1;
      setSku(`${prefix}-${nextNum}`);
      toast.success(`SKU generated: ${prefix}-${nextNum}`);
    } catch {
      toast.error('Failed to auto-generate SKU');
    }
  };

  const numRegex = /^[0-9]+(\.[0-9]{1,2})?$/;
  const isPriceValid = !price || numRegex.test(price);
  const isCostPriceValid = !costPrice || numRegex.test(costPrice);

  const parsedPriceNum = parseFloat(price) || 0;
  const parsedCostPriceNum = parseFloat(costPrice) || 0;
  const hasProfitConflict = parsedPriceNum > 0 && parsedCostPriceNum > 0 && parsedPriceNum <= parsedCostPriceNum;

  const checkProfitability = () => {
    const pVal = parseFloat(price) || 0;
    const cVal = parseFloat(costPrice) || 0;
    if (pVal > 0 && cVal > 0 && pVal <= cVal) {
      toast.warning('Selling price must be greater than the wholesale cost price to maintain profit margins.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPriceValid || !isCostPriceValid) {
      toast.error('Please fix the highlighted invalid input fields before proceeding.');
      return;
    }

    if (hasProfitConflict) {
      toast.error('Selling price must be greater than the wholesale cost price to maintain profit margins.');
      return;
    }

    if (!name || !price || !sku) {
      toast.error('Product name, price, and SKU are required');
      return;
    }

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10) || 0;
    const parsedCostPrice = parseFloat(costPrice) || 0;
    const parsedAlertLevel = parseInt(alertLevel, 10) || 0;

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      const db = await getDatabase();
      const finalCategoryId = selectedSubCategoryId || selectedPrimaryCategoryId || '';

      const updatedPayload = {
        name,
        price: parsedPrice,
        sku,
        stock: variants.length > 0 ? variants.reduce((sum, v) => sum + v.stock, 0) : parsedStock,
        image: image || '',
        categoryId: finalCategoryId,
        costPrice: parsedCostPrice,
        alertLevel: parsedAlertLevel,
        promotionalDiscount: promoActive ? {
          rate: parseFloat(promoRate) || 0,
          price: parseFloat(promoPrice) || 0,
          label: promoLabel || 'Discount'
        } : null,
        variants: variants,
        kitchenSection: user?.niche === 'restaurant' ? kitchenSection : 'Main Kitchen',
        isSynced: false,
        updatedAt: new Date().toISOString()
      };

      if (isEdit) {
        const productDoc = await db.products.findOne(id).exec();
        if (productDoc) {
          updatedPayload.imageSynced = image === productDoc.image ? productDoc.imageSynced : false;
          await productDoc.patch(updatedPayload);
          toast.success('Product updated successfully');
        } else {
          toast.error('Product not found');
        }
      } else {
        const productId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        const newProduct = {
          _id: productId,
          tenantId: user?.tenantId || 'default',
          imageSynced: image ? false : true,
          isDeleted: false,
          ...updatedPayload
        };
        await db.products.insert(newProduct);
        toast.success('Product created successfully');
      }

      navigate('/inventory');
    } catch {
      toast.error(isEdit ? 'Failed to update product' : 'Failed to create product');
    }
  };

  const primaryCategories = categories.filter(c => !c.parentCategoryId);
  const subCategories = categories.filter(c => c.parentCategoryId === selectedPrimaryCategoryId);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 overflow-y-auto p-4 md:p-5 w-full space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="flex items-center justify-center p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-none">{isEdit ? 'Edit Product' : 'Create Product'}</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">{isEdit ? 'Modify your product details and configuration' : 'Add a new catalog item to your store'}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Product Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={placeholders.name}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">SKU Code *</label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateSku}
                    className="text-[9px] font-black text-[var(--primary-accent)] hover:underline focus:outline-none cursor-pointer"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full rounded-lg border border-border bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={placeholders.sku}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Retail Selling Price (Rs) *</label>
                <input
                  type="number"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onBlur={checkProfitability}
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 transition-all bg-slate-50 dark:bg-zinc-900/50 ${
                    !isPriceValid || hasProfitConflict
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-500/5 text-rose-900 dark:text-rose-200'
                      : 'border-border focus:ring-ring text-foreground'
                  }`}
                  placeholder={placeholders.price}
                  required
                />
                {(!isPriceValid || hasProfitConflict) && (
                  <p className="text-[9px] text-rose-500 font-bold mt-0.5">
                    {!isPriceValid ? 'Invalid number format' : 'Must exceed cost price'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Wholesale Cost Price (Rs)</label>
                <input
                  type="number"
                  step="any"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  onBlur={checkProfitability}
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 transition-all bg-slate-50 dark:bg-zinc-900/50 ${
                    !isCostPriceValid || hasProfitConflict
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-500/5 text-rose-900 dark:text-rose-200'
                      : 'border-border focus:ring-ring text-foreground'
                  }`}
                  placeholder={placeholders.cost}
                />
                {(!isCostPriceValid || hasProfitConflict) && (
                  <p className="text-[9px] text-rose-500 font-bold mt-0.5">
                    {!isCostPriceValid ? 'Invalid format' : 'Must be below retail'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Physical Stock Level</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full rounded-lg border border-border bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={placeholders.stock}
                  disabled={variants.length > 0}
                />
                {variants.length > 0 && (
                  <p className="text-[9px] text-muted-foreground mt-0.5 font-bold">
                    Stock from variants.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Alert Stock Threshold</label>
                <input
                  type="number"
                  value={alertLevel}
                  onChange={(e) => setAlertLevel(e.target.value)}
                  className="w-full rounded-lg border border-border bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={placeholders.alert}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Primary Category</label>
                <select
                  value={selectedPrimaryCategoryId}
                  onChange={(e) => {
                    setSelectedPrimaryCategoryId(e.target.value);
                    setSelectedSubCategoryId('');
                  }}
                  className="w-full rounded-lg border border-border bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {primaryCategories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Sub-Category</label>
                <select
                  value={selectedSubCategoryId}
                  onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                  disabled={!selectedPrimaryCategoryId}
                >
                  <option value="">None (Primary Only)</option>
                  {subCategories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {user?.niche === 'restaurant' ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Kitchen Dispatch Section</label>
                  <select
                    value={kitchenSection}
                    onChange={(e) => setKitchenSection(e.target.value)}
                    className="w-full rounded-lg border border-border bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                  >
                    <option value="Main Kitchen">Main Kitchen</option>
                    <option value="Bakery Section">Bakery Section</option>
                    <option value="Beverage Bar">Beverage Bar</option>
                    <option value="Salad Bar">Salad Bar</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Product Image (Optional)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="flex-1 rounded-lg border border-border bg-slate-50 dark:bg-zinc-900/50 px-2 py-1 text-[10px] font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-muted file:text-foreground cursor-pointer"
                      disabled={compressing}
                    />
                    {image && (
                      <div className="relative shrink-0">
                        <img src={image} alt="Preview" className="h-8 w-8 object-cover rounded-md border border-border" />
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 shadow-sm border border-white"
                        >
                          <Trash2 className="h-2.5 w-2.5 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                  {compressing && <p className="text-[9px] text-muted-foreground mt-0.5">Compressing image...</p>}
                  <div className="mt-1 flex items-center">
                    {image ? (
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900 truncate max-w-full">
                        Active Image: {image.startsWith('http') ? image : 'Local Image File'}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 font-semibold">No product image uploaded</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {user?.niche === 'restaurant' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Product Image (Optional)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1 rounded-lg border border-border bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-muted file:text-foreground cursor-pointer"
                    disabled={compressing}
                  />
                  {image && (
                    <div className="relative shrink-0">
                      <img src={image} alt="Preview" className="h-8 w-8 object-cover rounded-md border border-border" />
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 shadow-sm border border-white"
                      >
                        <Trash2 className="h-2.5 w-2.5 text-white" />
                      </button>
                    </div>
                  )}
                </div>
                {compressing && <p className="text-[9px] text-muted-foreground mt-0.5">Compressing image...</p>}
                <div className="mt-1 flex items-center">
                  {image ? (
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900 truncate max-w-full">
                      Active Image: {image.startsWith('http') ? image : 'Local Image File'}
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-semibold">No product image uploaded</span>
                  )}
                </div>
              </div>
            )}

            <div className="border border-border rounded-xl p-2.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black tracking-tight">Promotional Discount</h4>
                  <p className="text-[10px] text-muted-foreground font-semibold">Apply active retail discount settings to this item</p>
                </div>
                <input
                  type="checkbox"
                  checked={promoActive}
                  onChange={(e) => setPromoActive(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border text-[var(--primary-accent)] focus:ring-ring cursor-pointer"
                />
              </div>

              {promoActive && (
                <div className="grid gap-2.5 md:grid-cols-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Rate (%)</label>
                    <input
                      type="number"
                      value={promoRate}
                      onChange={(e) => setPromoRate(e.target.value)}
                      className="w-full rounded border border-border bg-slate-50 dark:bg-zinc-900/50 px-2 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Fixed Discount Price (Rs)</label>
                    <input
                      type="number"
                      value={promoPrice}
                      onChange={(e) => setPromoPrice(e.target.value)}
                      className="w-full rounded border border-border bg-slate-50 dark:bg-zinc-900/50 px-2 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="e.g. 5.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Promo Label</label>
                    <input
                      type="text"
                      value={promoLabel}
                      onChange={(e) => setPromoLabel(e.target.value)}
                      className="w-full rounded border border-border bg-slate-50 dark:bg-zinc-900/50 px-2 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="SUMMER"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-1">
              <VariantSection 
                variants={variants} 
                setVariants={setVariants} 
                baseSku={sku} 
                productName={name} 
                price={price} 
              />
            </div>

            <div className="flex justify-end gap-3 pt-2.5 border-t border-border dark:border-zinc-700">
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="px-4 py-2 border border-slate-200 dark:border-zinc-650 hover:bg-slate-50 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-250 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={compressing}
                className="px-4 py-2 bg-[var(--primary-accent)] text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-lg transition-opacity shadow-sm cursor-pointer"
              >
                <span>{compressing ? 'Compressing...' : (isEdit ? 'Save Changes' : 'Create Product')}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ProductForm;
