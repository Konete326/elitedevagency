import { Plus, Trash2, Hash, Printer } from 'lucide-react';
import { generateBarcode } from '../../../lib/barcodeUtils';
import { printHardwareBarcode } from '../../../lib/device';
import { toast } from 'sonner';

export const VariantSection = ({ variants, setVariants, baseSku, productName, price }) => {
  const addVariant = () => {
    const nextIndex = variants.length + 1;
    const variantSku = baseSku ? `${baseSku}-VAR-${nextIndex}` : `VAR-${Date.now().toString().slice(-4)}`;
    setVariants([
      ...variants,
      { size: '', color: '', sku: variantSku, barcode: '', stock: 0 }
    ]);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index, field, value) => {
    const updated = variants.map((v, i) => {
      if (i === index) {
        return { ...v, [field]: value };
      }
      return v;
    });
    setVariants(updated);
  };

  const handleAutoGenerateBarcode = (index) => {
    updateVariant(index, 'barcode', generateBarcode());
  };

  const handlePrintBarcode = async (variant) => {
    if (!variant.barcode) return;
    try {
      await printHardwareBarcode(
        productName || 'Unnamed Product',
        `${variant.size || ''}/${variant.color || ''}`,
        price || '0.00',
        variant.barcode
      );
      toast.success('Sticker sent to printer');
    } catch {
      toast.error('Failed to print barcode sticker');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Product Variants</h3>
          <p className="text-xs text-muted-foreground">Define different size, color, and stock attributes</p>
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
          <span>Add Variant</span>
        </button>
      </div>

      {variants.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No variants defined. Standard single-item SKU will apply.</p>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {variants.map((variant, index) => (
            <div key={index} className="grid gap-2 grid-cols-5 items-end border border-border rounded-xl p-3.5 bg-card relative animate-fade-in">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider font-mono">Size</label>
                <input
                  type="text"
                  value={variant.size}
                  onChange={(e) => updateVariant(index, 'size', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="e.g. M"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider font-mono">Color</label>
                <input
                  type="text"
                  value={variant.color}
                  onChange={(e) => updateVariant(index, 'color', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="e.g. Black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider font-mono">Variant SKU</label>
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="SKU"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider font-mono">Stock Qty</label>
                <input
                  type="number"
                  value={variant.stock}
                  onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider font-mono">Barcode</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={variant.barcode}
                      onChange={(e) => updateVariant(index, 'barcode', e.target.value)}
                      className="w-full rounded-lg border border-border bg-background pl-3 pr-7 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                      placeholder="Manual or Scan"
                    />
                    <button
                      type="button"
                      onClick={() => handleAutoGenerateBarcode(index)}
                      className="absolute right-1 p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Hash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {variant.barcode && (
                  <button
                    type="button"
                    onClick={() => handlePrintBarcode(variant)}
                    className="rounded-lg bg-muted hover:bg-muted/80 text-foreground p-1.5 border border-border transition-colors self-end h-[30px] flex items-center justify-center"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 p-1.5 border border-red-500/15 self-end h-[30px] flex items-center justify-center"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
