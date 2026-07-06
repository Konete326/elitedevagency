import { create } from 'zustand';

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

export const useCartStore = create((set, get) => ({
  cartItems: [],
  addToCart: (product, spiceLevel = '', selectedAddons = []) => {
    set((state) => {
      const addonKeys = selectedAddons.map(a => a.name).sort().join(',');
      const variantSku = product.selectedVariant?.sku || '';
      const cartItemId = `${product.id}-${variantSku}-${spiceLevel}-${addonKeys}`;

      const existingIndex = state.cartItems.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIndex !== -1) {
        const newItems = [...state.cartItems];
        newItems[existingIndex].quantity += 1;
        return { cartItems: newItems };
      }
      return {
        cartItems: [...state.cartItems, {
          ...product,
          cartItemId,
          quantity: 1,
          spiceLevel,
          selectedAddons
        }]
      };
    });
  },
  removeFromCart: (cartItemId) => {
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.cartItemId !== cartItemId)
    }));
  },
  updateQuantity: (cartItemId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return { cartItems: state.cartItems.filter((item) => item.cartItemId !== cartItemId) };
      }
      return {
        cartItems: state.cartItems.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity } : item
        )
      };
    });
  },
  clearCart: () => set({ cartItems: [] }),
  getSubtotal: () => {
    return get().cartItems.reduce((sum, item) => {
      const basePrice = getPromoPrice(item);
      const addonsPrice = (item.selectedAddons || []).reduce((s, a) => s + (a.price || 0), 0);
      return sum + (basePrice + addonsPrice) * item.quantity;
    }, 0);
  }
}));
