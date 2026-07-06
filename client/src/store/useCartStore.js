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
  addToCart: (product) => {
    set((state) => {
      const cartItemId = product.selectedVariant 
        ? `${product.id}-${product.selectedVariant.sku}` 
        : product.id;

      const existingIndex = state.cartItems.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIndex !== -1) {
        const newItems = [...state.cartItems];
        newItems[existingIndex].quantity += 1;
        return { cartItems: newItems };
      }
      return { cartItems: [...state.cartItems, { ...product, cartItemId, quantity: 1 }] };
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
    return get().cartItems.reduce((sum, item) => sum + getPromoPrice(item) * item.quantity, 0);
  }
}));
