import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X, Tag, Coffee, Search, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { compressImageToBase64 } from '../../../lib/imageUtils';
import { NicheImage } from '../../../components/common/NicheImage';
import { useModalStore } from '../../../store/useModalStore';

export const DealsManager = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { openModal } = useModalStore();

  const placeholders = {
    name: user?.niche === 'restaurant'
      ? 'e.g. Midnight Deal 1'
      : user?.niche === 'gym'
        ? 'e.g. Couple Membership Bundle'
        : 'e.g. Double Deal',
    price: user?.niche === 'restaurant'
      ? 'e.g. 999.00'
      : user?.niche === 'gym'
        ? 'e.g. 4999.00'
        : 'e.g. 1499.00',
  };

  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);

  // Mode states: List view vs split Form view
  const [isFormView, setIsFormView] = useState(false);
  const [editDealId, setEditDealId] = useState(null);

  // Form states
  const [dealName, setDealName] = useState('');
  const [dealPrice, setDealPrice] = useState('');
  const [dealDesc, setDealDesc] = useState('');
  const [dealImage, setDealImage] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Search state for product catalog
  const [searchQuery, setSearchQuery] = useState('');
  // Active three-dot menu tracker
  const [activeMenuId, setActiveMenuId] = useState(null);

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

    // Close three-dot menu on click outside
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    window.addEventListener('click', handleOutsideClick);

    return () => {
      if (subDeals) subDeals.unsubscribe();
      if (subProducts) subProducts.unsubscribe();
      window.removeEventListener('click', handleOutsideClick);
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

  const handleSelectCatalogItem = (item) => {
    const existingIndex = selectedItems.findIndex(
      (x) => x.productId === item.productId && x.variantSku === item.variantSku
    );

    if (existingIndex !== -1) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: item.productId,
          variantSku: item.variantSku,
          name: item.name,
          quantity: 1
        }
      ]);
    }
  };

  const handleUpdateQty = (index, delta) => {
    const updated = [...selectedItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(index);
    } else {
      updated[index].quantity = newQty;
      setSelectedItems(updated);
    }
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const numRegex = /^[0-9]+(\.[0-9]{1,2})?$/;
  const isPriceValid = !dealPrice || numRegex.test(dealPrice);

  const handleCreateDeal = async (e) => {
    e.preventDefault();

    if (!isPriceValid) {
      toast.error('Please fix the highlighted invalid input fields before proceeding.');
      return;
    }

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
      const payload = {
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
        isSynced: false,
        updatedAt: new Date().toISOString()
      };

      if (editDealId) {
        const doc = await db.deals.findOne(editDealId).exec();
        if (doc) {
          await doc.patch(payload);
          toast.success('Deal package updated successfully');
        } else {
          toast.error('Deal not found');
        }
      } else {
        const dealId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        await db.deals.insert({
          _id: dealId,
          tenantId: user?.tenantId || 'default',
          isActive: true,
          isDeleted: false,
          ...payload
        });
        toast.success('Deal package created successfully');
      }

      handleCancelForm();
    } catch {
      toast.error('Failed to save deal package');
    }
  };

  const handleDeleteDeal = (dealId) => {
    openModal({
      title: 'Delete Combo Deal',
      message: 'Are you sure you want to delete this deal package? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
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
      }
    });
  };

  const handleStartEdit = (deal) => {
    setEditDealId(deal._id);
    setDealName(deal.name);
    setDealPrice(deal.price.toString());
    setDealDesc(deal.description || '');
    setDealImage(deal.image || '');

    const mapped = (deal.items || []).map((item) => {
      const prod = products.find(p => p._id === item.productId);
      let vName = '';
      if (item.variantSku && prod?.variants) {
        const v = prod.variants.find(x => x.sku === item.variantSku);
        if (v) vName = ` (${v.size}/${v.color})`;
      }
      return {
        productId: item.productId,
        variantSku: item.variantSku,
        name: (prod ? prod.name : 'Unknown Product') + vName,
        quantity: item.quantity
      };
    });

    setSelectedItems(mapped);
    setIsFormView(true);
    setActiveMenuId(null);
  };

  const handleCancelForm = () => {
    setIsFormView(false);
    setEditDealId(null);
    setDealName('');
    setDealPrice('');
    setDealDesc('');
    setDealImage('');
    setSelectedItems([]);
    setSearchQuery('');
  };

  // Flatten products catalog items for easy click additions
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const catalogItems = [];
  filteredProducts.forEach(p => {
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach(v => {
        catalogItems.push({
          productId: p._id,
          variantSku: v.sku,
          name: `${p.name} (${v.size}/${v.color})`,
          image: p.image,
          price: p.price,
          isVariant: true
        });
      });
    } else {
      catalogItems.push({
        productId: p._id,
        variantSku: '',
        name: p.name,
        image: p.image,
        price: p.price,
        isVariant: false
      });
    }
  });

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      {!isFormView ? (
        /* MODE 1: LIST VIEW (DEAL CARDS GRID) */
        <main className="flex-1 overflow-y-auto p-4 md:p-5 w-full space-y-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="flex items-center justify-center p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-base font-bold tracking-tight leading-none">Combo Deals & Packages</h1>
                <p className="text-[10px] text-muted-foreground mt-0.5">Manage custom discount packages and promotional combo deals</p>
              </div>
            </div>
            <button
              onClick={() => setIsFormView(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--primary-accent)] text-white hover:opacity-95 font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Deal</span>
            </button>
          </div>

          {deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-border rounded-xl bg-card text-muted-foreground p-6">
              <Tag className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs font-bold text-foreground">No Deals Configured</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Build your first combo package to start promotional campaigns</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {deals.map((deal) => (
                <div key={deal._id} className="flex flex-col bg-card border border-border dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm relative group hover:border-[var(--primary-accent)] dark:hover:border-[var(--primary-accent)] transition-all duration-300">
                  
                  {/* Card Banner Image / Icon placeholder */}
                  <div className="h-28 w-full bg-slate-100 dark:bg-zinc-950/40 flex items-center justify-center border-b border-border dark:border-zinc-850 text-muted-foreground relative">
                    <NicheImage src={deal.image} alt={deal.name} className="h-full w-full border-none rounded-none shrink-0" />

                    {/* Three-dot Action Menu */}
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === deal._id ? null : deal._id);
                        }}
                        className="h-6 w-6 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-border dark:border-zinc-800 flex items-center justify-center text-muted-foreground hover:text-foreground shadow-xs cursor-pointer focus:outline-none"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                      {activeMenuId === deal._id && (
                        <div 
                          className="absolute right-0 top-7 z-20 w-24 rounded-lg border border-border dark:border-zinc-700 bg-card shadow-md py-1 animate-in fade-in zoom-in-95 duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleStartEdit(deal)}
                            className="w-full text-left px-2.5 py-1 text-[10px] font-bold text-foreground hover:bg-muted cursor-pointer"
                          >
                            Edit Deal
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteDeal(deal._id);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-2.5 py-1 text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3 flex flex-col flex-grow leading-tight min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <h3 className="text-xs font-black tracking-tight text-foreground truncate flex-1">{deal.name}</h3>
                      <span className="text-[10px] font-extrabold text-accent shrink-0">Rs. {deal.price.toFixed(2)}</span>
                    </div>
                    {deal.description && (
                      <p className="text-[9.5px] text-muted-foreground line-clamp-2 h-6.5 mt-1 font-semibold leading-tight">{deal.description}</p>
                    )}

                    {/* Included Products List */}
                    <div className="border-t border-border dark:border-zinc-800/80 pt-2 mt-2 space-y-0.5 max-h-[85px] overflow-y-auto leading-tight pr-1">
                      {(deal.items || []).map((item, idx) => {
                        const prod = products.find(p => p._id === item.productId);
                        let vName = '';
                        if (item.variantSku && prod?.variants) {
                          const v = prod.variants.find(x => x.sku === item.variantSku);
                          if (v) vName = ` (${v.size}/${v.color})`;
                        }
                        return (
                          <div key={idx} className="flex justify-between text-[9px] text-muted-foreground font-bold">
                            <span className="truncate flex-1">• {prod ? prod.name : 'Unknown Product'}{vName}</span>
                            <span className="shrink-0 ml-1.5 text-foreground">x{item.quantity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      ) : (
        /* MODE 2: SPLIT-PANE FORM VIEW (POS STYLE) */
        <main className="flex-1 overflow-hidden p-4 md:p-5 w-full space-y-4 max-w-7xl mx-auto flex flex-col">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCancelForm}
              className="flex items-center justify-center p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none">
                {editDealId ? 'Edit Combo Deal Package' : 'Create Combo Deal Package'}
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Select products from the catalog to build your custom package bundle</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 items-start">
            
            {/* Left Column: Product Catalog Selector */}
            <div className="lg:col-span-2 h-full flex flex-col min-h-0 border border-border dark:border-zinc-800 bg-card rounded-xl p-3">
              <div className="relative mb-3 shrink-0">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-muted-foreground">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name or SKU..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-slate-50 dark:bg-zinc-900/50 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {catalogItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12">
                  <Coffee className="h-6 w-6 opacity-30 mb-2" />
                  <p className="text-xs font-bold">No Catalog Products Found</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {catalogItems.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectCatalogItem(item)}
                        className="bg-slate-50/60 dark:bg-zinc-900/20 border border-border dark:border-zinc-800 rounded-lg p-2 flex items-center gap-2.5 hover:border-[var(--primary-accent)] cursor-pointer select-none transition-all active:scale-[0.98]"
                      >
                        <NicheImage src={item.image} alt={item.name} className="h-10 w-10 shrink-0" />
                        <div className="min-w-0 flex-1 leading-tight">
                          <p className="text-[10px] font-bold text-foreground line-clamp-2">{item.name}</p>
                          <p className="text-[9px] font-bold text-accent mt-0.5">Rs. {item.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Combo Deal properties & Selected Cart */}
            <form onSubmit={handleCreateDeal} className="h-full flex flex-col min-h-0 border border-border dark:border-zinc-800 bg-card rounded-xl p-3.5 shadow-sm space-y-3">
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                
                {/* Pack Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Package Name *</label>
                  <input
                    type="text"
                    required
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                    className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder={placeholders.name}
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Combo Deal Price (Rs) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={dealPrice}
                    onChange={(e) => setDealPrice(e.target.value)}
                    className={`w-full rounded-lg border bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 transition-all ${
                      isPriceValid 
                        ? 'border-border dark:border-zinc-700 focus:ring-ring' 
                        : 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    }`}
                    placeholder={placeholders.price}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Description (Optional)</label>
                  <textarea
                    value={dealDesc}
                    onChange={(e) => setDealDesc(e.target.value)}
                    className="w-full rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all h-14 resize-none"
                    placeholder="Details about items included..."
                  />
                </div>

                {/* Banner Image upload */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Banner Image (Optional)</label>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="deal-image-file"
                    />
                    <label
                      htmlFor="deal-image-file"
                      className="px-3 py-1.5 rounded-lg border border-border dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 hover:bg-muted transition-colors text-[10px] font-bold cursor-pointer inline-block"
                    >
                      Choose Banner
                    </label>
                    {compressing && <span className="text-[9px] text-muted-foreground animate-pulse">Compressing...</span>}
                    {dealImage && (
                      <div className="relative shrink-0">
                        <img src={dealImage} alt="Preview" className="h-8 w-12 object-cover rounded border border-border dark:border-zinc-700" />
                        <button
                          type="button"
                          onClick={() => setDealImage('')}
                          className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 shadow-xs border border-white"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Combo Items list (Cart Style) */}
                <div className="pt-2 border-t border-border dark:border-zinc-800/80">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Combo Package Items</p>
                  
                  <div className="border border-border dark:border-zinc-800 rounded-lg p-2 bg-slate-50 dark:bg-zinc-900/40 space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {selectedItems.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground text-center py-4 font-semibold">No items added yet. Click product cards on the left to add items.</p>
                    ) : (
                      selectedItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-semibold py-1 border-b border-border dark:border-zinc-800/50 last:border-b-0 leading-tight">
                          <span className="truncate flex-1 max-w-[130px]">{item.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(idx, -1)}
                              className="h-4.5 w-4.5 rounded bg-muted dark:bg-zinc-800 hover:bg-muted/80 text-foreground flex items-center justify-center font-bold text-xs"
                            >
                              -
                            </button>
                            <span className="text-[10px] font-extrabold w-3 text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(idx, 1)}
                              className="h-4.5 w-4.5 rounded bg-muted dark:bg-zinc-800 hover:bg-muted/80 text-foreground flex items-center justify-center font-bold text-xs"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-red-500 hover:text-red-600 transition-colors p-0.5 ml-0.5"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2.5 border-t border-border dark:border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-zinc-650 hover:bg-slate-50 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-250 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={compressing}
                  className="flex-1 px-3 py-2 bg-[var(--primary-accent)] text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-lg transition-opacity shadow-sm cursor-pointer"
                >
                  {compressing ? 'Compressing...' : 'Save Deal'}
                </button>
              </div>
            </form>

          </div>
        </main>
      )}
    </div>
  );
};

export default DealsManager;
