import { useCartStore } from '../../../store/useCartStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { getDatabase } from '../../../db/database';
import { printHardwareReceipt } from '../../../lib/device';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

export const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, getSubtotal } = useCartStore();
  const { user } = useAuthStore();
  const { selectedPrinter } = useSettingsStore();

  const subtotal = getSubtotal();
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const getPromoPrice = (item) => {
    if (item.promotionalDiscount) {
      const { rate, price } = item.promotionalDiscount;
      if (rate && rate > 0) {
        return item.price * (1 - rate / 100);
      }
      if (price && price > 0) {
        return price;
      }
    }
    return item.price;
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    try {
      const db = await getDatabase();
      const orderId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      
      const orderDoc = {
        _id: orderId,
        tenantId: user?.tenantId || 'default',
        items: cartItems.map((item) => ({
          productId: item.id,
          name: item.selectedVariant 
            ? `${item.name} (${item.selectedVariant.size}/${item.selectedVariant.color})`
            : item.name,
          price: getPromoPrice(item),
          quantity: item.quantity,
          returnedQty: 0,
          returnReason: '',
          variantSku: item.selectedVariant ? item.selectedVariant.sku : ''
        })),
        totalAmount: total,
        paymentMode: 'CASH',
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      };

      await db.orders.insert(orderDoc);

      for (const item of cartItems) {
        const productDoc = await db.products.findOne(item.id).exec();
        if (productDoc) {
          if (item.selectedVariant) {
            const updatedVariants = (productDoc.variants || []).map((v) => {
              if (v.sku === item.selectedVariant.sku) {
                return { ...v, stock: Math.max(0, (v.stock || 0) - item.quantity) };
              }
              return v;
            });
            await productDoc.patch({
              variants: updatedVariants,
              stock: Math.max(0, (productDoc.stock || 0) - item.quantity),
              isSynced: false,
              updatedAt: new Date().toISOString()
            });
          } else {
            await productDoc.patch({
              stock: Math.max(0, (productDoc.stock || 0) - item.quantity),
              isSynced: false,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }

      if (selectedPrinter) {
        try {
          await printHardwareReceipt({
            printerName: selectedPrinter,
            data: {
              orderId,
              items: cartItems.map((item) => {
                const itemPrice = getPromoPrice(item);
                return {
                  name: item.selectedVariant 
                    ? `${item.name} (${item.selectedVariant.size}/${item.selectedVariant.color})`
                    : item.name,
                  price: itemPrice,
                  quantity: item.quantity,
                  total: itemPrice * item.quantity
                };
              }),
              subtotal,
              tax,
              total,
              timestamp: new Date().toISOString()
            }
          });
        } catch (printErr) {
          console.error('Receipt print failed', printErr);
        }
      }

      toast.success('Order completed successfully');
      clearCart();
    } catch {
      toast.error('Failed to complete order');
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-accent-niche" />
          <h2 className="font-bold text-base tracking-tight">Active Cart</h2>
        </div>
        {cartItems.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Your cart is currently empty</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.cartItemId}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/65 border border-border"
            >
              <div className="flex-1 min-w-0 pr-3">
                <h4 className="text-sm font-bold truncate text-zinc-950 dark:text-zinc-50">
                  {item.name}
                  {item.selectedVariant && (
                    <span className="text-[10px] text-muted-foreground font-semibold ml-1.5 uppercase tracking-wide">
                      ({item.selectedVariant.size}/{item.selectedVariant.color})
                    </span>
                  )}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {item.promotionalDiscount ? (
                    <>
                      <span className="text-xs text-red-500 font-extrabold">${getPromoPrice(item).toFixed(2)}</span>
                      <span className="text-[10px] text-muted-foreground line-through font-semibold">${item.price.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground font-semibold">${item.price.toFixed(2)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border bg-card rounded-lg overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-extrabold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.cartItemId)}
                  className="p-2 hover:bg-red-500/10 text-red-500 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="p-4 border-t border-border bg-muted/30 space-y-4">
          <div className="space-y-1.5 text-sm font-semibold">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="text-foreground font-bold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Sales Tax (5%)</span>
              <span className="text-foreground font-bold">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold border-t border-border pt-3 mt-2">
              <span>Total</span>
              <span className="text-accent-niche font-black">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full inline-flex items-center justify-center rounded-lg bg-foreground text-background hover:bg-foreground/90 font-bold px-4 py-3 text-sm transition-colors"
          >
            Complete Order
          </button>
        </div>
      )}
    </div>
  );
};
export default Cart;
