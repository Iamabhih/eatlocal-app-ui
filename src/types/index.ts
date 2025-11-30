/**
 * Centralized type definitions for enterprise consistency
 * All shared types should be imported from this file
 */

// Re-export UserRole from AuthContext for backward compatibility
export { type UserRole } from '@/contexts/AuthContext';

/**
 * Order status values - aligned with database enum
 */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

/**
 * Payment status values
 */
export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'partial'
  | 'refunded'
  | 'failed';

/**
 * Verification status values
 */
export type VerificationStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

/**
 * Restaurant business types
 */
export type BusinessType =
  | 'restaurant'
  | 'dark_kitchen'
  | 'home_seller'
  | 'spaza_shop'
  | 'food_truck';

/**
 * Fulfillment types for orders
 */
export type FulfillmentType =
  | 'delivery'
  | 'pickup'
  | 'dine_in';

/**
 * Hotel property types
 */
export type PropertyType =
  | 'hotel'
  | 'guesthouse'
  | 'bnb'
  | 'lodge'
  | 'resort'
  | 'apartment'
  | 'hostel';

/**
 * Venue types
 */
export type VenueType =
  | 'restaurant'
  | 'bar'
  | 'club'
  | 'cafe'
  | 'brewery'
  | 'winery'
  | 'museum'
  | 'gallery'
  | 'theater'
  | 'cinema'
  | 'park'
  | 'beach'
  | 'nature_reserve'
  | 'hiking_trail'
  | 'spa'
  | 'gym'
  | 'sports_facility'
  | 'adventure_park'
  | 'tour_operator'
  | 'event_space'
  | 'conference_center'
  | 'market'
  | 'shopping'
  | 'entertainment'
  | 'other';

/**
 * Experience types
 */
export type ExperienceType =
  | 'tour'
  | 'activity'
  | 'class'
  | 'workshop'
  | 'tasting'
  | 'adventure'
  | 'wellness'
  | 'sports'
  | 'entertainment'
  | 'food_experience'
  | 'cultural'
  | 'nature'
  | 'nightlife'
  | 'event'
  | 'private_event'
  | 'other';

/**
 * Ride/journey modes
 */
export type JourneyMode =
  | 'budget'
  | 'enhanced'
  | 'premium'
  | 'luxury'
  | 'night_out'
  | 'family'
  | 'business'
  | 'female_only';

/**
 * Notification types
 */
export type NotificationType =
  | 'order'
  | 'promo'
  | 'system'
  | 'delivery'
  | 'review'
  | 'loyalty'
  | 'alert'
  | 'referral'
  | 'payment';

/**
 * Booking status for hotels/venues
 */
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'completed'
  | 'cancelled'
  | 'no_show';

/**
 * Refund status
 */
export type RefundStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'processed';

/**
 * Base entity interface with common fields
 */
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Restaurant interface
 */
export interface Restaurant extends BaseEntity {
  owner_id: string;
  name: string;
  slug?: string;
  description?: string;
  cuisine_type?: string;
  street_address: string;
  city: string;
  state?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  banner_url?: string;
  is_active: boolean;
  is_featured: boolean;
  business_type?: BusinessType;
  verification_status?: VerificationStatus;
  commission_rate?: number;
  rating?: number;
  total_reviews?: number;
  delivery_radius_km?: number;
  min_order_amount?: number;
  estimated_delivery_time?: number;
}

/**
 * Menu item interface
 */
export interface MenuItem extends BaseEntity {
  restaurant_id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  preparation_time?: number;
  calories?: number;
  dietary_info?: string[];
  sort_order?: number;
}

/**
 * Menu category interface
 */
export interface MenuCategory extends BaseEntity {
  restaurant_id: string;
  name: string;
  description?: string;
  sort_order?: number;
  is_active: boolean;
}

/**
 * Order interface
 */
export interface Order extends BaseEntity {
  order_number: string;
  customer_id: string;
  restaurant_id: string;
  delivery_address_id?: string;
  delivery_partner_id?: string;
  status: OrderStatus;
  fulfillment_type: FulfillmentType;
  subtotal: number;
  delivery_fee: number;
  service_fee?: number;
  tax?: number;
  tip?: number;
  discount?: number;
  total: number;
  special_instructions?: string;
  estimated_delivery_time?: string;
  accepted_at?: string;
  ready_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

/**
 * Order item interface
 */
export interface OrderItem extends BaseEntity {
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  menu_item?: MenuItem;
}

/**
 * Customer address interface
 */
export interface CustomerAddress extends BaseEntity {
  user_id: string;
  label?: string;
  street_address: string;
  apartment?: string;
  city: string;
  state?: string;
  zip_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  delivery_instructions?: string;
}

/**
 * Review interface
 */
export interface Review extends BaseEntity {
  user_id: string;
  restaurant_id?: string;
  order_id?: string;
  rating: number;
  title?: string;
  comment?: string;
  is_verified: boolean;
  helpful_count?: number;
  response_text?: string;
  response_date?: string;
}

/**
 * Notification interface
 */
export interface Notification extends BaseEntity {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  data?: Record<string, unknown>;
}

/**
 * Promo code interface
 */
export interface PromoCode extends BaseEntity {
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  per_user_limit?: number;
  times_used: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  restaurant_id?: string;
  applicable_service?: 'food' | 'rides' | 'hotels' | 'experiences' | 'all';
}

/**
 * Wallet interface
 */
export interface Wallet extends BaseEntity {
  user_id: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

/**
 * Wallet transaction interface
 */
export interface WalletTransaction extends BaseEntity {
  wallet_id: string;
  type: 'credit' | 'debit' | 'refund' | 'bonus' | 'referral';
  amount: number;
  description?: string;
  reference_id?: string;
  reference_type?: string;
  balance_after: number;
}

/**
 * Driver/Delivery partner interface
 */
export interface DeliveryPartner extends BaseEntity {
  user_id: string;
  vehicle_type: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  license_plate?: string;
  is_online: boolean;
  is_verified: boolean;
  current_latitude?: number;
  current_longitude?: number;
  rating?: number;
  total_deliveries?: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Sort params
 */
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Filter params for queries
 */
export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | number | boolean | undefined;
}
