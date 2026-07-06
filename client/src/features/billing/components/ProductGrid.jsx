import { useState, useEffect } from 'react';
import { useCartStore } from '../../../store/useCartStore';
import { getDatabase } from '../../../db/database';
import { Plus, Tag, Inbox, X } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['All', 'Membership', 'Supplements', 'Apparel', 'Accessories'];

export const ProductGrid = () => {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const addToCart = useCartStore((state) => state.addToCart);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);
  
  const [selectedProductForModifiers, setSelectedProductForModifiers] = useState(null);
  const [spiceLevel, setSpiceLevel] = useState('Medium');
  const [activeAddons, setActiveAddons] = useState([]);

  useEffect(() => {
    let sub;
    getDatabase().then((db) => {
      sub = db.products
        .find({
          selector: {
            isDeleted: false
          }
        })
        .$.subscribe((docs) => {
          const getCategory = (name) => {
            const lower = name.toLowerCase();
            if (lower.includes('shirt') || lower.includes('wear')) return 'Apparel';
            if (lower.includes('bottle') || lower.includes('shaker') || lower.includes('glove') || lower.includes('accessory')) return 'Accessories';
            if (lower.includes('membership') || lower.includes('training') || lower.includes('pass')) return 'Membership';
            return 'Supplements';
          };

          const mapped = docs.map((doc) => ({
            id: doc._id,
            name: doc.name,
            price: doc.price,
            image: doc.image,
            category: getCategory(doc.name),
            variants: doc.variants || [],
            promotionalDiscount: doc.promotionalDiscount || null,
            addons: doc.addons || [],
            hasSpiceLevel: doc.hasSpiceLevel || false,
            kitchenSection: doc.kitchenSection || 'Main Kitchen'
          }));
          setProducts(mapped);
        });
    });

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const handleAddonsToggle = (addon) => {
    setActiveAddons(prev =>
      prev.some(a => a.name === addon.name)
        ? prev.filter(a => a.name !== addon.name)
        : [...prev, addon]
    );
  };

  const handleAddWithModifiers = () => {
    if (!selectedProductForModifiers) return;
    addToCart(
      selectedProductForModifiers,
      selectedProductForModifiers.hasSpiceLevel ? spiceLevel : '',
      activeAddons
    );
    toast.success(`Added: ${selectedProductForModifiers.name}`);
    setSelectedProductForModifiers(null);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-all border ${
              selectedCategory === category
                ? 'bg-foreground text-background border-foreground shadow-sm'
                : 'bg-card text-foreground border-border hover:bg-muted'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border rounded-2xl text-muted-foreground p-8 space-y-3">
          <Inbox className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="font-extrabold text-base tracking-tight text-foreground">No products available</h3>
          <p className="text-xs text-center max-w-xs font-semibold">
            Add products to this tenant database from your catalog manager to begin ring sales transactions.
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 space-y-2">
          <Inbox className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-xs font-semibold">No products found matching "{selectedCategory}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-1">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => {
                if (product.variants && product.variants.length > 0) {
                  setSelectedProductForVariants(product);
                } else if (product.addons?.length > 0 || product.hasSpiceLevel) {
                  setSpiceLevel('Medium');
                  setActiveAddons([]);
                  setSelectedProductForModifiers(product);
                } else {
                  addToCart(product);
                }
              }}
              className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 hover:border-foreground/30 hover:shadow-md cursor-pointer transition-all duration-200 select-none animate-fade-in"
            >
              {product.promotionalDiscount && (
                <div className="absolute top-2.5 right-2.5 z-10 rounded-full bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 shadow-sm tracking-wider uppercase">
                  {product.promotionalDiscount.label || 'Sale'}
                </div>
              )}

              <div className="space-y-2">
                {product.image && (
                  <div className="w-full h-32 overflow-hidden rounded-lg border border-border mb-2 shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-250 ease-out"
                    />
                  </div>
                )}
                <div className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <Tag className="h-3 w-3" />
                  <span>{product.category}</span>
                </div>
                <h3 className="font-bold text-sm tracking-tight line-clamp-2 text-zinc-900 dark:text-zinc-50 group-hover:text-accent-niche transition-colors">
                  {product.name}
                </h3>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                <div className="flex flex-col">
                  {product.promotionalDiscount ? (
                    <>
                      <span className="text-sm font-extrabold text-red-500">
                        ${(product.promotionalDiscount.rate 
                          ? product.price * (1 - product.promotionalDiscount.rate / 100)
                          : product.promotionalDiscount.price).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-through font-semibold font-mono">
                        ${product.price.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-extrabold text-foreground">${product.price.toFixed(2)}</span>
                  )}
                </div>
                <div className="rounded-lg bg-muted border border-border group-hover:bg-foreground group-hover:text-background p-1.5 transition-colors">
                  <Plus className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProductForVariants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-5 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="font-extrabold text-base tracking-tight text-foreground">Select Variant</h3>
              <button
                onClick={() => setSelectedProductForVariants(null)}
                className="rounded-lg border border-border p-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-sm font-black mb-1 text-zinc-950 dark:text-zinc-50">{selectedProductForVariants.name}</p>
            <p className="text-xs text-muted-foreground font-semibold mb-4">Select size and color to add to cart</p>

            <div className="flex-1 overflow-y-auto grid gap-2.5 grid-cols-2 pr-1">
              {selectedProductForVariants.variants.map((v) => (
                <button
                  key={v.sku}
                  onClick={() => {
                    const productWithVariant = {
                      ...selectedProductForVariants,
                      selectedVariant: v
                    };
                    setSelectedProductForVariants(null);
                    if (productWithVariant.addons?.length > 0 || productWithVariant.hasSpiceLevel) {
                      setSpiceLevel('Medium');
                      setActiveAddons([]);
                      setSelectedProductForModifiers(productWithVariant);
                    } else {
                      addToCart(productWithVariant);
                      toast.success(`Added: ${productWithVariant.name} (${v.size}/${v.color})`);
                    }
                  }}
                  className="flex flex-col items-start p-3 rounded-lg border border-border bg-muted/30 hover:border-foreground/30 hover:bg-muted/70 transition-all text-left"
                >
                  <span className="text-xs font-black uppercase tracking-wide">{v.size} / {v.color}</span>
                  <span className="text-[10px] text-muted-foreground font-mono mt-1">{v.sku}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{v.stock} Units left</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedProductForModifiers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-lg p-5 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="font-extrabold text-base tracking-tight text-foreground">Customize Item</h3>
              <button
                onClick={() => setSelectedProductForModifiers(null)}
                className="rounded-lg border border-border p-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <p className="text-sm font-black text-zinc-950 dark:text-zinc-50">{selectedProductForModifiers.name}</p>
                {selectedProductForModifiers.selectedVariant && (
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide mt-0.5">
                    Portion: {selectedProductForModifiers.selectedVariant.size}
                  </p>
                )}
              </div>

              {selectedProductForModifiers.hasSpiceLevel && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">Spice Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild', 'Medium', 'Spicy'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSpiceLevel(level)}
                        className={`rounded-lg py-2 text-xs font-bold border transition-colors ${
                          spiceLevel === level
                            ? 'bg-foreground text-background border-foreground shadow-sm'
                            : 'bg-muted/50 border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedProductForModifiers.addons?.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">Available Addons</label>
                  <div className="grid gap-2">
                    {selectedProductForModifiers.addons.map((addon) => {
                      const isSelected = activeAddons.some(a => a.name === addon.name);
                      return (
                        <button
                          key={addon.name}
                          type="button"
                          onClick={() => handleAddonsToggle(addon)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-bold border transition-colors ${
                            isSelected
                              ? 'bg-foreground text-background border-foreground shadow-sm'
                              : 'bg-muted/50 border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          <span>{addon.name}</span>
                          <span className="font-mono">${addon.price.toFixed(2)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleAddWithModifiers}
              className="w-full rounded-lg bg-foreground text-background font-bold py-2.5 text-xs transition-colors mt-6 shrink-0"
            >
              Add to Basket
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductGrid;
