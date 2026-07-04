import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  cartItems: [],
  addToCart: (product) => {
    set((state) => {
      const existingIndex = state.cartItems.findIndex((item) => item.id === product.id);
      if (existingIndex !== -1) {
        const newItems = [...state.cartItems];
        newItems[existingIndex].quantity += 1;
        return { cartItems: newItems };
      }
      return { cartItems: [...state.cartItems, { ...product, quantity: 1 }] };
    });
  },
  removeFromCart: (productId) => {
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.id !== productId)
    }));
  },
  updateQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return { cartItems: state.cartItems.filter((item) => item.id !== productId) };
      }
      return {
        cartItems: state.cartItems.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      };
    });
  },
  clearCart: () => set({ cartItems: [] }),
  getSubtotal: () => {
    return get().cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}));
