import { useState, useEffect } from 'react';
import { useCartStore } from '../../../store/useCartStore';
import { getDatabase } from '../../../db/database';
import { Plus, Tag, Inbox } from 'lucide-react';

const CATEGORIES = ['All', 'Membership', 'Supplements', 'Apparel', 'Accessories'];

export const ProductGrid = () => {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const addToCart = useCartStore((state) => state.addToCart);

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
            category: getCategory(doc.name)
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
              onClick={() => addToCart(product)}
              className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 hover:border-foreground/30 hover:shadow-md cursor-pointer transition-all duration-200 select-none animate-fade-in"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <Tag className="h-3 w-3" />
                  <span>{product.category}</span>
                </div>
                <h3 className="font-bold text-sm tracking-tight line-clamp-2 text-zinc-900 dark:text-zinc-50 group-hover:text-accent-niche transition-colors">
                  {product.name}
                </h3>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                <span className="text-sm font-extrabold text-foreground">${product.price.toFixed(2)}</span>
                <div className="rounded-lg bg-muted border border-border group-hover:bg-foreground group-hover:text-background p-1.5 transition-colors">
                  <Plus className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default ProductGrid;
