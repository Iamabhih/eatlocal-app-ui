import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SelectedOption {
  optionId: string;
  name: string;
  priceModifier: number;
}

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
  selectedOptions?: SelectedOption[];
}

/** Composite key: menuItemId + sorted option IDs */
function getCartItemKey(menuItemId: string, selectedOptions?: SelectedOption[]): string {
  const optionKey = (selectedOptions || [])
    .map(o => o.optionId)
    .sort()
    .join(',');
  return `${menuItemId}::${optionKey}`;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  cartExpiry: number | null;
  showRestaurantChangeModal: boolean;
  pendingItem: Omit<CartItem, 'id' | 'quantity'> | null;

  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateInstructions: (itemId: string, instructions: string) => void;
  clearCart: () => void;

  setShowRestaurantChangeModal: (show: boolean) => void;
  setPendingItem: (item: Omit<CartItem, 'id' | 'quantity'> | null) => void;
  confirmRestaurantChange: () => void;

  getItemQuantity: (menuItemId: string) => number;
  getSubtotal: () => number;
  getTax: () => number;
  getServiceFee: () => number;
  getTotal: (deliveryFee: number) => number;
  getTotalItems: () => number;
  getCartTotal: () => number;

  checkExpiry: () => void;
}

const CART_EXPIRY_TIME = 24 * 60 * 60 * 1000;
const SERVICE_FEE_RATE = 0.045;

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
        state.checkExpiry();

        if (state.restaurantId && state.restaurantId !== item.restaurantId) {
          set({ pendingItem: item, showRestaurantChangeModal: true });
          return;
        }

        const key = getCartItemKey(item.menuItemId, item.selectedOptions);
        const existingItem = state.items.find(
          i => getCartItemKey(i.menuItemId, i.selectedOptions) === key
        );

        if (existingItem) {
          set({
            items: state.items.map(i =>
              i.id === existingItem.id ? { ...i, quantity: i.quantity + 1 } : i
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

      removeItem: (itemId) => {
        const state = get();
        const existingItem = state.items.find(i => i.id === itemId);
        if (!existingItem) return;

        if (existingItem.quantity === 1) {
          const newItems = state.items.filter(i => i.id !== itemId);
          set({
            items: newItems,
            restaurantId: newItems.length > 0 ? state.restaurantId : null,
            restaurantName: newItems.length > 0 ? state.restaurantName : null,
            cartExpiry: newItems.length > 0 ? state.cartExpiry : null,
          });
        } else {
          set({
            items: state.items.map(i =>
              i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
            ),
          });
        }
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          const newItems = get().items.filter(i => i.id !== itemId);
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
            i.id === itemId ? { ...i, quantity } : i
          ),
        });
      },

      updateInstructions: (itemId, instructions) => {
        set({
          items: get().items.map(i =>
            i.id === itemId ? { ...i, specialInstructions: instructions } : i
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
        if (!show) set({ pendingItem: null });
      },

      setPendingItem: (item) => set({ pendingItem: item }),

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
        return get().items
          .filter(i => i.menuItemId === menuItemId)
          .reduce((sum, i) => sum + i.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getTax: () => 0,

      getServiceFee: () => {
        return get().getSubtotal() * SERVICE_FEE_RATE;
      },

      getTotal: (deliveryFee: number) => {
        return get().getSubtotal() + get().getTax() + get().getServiceFee() + deliveryFee;
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getCartTotal: () => get().getSubtotal(),

      checkExpiry: () => {
        const { cartExpiry, items } = get();
        if (cartExpiry && items.length > 0 && Date.now() >= cartExpiry) {
          get().clearCart();
        }
      },
    }),
    {
      name: 'smash-cart-storage',
      version: 3,
    }
  )
);
