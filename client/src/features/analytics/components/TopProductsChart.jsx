import { Package } from 'lucide-react';

const EmptyState = () => (
  <div className="py-14 text-center border border-dashed border-border rounded-2xl flex flex-col items-center gap-3">
    <div className="p-4 rounded-2xl bg-muted">
      <Package className="h-8 w-8 text-muted-foreground/40" />
    </div>
    <p className="text-sm font-bold text-muted-foreground">No sales data recorded yet.</p>
    <p className="text-xs text-muted-foreground/60">Complete a checkout to see analytics here.</p>
  </div>
);

const ProductBar = ({ product, rank, maxQty }) => {
  const percentage = Math.round((product.qty / maxQty) * 100);

  return (
    <div className="flex items-center gap-4">
      <span className="text-xs font-black text-muted-foreground/40 w-5 shrink-0 text-right tabular-nums">
        #{rank}
      </span>
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center justify-between text-sm gap-2">
          <span className="font-bold truncate text-foreground">{product.name}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              Rs. {product.revenue.toFixed(2)}
            </span>
            <span className="text-xs font-black text-accent bg-accent/10 px-2 py-0.5 rounded-full tabular-nums">
              {product.qty} sold
            </span>
          </div>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            style={{ width: `${percentage}%` }}
            className="h-full bg-accent rounded-full transition-all duration-700"
          />
        </div>
      </div>
    </div>
  );
};

export const TopProductsChart = ({ products }) => {
  if (products.length === 0) return <EmptyState />;

  const maxQty = Math.max(...products.map((p) => p.qty));

  return (
    <div className="space-y-5">
      {products.map((product, index) => (
        <ProductBar
          key={product.name}
          product={product}
          rank={index + 1}
          maxQty={maxQty}
        />
      ))}
    </div>
  );
};
