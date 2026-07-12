import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Plus, X, Tag, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { compressImageToBase64 } from '../../../lib/imageUtils';

export const DealsManager = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dealName, setDealName] = useState('');
  const [dealPrice, setDealPrice] = useState('');
  const [dealDesc, setDealDesc] = useState('');
  const [dealImage, setDealImage] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const [currentProductId, setCurrentProductId] = useState('');
  const [currentVariantSku, setCurrentVariantSku] = useState('');
  const [currentQty, setCurrentQty] = useState('1');

  useEffect(() => {
    let subDeals, subProducts;
    getDatabase().then((db) => {
      subDeals = db.deals
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setDeals(docs);
        });

      subProducts = db.products
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setProducts(docs);
        });
    });

    return () => {
      if (subDeals) subDeals.unsubscribe();
      if (subProducts) subProducts.unsubscribe();
    };
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCompressing(true);
    try {
      const base64 = await compressImageToBase64(file);
      setDealImage(base64);
    } catch {
      toast.error('Failed to compress image');
    } finally {
      setCompressing(false);
    }
  };

  const selectedProduct = products.find(p => p._id === currentProductId);
  const productVariants = selectedProduct?.variants || [];

  const handleAddItem = () => {
    if (!currentProductId) {
      toast.error('Please select a product');
      return;
    }

    const qty = parseInt(currentQty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Quantity must be a positive integer');
      return;
    }

    const prod = products.find((p) => p._id === currentProductId);
    if (!prod) return;

    let variantName = '';
    if (currentVariantSku) {
      const v = prod.variants.find((x) => x.sku === currentVariantSku);
      if (v) {
        variantName = ` (${v.size}/${v.color})`;
      }
    }

    const existingIndex = selectedItems.findIndex(
      (item) => item.productId === currentProductId && item.variantSku === currentVariantSku
    );

    if (existingIndex !== -1) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += qty;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: currentProductId,
          variantSku: currentVariantSku,
          name: prod.name + variantName,
          quantity: qty
        }
      ]);
    }

    setCurrentProductId('');
    setCurrentVariantSku('');
    setCurrentQty('1');
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    if (!dealName || !dealPrice) {
      toast.error('Deal Name and Price are required');
      return;
    }

    const priceNum = parseFloat(dealPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Please add at least one item to the deal');
      return;
    }

    try {
      const db = await getDatabase();
      const dealId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

      await db.deals.insert({
        _id: dealId,
        tenantId: user?.tenantId || 'default',
        name: dealName,
        price: priceNum,
        description: dealDesc,
        image: dealImage,
        imageSynced: false,
        items: selectedItems.map((item) => ({
          productId: item.productId,
          variantSku: item.variantSku,
          quantity: item.quantity
        })),
        isActive: true,
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      });

      toast.success('Deal package created successfully');
      setIsModalOpen(false);
      setDealName('');
      setDealPrice('');
      setDealDesc('');
      setDealImage('');
      setSelectedItems([]);
    } catch {
      toast.error('Failed to create deal package');
    }
  };

  const handleDeleteDeal = async (dealId) => {
    try {
      const db = await getDatabase();
      const doc = await db.deals.findOne(dealId).exec();
      if (doc) {
        await doc.patch({
          isDeleted: true,
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
        toast.success('Deal package deleted successfully');
      }
    } catch {
      toast.error('Failed to delete deal');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 px-6 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center p-2 rounded-lg border border-border dark:border-zinc-700 hover:bg-muted transition-colors mr-2 text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="font-extrabold text-lg tracking-tight">Combo Deals & Packages</span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Create Deal Package</span>
        </button>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
        <div className="rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
          <div className="overflow-x-auto w-full">
            {deals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-6">
                <Tag className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-semibold text-foreground">No Deals Configured</p>
                <p className="text-xs text-muted-foreground mt-1">Onboard your first combo package to get started</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[40rem]">
                <thead>
                  <tr className="border-b border-border dark:border-zinc-700 bg-slate-100/60 dark:bg-zinc-800/40 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Image</th>
                    <th className="py-3.5 px-6">Package Name</th>
                    <th className="py-3.5 px-6">Price</th>
                    <th className="py-3.5 px-6">Included Items</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-zinc-700 text-sm font-semibold">
                  {deals.map((deal) => (
                    <tr key={deal._id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-4 px-6">
                        {deal.image ? (
                          <img src={deal.image} alt={deal.name} className="h-10 w-10 object-cover rounded-lg border border-border dark:border-zinc-750" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-border dark:border-zinc-700 flex items-center justify-center text-muted-foreground">
                            <Coffee className="h-4 w-4" />
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-foreground">{deal.name}</td>
                      <td className="py-4 px-6 font-bold text-accent">${deal.price.toFixed(2)}</td>
                      <td className="py-4 px-6 text-xs text-muted-foreground font-medium">
                        <div className="flex flex-col gap-0.5">
                          {(deal.items || []).map((item, idx) => {
                            const prod = products.find(p => p._id === item.productId);
                            let vName = '';
                            if (item.variantSku && prod?.variants) {
                              const v = prod.variants.find(x => x.sku === item.variantSku);
                              if (v) vName = ` (${v.size}/${v.color})`;
                            }
                            return (
                              <span key={idx}>
                                • {item.quantity}x {prod ? prod.name : 'Unknown Product'}{vName}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDeleteDeal(deal._id)}
                          className="p-2 hover:bg-red-500/10 text-red-500 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
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
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-1.5">
              <Tag className="h-5 w-5 text-accent" /> Create Combo Deal Package
            </h3>
            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Package Name *</label>
                  <input
                    type="text"
                    required
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                    className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    placeholder="e.g. Double Deal"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={dealPrice}
                    onChange={(e) => setDealPrice(e.target.value)}
                    className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    placeholder="e.g. 19.99"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={dealDesc}
                  onChange={(e) => setDealDesc(e.target.value)}
                  className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all h-20 resize-none"
                  placeholder="Details about items included in this deal..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Image Upload</label>
                <div className="flex items-center gap-4 mt-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="deal-image-file"
                  />
                  <label
                    htmlFor="deal-image-file"
                    className="px-4 py-2.5 rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 hover:bg-muted transition-colors text-xs font-bold cursor-pointer inline-block"
                  >
                    Choose Image
                  </label>
                  {compressing && <span className="text-[10px] text-muted-foreground animate-pulse">Compressing...</span>}
                  {dealImage && (
                    <img src={dealImage} alt="Preview" className="h-10 w-10 object-cover rounded-lg border border-border dark:border-zinc-700" />
                  )}
                </div>
              </div>

              <div className="border-t border-border dark:border-zinc-700 pt-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Included Items</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Product</label>
                    <select
                      value={currentProductId}
                      onChange={(e) => {
                        setCurrentProductId(e.target.value);
                        setCurrentVariantSku('');
                      }}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-2 py-2 text-[11px] font-semibold text-foreground focus:outline-none"
                    >
                      <option value="">Select...</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Variant (Optional)</label>
                    <select
                      value={currentVariantSku}
                      onChange={(e) => setCurrentVariantSku(e.target.value)}
                      disabled={productVariants.length === 0}
                      className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-2 py-2 text-[11px] font-semibold text-foreground focus:outline-none disabled:opacity-50"
                    >
                      <option value="">Portion/Size...</option>
                      {productVariants.map(v => (
                        <option key={v.sku} value={v.sku}>{v.size} / {v.color}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={currentQty}
                        onChange={(e) => setCurrentQty(e.target.value)}
                        className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-2 py-2 text-[11px] font-semibold text-foreground focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3.5 py-2.5 rounded-lg bg-foreground text-background text-xs font-black shadow-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="max-h-28 overflow-y-auto divide-y divide-border dark:divide-zinc-700 border border-border dark:border-zinc-700 rounded-lg p-2 bg-slate-50 dark:bg-zinc-900/40">
                  {selectedItems.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center py-4">No items added to deal package yet.</p>
                  ) : (
                    selectedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1.5 text-xs font-semibold">
                        <span>{item.quantity}x {item.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-500 hover:text-red-600 transition-colors p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-foreground text-background py-3 text-xs font-bold shadow-sm"
              >
                Save Deal Package
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealsManager;
