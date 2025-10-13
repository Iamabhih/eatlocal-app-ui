// src/lib/constants.ts
// Centralized constants to avoid magic numbers throughout the codebase

export const PRICING = {
  // Service fees
  SERVICE_FEE_RATE: 0.045, // 4.5% settlement fee
  PLATFORM_COMMISSION: 0.15, // 15% platform commission for restaurants
  DELIVERY_PARTNER_FEE: 0.15, // 15% fee for delivery partners
  
  // Default fees (can be overridden by restaurant)
  DEFAULT_DELIVERY_FEE: 2.49,
  DEFAULT_MINIMUM_ORDER: 0,
} as const;

export const CART = {
  STORAGE_KEY: 'eatlocal_cart',
  EXPIRY_KEY: 'eatlocal_cart_expiry',
  EXPIRY_TIME: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
} as const;

export const ORDER = {
  PICKUP_CODE_LENGTH: 4,
  NUMBER_PREFIX: 'ORD',
  PENDING_ORDER_EXPIRY: 30 * 60 * 1000, // 30 minutes
} as const;

export const QUERY_CACHE = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  CACHE_TIME: 10 * 60 * 1000, // 10 minutes
} as const;

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

export const RESTAURANT = {
  DEFAULT_PREP_TIME: 15, // minutes
  DEFAULT_DELIVERY_TIME: 30, // minutes
  MAX_DELIVERY_RADIUS: 10, // km
} as const;

export const PAYFAST = {
  PRODUCTION_URL: 'https://www.payfast.co.za/eng/process',
  SANDBOX_URL: 'https://sandbox.payfast.co.za/eng/process',
} as const;

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  CART: '/cart',
  CHECKOUT: '/checkout',
  RESTAURANTS: '/restaurants',
  CUSTOMER: '/customer',
  RESTAURANT_DASHBOARD: '/restaurant/dashboard',
  DELIVERY_DASHBOARD: '/delivery/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY_FOR_PICKUP: 'ready_for_pickup',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const USER_ROLES = {
  CUSTOMER: 'customer',
  RESTAURANT: 'restaurant',
  DELIVERY_PARTNER: 'delivery_partner',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Usage example:
// import { PRICING, CART, ORDER_STATUS } from '@/lib/constants';
// const serviceFee = subtotal * PRICING.SERVICE_FEE_RATE;
// localStorage.setItem(CART.STORAGE_KEY, JSON.stringify(items));
// if (order.status === ORDER_STATUS.CONFIRMED) { ... }
