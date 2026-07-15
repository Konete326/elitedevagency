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

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('0');
  const [image, setImage] = useState('');
  const [compressing, setCompressing] = useState(false);

  const [selectedPrimaryCategoryId, setSelectedPrimaryCategoryId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [alertLevel, setAlertLevel] = useState('0');
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
            setStock(doc.stock ? doc.stock.toString() : '0');
            setImage(doc.image || '');
            setCostPrice(doc.costPrice ? doc.costPrice.toString() : '');
            setAlertLevel(doc.alertLevel ? doc.alertLevel.toString() : '0');
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
    const parsedStock = parseInt(stock, 10);
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
      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="flex items-center justify-center p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{isEdit ? 'Edit Product' : 'Create Product'}</h1>
            <p className="text-xs text-muted-foreground">{isEdit ? 'Modify your product details and configuration' : 'Add a new catalog item to your store'}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Premium Cotton T-Shirt"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">SKU Code</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. TS-PRM-001"
                  required
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-1">Retail Selling Price (Rs)</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onBlur={checkProfitability}
                  className={`w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                    !isPriceValid || hasProfitConflict
                      ? 'border-[#DC143C] focus:border-[#DC143C] focus:ring-[#DC143C]/20 bg-[#DC143C]/5'
                      : 'border-border focus:ring-ring'
                  }`}
                  placeholder="e.g. 29.99"
                  required
                />
                {(!isPriceValid || hasProfitConflict) && (
                  <p className="text-[10px] text-[#DC143C] font-bold mt-1">
                    {!isPriceValid ? 'Invalid number format' : 'Must exceed cost price'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Wholesale Cost Price (Rs)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  onBlur={checkProfitability}
                  className={`w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                    !isCostPriceValid || hasProfitConflict
                      ? 'border-[#DC143C] focus:border-[#DC143C] focus:ring-[#DC143C]/20 bg-[#DC143C]/5'
                      : 'border-border focus:ring-ring'
                  }`}
                  placeholder="e.g. 10.00"
                />
                {(!isCostPriceValid || hasProfitConflict) && (
                  <p className="text-[10px] text-[#DC143C] font-bold mt-1">
                    {!isCostPriceValid ? 'Invalid format' : 'Must be below retail'}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-1">Primary Category</label>
                <select
                  value={selectedPrimaryCategoryId}
                  onChange={(e) => {
                    setSelectedPrimaryCategoryId(e.target.value);
                    setSelectedSubCategoryId('');
                  }}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {primaryCategories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Sub-Category</label>
                <select
                  value={selectedSubCategoryId}
                  onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                  disabled={!selectedPrimaryCategoryId}
                >
                  <option value="">None (Primary Only)</option>
                  {subCategories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-1">Physical Stock Level</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0"
                  disabled={variants.length > 0}
                />
                {variants.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1 font-semibold">
                    Stock is automatically calculated from variant counts.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Alert Stock Threshold</label>
                <input
                  type="number"
                  value={alertLevel}
                  onChange={(e) => setAlertLevel(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0"
                />
              </div>
            </div>

            {user?.niche === 'restaurant' && (
              <div>
                <label className="block text-sm font-semibold mb-1">Kitchen Dispatch Section</label>
                <select
                  value={kitchenSection}
                  onChange={(e) => setKitchenSection(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                >
                  <option value="Main Kitchen">Main Kitchen</option>
                  <option value="Bakery Section">Bakery Section</option>
                  <option value="Beverage Bar">Beverage Bar</option>
                  <option value="Salad Bar">Salad Bar</option>
                </select>
              </div>
            )}

            <div className="border border-border rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold">Promotional Discount</h4>
                  <p className="text-xs text-muted-foreground">Apply active retail discount settings to this item</p>
                </div>
                <input
                  type="checkbox"
                  checked={promoActive}
                  onChange={(e) => setPromoActive(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-[var(--primary-accent)] focus:ring-ring cursor-pointer"
                />
              </div>

              {promoActive && (
                <div className="grid gap-4 md:grid-cols-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Rate (%)</label>
                    <input
                      type="number"
                      value={promoRate}
                      onChange={(e) => setPromoRate(e.target.value)}
                      className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Fixed Discount Price (Rs)</label>
                    <input
                      type="number"
                      value={promoPrice}
                      onChange={(e) => setPromoPrice(e.target.value)}
                      className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="e.g. 5.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Promo Label</label>
                    <input
                      type="text"
                      value={promoLabel}
                      onChange={(e) => setPromoLabel(e.target.value)}
                      className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="SUMMER"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Product Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-xs focus:outline-none file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-muted file:text-foreground cursor-pointer"
                disabled={compressing}
              />
              {compressing && <p className="text-xs text-muted-foreground mt-1">Compressing image...</p>}
              {image && (
                <div className="mt-3 relative inline-block">
                  <img src={image} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-border" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 shadow-sm"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2">
              <VariantSection 
                variants={variants} 
                setVariants={setVariants} 
                baseSku={sku} 
                productName={name} 
                price={price} 
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-border hover:bg-muted font-bold px-4 py-3 text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-bold px-4 py-3 text-sm transition-colors cursor-pointer"
              >
                <span>{isEdit ? 'Save Changes' : 'Create Product'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ProductForm;
