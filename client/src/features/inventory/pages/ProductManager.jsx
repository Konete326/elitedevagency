import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Database, Plus, FolderPlus, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { compressImageToBase64 } from '../../../lib/imageUtils';
import { CategoryManager } from '../components/CategoryManager';
import { VariantSection } from '../components/VariantSection';

export const ProductManager = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
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
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  useEffect(() => {
    let subProd, subCat;
    getDatabase().then((db) => {
      subProd = db.products
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setProducts(docs);
        });

      subCat = db.categories
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setCategories(docs);
        });
    });

    return () => {
      if (subProd) subProd.unsubscribe();
      if (subCat) subCat.unsubscribe();
    };
  }, []);

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

  const handleCreate = async (e) => {
    e.preventDefault();
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
      const productId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

      const newProduct = {
        _id: productId,
        tenantId: user?.tenantId || 'default',
        name,
        price: parsedPrice,
        sku,
        stock: variants.length > 0 ? variants.reduce((sum, v) => sum + v.stock, 0) : parsedStock,
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString(),
        image: image || '',
        imageSynced: image ? false : true,
        categoryId: selectedSubCategoryId || selectedPrimaryCategoryId || '',
        costPrice: parsedCostPrice,
        alertLevel: parsedAlertLevel,
        promotionalDiscount: promoActive ? {
          rate: parseFloat(promoRate) || 0,
          price: parseFloat(promoPrice) || 0,
          label: promoLabel || 'Discount'
        } : null,
        variants: variants,
        kitchenSection: user?.niche === 'restaurant' ? kitchenSection : 'Main Kitchen'
      };

      await db.products.insert(newProduct);
      toast.success('Product created successfully');

      setName('');
      setPrice('');
      setSku('');
      setStock('0');
      setImage('');
      setSelectedPrimaryCategoryId('');
      setSelectedSubCategoryId('');
      setCostPrice('');
      setAlertLevel('0');
      setPromoActive(false);
      setPromoRate('');
      setPromoPrice('');
      setPromoLabel('');
      setVariants([]);
      setKitchenSection('Main Kitchen');
    } catch {
      toast.error('Failed to create product');
    }
  };

  const handleSoftDelete = async (id) => {
    try {
      const db = await getDatabase();
      const productDoc = await db.products.findOne(id).exec();
      if (productDoc) {
        await productDoc.patch({
          isDeleted: true,
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
        toast.success('Product deleted successfully');
      }
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const primaryCategories = categories.filter(c => !c.parentCategoryId);
  const subCategories = categories.filter(c => c.parentCategoryId === selectedPrimaryCategoryId);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-300">
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted transition-colors mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="font-extrabold text-lg tracking-tight">Inventory Manager</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCategoryManagerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-bold transition-colors"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Categories</span>
          </button>
          <div className="hidden sm:block text-right ml-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{user?.role}</p>
            <p className="text-sm font-black">{user?.name}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-fit">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight">Create Product</h2>
              <p className="text-sm text-muted-foreground">Add a new item to your local store catalog</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Graphic Tee"
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-1">Primary Category</label>
                  <select
                    value={selectedPrimaryCategoryId}
                    onChange={(e) => {
                      setSelectedPrimaryCategoryId(e.target.value);
                      setSelectedSubCategoryId('');
                    }}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={!selectedPrimaryCategoryId}
                  >
                    <option value="">Select Sub-Category</option>
                    {subCategories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {user?.niche === 'restaurant' && (
                <div>
                  <label className="block text-sm font-semibold mb-1">Kitchen Section</label>
                  <select
                    value={kitchenSection}
                    onChange={(e) => setKitchenSection(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Main Kitchen">Main Kitchen</option>
                    <option value="BBQ">BBQ Section</option>
                    <option value="Fast Food">Fast Food Section</option>
                    <option value="Desserts">Desserts / Beverages</option>
                  </select>
                </div>
              )}

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-1">Base SKU Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. GR-TEE-01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. 29.99"
                  />
                </div>
              </div>

              <div className="grid gap-4 grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. 10.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Alert Level</label>
                  <input
                    type="number"
                    value={alertLevel}
                    onChange={(e) => setAlertLevel(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Base Stock</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={variants.length > 0}
                  />
                </div>
              </div>

              <div className="border border-border rounded-xl p-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Percent className="h-4 w-4 text-accent" />
                    <span className="text-xs font-bold">Promotional Discount</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={promoActive}
                    onChange={(e) => setPromoActive(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                </div>

                {promoActive && (
                  <div className="grid gap-2 grid-cols-3 mt-3 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-0.5">Rate (%)</label>
                      <input
                        type="number"
                        value={promoRate}
                        onChange={(e) => setPromoRate(e.target.value)}
                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-0.5">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={promoPrice}
                        onChange={(e) => setPromoPrice(e.target.value)}
                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground mb-0.5">Label</label>
                      <input
                        type="text"
                        value={promoLabel}
                        onChange={(e) => setPromoLabel(e.target.value)}
                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
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
                  <div className="mt-3 relative inline-block animate-fade-in">
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

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-bold px-4 py-3 text-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Catalog Item</span>
              </button>
            </form>
          </div>

          <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-fit">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Product Catalog</h2>
                <p className="text-sm text-muted-foreground">Retail catalog items in local database</p>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No products found in database.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3.5 px-4 font-bold">SKU</th>
                      <th className="py-3.5 px-4 font-bold">Name</th>
                      <th className="py-3.5 px-4 font-bold">Price</th>
                      <th className="py-3.5 px-4 font-bold">Stock</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm font-semibold">
                    {products.map((product) => (
                      <tr key={product._id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-4 px-4 font-mono text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Database className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <span>{product.sku}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold truncate max-w-[200px]">
                          <div className="flex items-center gap-3">
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-10 w-10 object-cover rounded-lg border border-border shrink-0"
                              />
                            )}
                            <div>
                              <span>{product.name}</span>
                              {product.variants && product.variants.length > 0 && (
                                <p className="text-[10px] text-muted-foreground font-semibold">
                                  {product.variants.length} Variants ({product.variants.map(v => `${v.size}/${v.color}`).join(', ')})
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-extrabold text-accent">${product.price.toFixed(2)}</td>
                        <td className="py-4 px-4 font-medium">
                          {product.stock <= product.alertLevel ? (
                            <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
                              {product.stock} Alert
                            </span>
                          ) : (
                            <span>{product.stock} Units</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleSoftDelete(product._id)}
                            className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 p-2 transition-colors border border-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {categoryManagerOpen && (
        <CategoryManager onClose={() => setCategoryManagerOpen(false)} />
      )}
    </div>
  );
};

export default ProductManager;
