// Query cache configuration
export const QUERY_CACHE = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  GC_TIME: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in React Query v5)
} as const;

// Pricing constants
export const PRICING = {
  DELIVERY_FEE: 2.49,
  SERVICE_FEE_RATE: 0.045, // 4.5%
  PLATFORM_COMMISSION_RATE: 0.15, // 15%
  SETTLEMENT_FEE_RATE: 0.045, // 4.5%
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  CUSTOMER: 'customer',
  RESTAURANT: 'restaurant',
  DELIVERY_PARTNER: 'delivery_partner',
  SHOP: 'shop',
} as const;
