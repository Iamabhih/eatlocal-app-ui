import { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (menuItemId: string) => number;
  getRestaurantItemQuantity: (menuItemId: string) => number;
  getCartTotal: () => number;
  getTotalItems: () => number;
  currentRestaurantId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const currentRestaurantId = items.length > 0 ? items[0].restaurantId : null;

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    // Check if adding from different restaurant
    if (currentRestaurantId && currentRestaurantId !== newItem.restaurantId) {
      if (!confirm('Adding items from a different restaurant will clear your cart. Continue?')) {
        return;
      }
      setItems([{ ...newItem, quantity: 1 }]);
      return;
    }

    setItems(prev => {
      const existing = prev.find(item => item.menuItemId === newItem.menuItemId);
      if (existing) {
        return prev.map(item =>
          item.menuItemId === newItem.menuItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  };

  const removeItem = (menuItemId: string) => {
    setItems(prev => {
      const existing = prev.find(item => item.menuItemId === menuItemId);
      if (!existing) return prev;

      if (existing.quantity === 1) {
        return prev.filter(item => item.menuItemId !== menuItemId);
      }

      return prev.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity === 0) {
      setItems(prev => prev.filter(item => item.menuItemId !== menuItemId));
    } else {
      setItems(prev =>
        prev.map(item =>
          item.menuItemId === menuItemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemQuantity = (menuItemId: string) => {
    return items.find(item => item.menuItemId === menuItemId)?.quantity || 0;
  };

  const getRestaurantItemQuantity = (menuItemId: string) => {
    return items.find(item => item.menuItemId === menuItemId)?.quantity || 0;
  };

  const getCartTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
        getRestaurantItemQuantity,
        getCartTotal,
        getTotalItems,
        currentRestaurantId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
