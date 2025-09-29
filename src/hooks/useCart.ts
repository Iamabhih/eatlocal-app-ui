import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
  specialInstructions?: string;
  restaurantId: string;
  restaurantName: string;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateInstructions: (id: string, instructions: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: (deliveryFee: number) => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,

      addItem: (item) => {
        const state = get();
        
        // Check if adding from different restaurant
        if (state.restaurantId && state.restaurantId !== item.restaurantId) {
          const confirmChange = window.confirm(
            'Adding items from a different restaurant will clear your current cart. Continue?'
          );
          if (!confirmChange) return;
          set({ items: [], restaurantId: null, restaurantName: null });
        }

        // Check if item already exists
        const existingItem = state.items.find(i => i.menuItemId === item.menuItemId);
        
        if (existingItem) {
          set({
            items: state.items.map(i =>
              i.menuItemId === item.menuItemId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({
            items: [...state.items, { ...item, id: crypto.randomUUID() }],
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName,
          });
        }
      },

      removeItem: (id) => {
        const state = get();
        const newItems = state.items.filter(i => i.id !== id);
        set({
          items: newItems,
          restaurantId: newItems.length > 0 ? state.restaurantId : null,
          restaurantName: newItems.length > 0 ? state.restaurantName : null,
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map(i =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },

      updateInstructions: (id, instructions) => {
        set({
          items: get().items.map(i =>
            i.id === id ? { ...i, specialInstructions: instructions } : i
          ),
        });
      },

      clearCart: () => {
        set({ items: [], restaurantId: null, restaurantName: null });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getTax: () => {
        return get().getSubtotal() * 0.08; // 8% tax
      },

      getTotal: (deliveryFee: number) => {
        return get().getSubtotal() + get().getTax() + deliveryFee;
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
