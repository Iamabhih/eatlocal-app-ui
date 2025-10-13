import { createContext, useContext, useState, ReactNode, useEffect } from "react";

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
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (menuItemId: string) => number;
  getRestaurantItemQuantity: (menuItemId: string) => number;
  getCartTotal: () => number;
  getTotalItems: () => number;
  currentRestaurantId: string | null;
  showRestaurantChangeModal: boolean;
  setShowRestaurantChangeModal: (show: boolean) => void;
  pendingItem: Omit<CartItem, "quantity"> | null;
  setPendingItem: (item: Omit<CartItem, "quantity"> | null) => void;
  confirmRestaurantChange: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "eatlocal_cart";
const CART_EXPIRY_KEY = "eatlocal_cart_expiry";
const CART_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize cart from localStorage with expiry check
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      const expiryTime = localStorage.getItem(CART_EXPIRY_KEY);

      if (savedCart && expiryTime) {
        const now = Date.now();
        if (now < parseInt(expiryTime)) {
          return JSON.parse(savedCart);
        } else {
          // Cart expired, clear it
          localStorage.removeItem(CART_STORAGE_KEY);
          localStorage.removeItem(CART_EXPIRY_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
    }
    return [];
  });

  const [showRestaurantChangeModal, setShowRestaurantChangeModal] = useState(false);
  const [pendingItem, setPendingItem] = useState<Omit<CartItem, "quantity"> | null>(null);

  const currentRestaurantId = items.length > 0 ? items[0].restaurantId : null;

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      if (items.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        localStorage.setItem(CART_EXPIRY_KEY, (Date.now() + CART_EXPIRY_TIME).toString());
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(CART_EXPIRY_KEY);
      }
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [items]);

  const addItem = (newItem: Omit<CartItem, "quantity">) => {
    // Check if adding from different restaurant
    if (currentRestaurantId && currentRestaurantId !== newItem.restaurantId) {
      setPendingItem(newItem);
      setShowRestaurantChangeModal(true);
      return;
    }

    setItems((prev) => {
      const existing = prev.find((item) => item.menuItemId === newItem.menuItemId);
      if (existing) {
        return prev.map((item) =>
          item.menuItemId === newItem.menuItemId ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  };

  const confirmRestaurantChange = () => {
    if (pendingItem) {
      setItems([{ ...pendingItem, quantity: 1 }]);
      setPendingItem(null);
    }
    setShowRestaurantChangeModal(false);
  };

  const removeItem = (menuItemId: string) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.menuItemId === menuItemId);
      if (!existing) return prev;

      if (existing.quantity === 1) {
        return prev.filter((item) => item.menuItemId !== menuItemId);
      }

      return prev.map((item) => (item.menuItemId === menuItemId ? { ...item, quantity: item.quantity - 1 } : item));
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity === 0) {
      setItems((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
    } else {
      setItems((prev) => prev.map((item) => (item.menuItemId === menuItemId ? { ...item, quantity } : item)));
    }
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_EXPIRY_KEY);
  };

  const getItemQuantity = (menuItemId: string) => {
    return items.find((item) => item.menuItemId === menuItemId)?.quantity || 0;
  };

  const getRestaurantItemQuantity = (menuItemId: string) => {
    return items.find((item) => item.menuItemId === menuItemId)?.quantity || 0;
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
        showRestaurantChangeModal,
        setShowRestaurantChangeModal,
        pendingItem,
        setPendingItem,
        confirmRestaurantChange,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
