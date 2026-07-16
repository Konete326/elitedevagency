import { Package } from 'lucide-react';

const EmptyState = () => (
  <div className="py-8 text-center border border-dashed border-border rounded-xl flex flex-col items-center gap-2">
    <div className="p-2.5 rounded-xl bg-muted">
      <Package className="h-6 w-6 text-muted-foreground/40" />
    </div>
    <p className="text-xs font-bold text-muted-foreground">No sales data recorded yet.</p>
    <p className="text-[10px] text-muted-foreground/65">Complete a checkout to see analytics here.</p>
  </div>
);

const ProductBar = ({ product, rank, maxQty }) => {
  const percentage = Math.round((product.qty / maxQty) * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-black text-muted-foreground/40 w-4 shrink-0 text-right tabular-nums">
        #{rank}
      </span>
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center justify-between text-xs gap-2 leading-none">
          <span className="font-bold truncate text-foreground">{product.name}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
              Rs. {product.revenue.toFixed(2)}
            </span>
            <span className="text-[10px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded-full tabular-nums">
              {product.qty} sold
            </span>
          </div>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
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
    <div className="space-y-3">
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
