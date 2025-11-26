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
  cartExpiry: number | null;
  showRestaurantChangeModal: boolean;
  pendingItem: Omit<CartItem, 'id' | 'quantity'> | null;

  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateInstructions: (menuItemId: string, instructions: string) => void;
  clearCart: () => void;

  // Restaurant change modal
  setShowRestaurantChangeModal: (show: boolean) => void;
  setPendingItem: (item: Omit<CartItem, 'id' | 'quantity'> | null) => void;
  confirmRestaurantChange: () => void;

  // Getters
  getItemQuantity: (menuItemId: string) => number;
  getSubtotal: () => number;
  getTax: () => number;
  getServiceFee: () => number;
  getTotal: (deliveryFee: number) => number;
  getTotalItems: () => number;
  getCartTotal: () => number;

  // Utility
  checkExpiry: () => void;
}

const CART_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
const SERVICE_FEE_RATE = 0.045; // 4.5% service fee

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      cartExpiry: null,
      showRestaurantChangeModal: false,
      pendingItem: null,

      addItem: (item) => {
        const state = get();

        // Check expiry first
        state.checkExpiry();

        // Check if adding from different restaurant
        if (state.restaurantId && state.restaurantId !== item.restaurantId) {
          set({
            pendingItem: item,
            showRestaurantChangeModal: true,
          });
          return;
        }

        // Check if item already exists
        const existingItem = state.items.find(i => i.menuItemId === item.menuItemId);

        if (existingItem) {
          set({
            items: state.items.map(i =>
              i.menuItemId === item.menuItemId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
            cartExpiry: Date.now() + CART_EXPIRY_TIME,
          });
        } else {
          set({
            items: [...state.items, { ...item, id: crypto.randomUUID(), quantity: 1 }],
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName,
            cartExpiry: Date.now() + CART_EXPIRY_TIME,
          });
        }
      },

      removeItem: (menuItemId) => {
        const state = get();
        const existingItem = state.items.find(i => i.menuItemId === menuItemId);

        if (!existingItem) return;

        if (existingItem.quantity === 1) {
          const newItems = state.items.filter(i => i.menuItemId !== menuItemId);
          set({
            items: newItems,
            restaurantId: newItems.length > 0 ? state.restaurantId : null,
            restaurantName: newItems.length > 0 ? state.restaurantName : null,
            cartExpiry: newItems.length > 0 ? state.cartExpiry : null,
          });
        } else {
          set({
            items: state.items.map(i =>
              i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i
            ),
          });
        }
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          const newItems = get().items.filter(i => i.menuItemId !== menuItemId);
          set({
            items: newItems,
            restaurantId: newItems.length > 0 ? get().restaurantId : null,
            restaurantName: newItems.length > 0 ? get().restaurantName : null,
            cartExpiry: newItems.length > 0 ? get().cartExpiry : null,
          });
          return;
        }
        set({
          items: get().items.map(i =>
            i.menuItemId === menuItemId ? { ...i, quantity } : i
          ),
        });
      },

      updateInstructions: (menuItemId, instructions) => {
        set({
          items: get().items.map(i =>
            i.menuItemId === menuItemId ? { ...i, specialInstructions: instructions } : i
          ),
        });
      },

      clearCart: () => {
        set({
          items: [],
          restaurantId: null,
          restaurantName: null,
          cartExpiry: null,
          showRestaurantChangeModal: false,
          pendingItem: null,
        });
      },

      setShowRestaurantChangeModal: (show) => {
        set({ showRestaurantChangeModal: show });
        if (!show) {
          set({ pendingItem: null });
        }
      },

      setPendingItem: (item) => {
        set({ pendingItem: item });
      },

      confirmRestaurantChange: () => {
        const { pendingItem } = get();
        if (pendingItem) {
          set({
            items: [{ ...pendingItem, id: crypto.randomUUID(), quantity: 1 }],
            restaurantId: pendingItem.restaurantId,
            restaurantName: pendingItem.restaurantName,
            cartExpiry: Date.now() + CART_EXPIRY_TIME,
            showRestaurantChangeModal: false,
            pendingItem: null,
          });
        }
      },

      getItemQuantity: (menuItemId) => {
        return get().items.find(i => i.menuItemId === menuItemId)?.quantity || 0;
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getTax: () => {
        return 0; // No tax/VAT charged per requirements
      },

      getServiceFee: () => {
        const subtotal = get().getSubtotal();
        return subtotal * SERVICE_FEE_RATE; // 4.5% service fee
      },

      getTotal: (deliveryFee: number) => {
        return get().getSubtotal() + get().getTax() + get().getServiceFee() + deliveryFee;
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getCartTotal: () => {
        return get().getSubtotal();
      },

      checkExpiry: () => {
        const { cartExpiry, items } = get();
        if (cartExpiry && items.length > 0) {
          const now = Date.now();
          if (now >= cartExpiry) {
            // Cart expired, clear it
            get().clearCart();
          }
        }
      },
    }),
    {
      name: 'smash-cart-storage',
      version: 2, // Increment version to force migration from old storage
    }
  )
);
