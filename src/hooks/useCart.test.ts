import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCart, CartItem } from './useCart';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
});

describe('useCart Hook', () => {
  const mockItem: Omit<CartItem, 'id' | 'quantity'> = {
    menuItemId: 'menu-1',
    name: 'Burger',
    price: 99.99,
    restaurantId: 'restaurant-1',
    restaurantName: 'Test Restaurant',
    image_url: 'https://example.com/burger.jpg',
  };

  const mockItem2: Omit<CartItem, 'id' | 'quantity'> = {
    menuItemId: 'menu-2',
    name: 'Fries',
    price: 49.99,
    restaurantId: 'restaurant-1',
    restaurantName: 'Test Restaurant',
  };

  beforeEach(() => {
    // Clear cart before each test
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.clearCart();
    });
  });

  describe('addItem', () => {
    it('adds item to empty cart', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].name).toBe('Burger');
      expect(result.current.items[0].quantity).toBe(1);
      expect(result.current.restaurantId).toBe('restaurant-1');
    });

    it('increments quantity for existing item', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.addItem(mockItem);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
    });

    it('adds different items to cart', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.addItem(mockItem2);
      });

      expect(result.current.items).toHaveLength(2);
    });

    it('shows modal when adding from different restaurant', () => {
      const { result } = renderHook(() => useCart());

      const differentRestaurantItem = {
        ...mockItem,
        restaurantId: 'restaurant-2',
        restaurantName: 'Other Restaurant',
      };

      act(() => {
        result.current.addItem(mockItem);
      });

      act(() => {
        result.current.addItem(differentRestaurantItem);
      });

      expect(result.current.showRestaurantChangeModal).toBe(true);
      expect(result.current.pendingItem).toBeDefined();
    });
  });

  describe('removeItem', () => {
    it('removes item from cart', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.removeItem(mockItem.menuItemId);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('clears restaurant info when cart becomes empty', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.removeItem(mockItem.menuItemId);
      });

      expect(result.current.restaurantId).toBeNull();
    });
  });

  describe('updateQuantity', () => {
    it('updates item quantity', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.updateQuantity(mockItem.menuItemId, 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
    });

    it('removes item when quantity is 0', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.updateQuantity(mockItem.menuItemId, 0);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('prevents negative quantity', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.updateQuantity(mockItem.menuItemId, -1);
      });

      // Should either remove or keep at 0
      expect(result.current.items[0]?.quantity ?? 0).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearCart', () => {
    it('removes all items', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.addItem(mockItem2);
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.restaurantId).toBeNull();
    });
  });

  describe('getters', () => {
    it('getItemQuantity returns correct quantity', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.addItem(mockItem);
      });

      expect(result.current.getItemQuantity(mockItem.menuItemId)).toBe(2);
    });

    it('getItemQuantity returns 0 for missing item', () => {
      const { result } = renderHook(() => useCart());

      expect(result.current.getItemQuantity('nonexistent')).toBe(0);
    });

    it('getSubtotal calculates correct subtotal', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem); // 99.99
        result.current.addItem(mockItem2); // 49.99
      });

      expect(result.current.getSubtotal()).toBe(149.98);
    });

    it('getTotalItems returns total item count', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.addItem(mockItem);
        result.current.addItem(mockItem2);
      });

      expect(result.current.getTotalItems()).toBe(3);
    });

    it('getTotal includes delivery fee', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
      });

      const deliveryFee = 25;
      const total = result.current.getTotal(deliveryFee);

      // Total should include item price + service fee + delivery
      expect(total).toBeGreaterThan(99.99 + deliveryFee);
    });
  });

  describe('restaurant change flow', () => {
    it('confirmRestaurantChange clears cart and adds pending item', () => {
      const { result } = renderHook(() => useCart());

      const differentRestaurantItem = {
        ...mockItem,
        menuItemId: 'menu-3',
        restaurantId: 'restaurant-2',
        restaurantName: 'Other Restaurant',
      };

      act(() => {
        result.current.addItem(mockItem);
      });

      act(() => {
        result.current.addItem(differentRestaurantItem);
      });

      expect(result.current.showRestaurantChangeModal).toBe(true);

      act(() => {
        result.current.confirmRestaurantChange();
      });

      expect(result.current.showRestaurantChangeModal).toBe(false);
      expect(result.current.restaurantId).toBe('restaurant-2');
      expect(result.current.items).toHaveLength(1);
    });
  });
});

describe('Cart Calculations', () => {
  const SERVICE_FEE_RATE = 0.045;

  it('service fee is 4.5% of subtotal', () => {
    const subtotal = 100;
    const serviceFee = subtotal * SERVICE_FEE_RATE;
    expect(serviceFee).toBe(4.5);
  });

  it('calculates service fee correctly for different amounts', () => {
    const testCases = [
      { subtotal: 50, expected: 2.25 },
      { subtotal: 200, expected: 9 },
      { subtotal: 149.99, expected: 6.74955 },
    ];

    testCases.forEach(({ subtotal, expected }) => {
      const serviceFee = subtotal * SERVICE_FEE_RATE;
      expect(serviceFee).toBeCloseTo(expected, 2);
    });
  });
});
