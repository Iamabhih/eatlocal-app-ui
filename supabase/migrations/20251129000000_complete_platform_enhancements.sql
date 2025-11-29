-- =====================================================
-- COMPLETE PLATFORM ENHANCEMENTS MIGRATION
-- Date: 2024-11-29
-- Description: Adds all missing features for world-class experience
-- =====================================================

-- =====================================================
-- 1. USER MANAGEMENT ENHANCEMENTS
-- =====================================================

-- Add suspension tracking to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'is_suspended') THEN
    ALTER TABLE public.profiles ADD COLUMN is_suspended BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'suspended_at') THEN
    ALTER TABLE public.profiles ADD COLUMN suspended_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'suspension_reason') THEN
    ALTER TABLE public.profiles ADD COLUMN suspension_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'email_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'two_factor_enabled') THEN
    ALTER TABLE public.profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Two-Factor Authentication Table
CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  backup_codes TEXT[] DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on two_factor_auth
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;

-- Users can only access their own 2FA settings
CREATE POLICY "Users can view own 2FA" ON public.two_factor_auth
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA" ON public.two_factor_auth
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA" ON public.two_factor_auth
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 2. NOTIFICATION PREFERENCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_updates BOOLEAN DEFAULT true,
  promotional_offers BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  delivery_updates BOOLEAN DEFAULT true,
  review_reminders BOOLEAN DEFAULT true,
  loyalty_updates BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for notification_preferences
CREATE POLICY IF NOT EXISTS "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. NOTIFICATIONS INBOX TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order', 'promo', 'system', 'delivery', 'review', 'loyalty', 'alert')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. DELIVERY PARTNER ENHANCEMENTS
-- =====================================================

-- Delivery partner availability status
CREATE TABLE IF NOT EXISTS public.delivery_partner_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  last_online_at TIMESTAMPTZ,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  available_for_orders BOOLEAN DEFAULT true,
  max_concurrent_orders INT DEFAULT 3,
  current_order_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id)
);

ALTER TABLE public.delivery_partner_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Partners can view own status"
  ON public.delivery_partner_status FOR SELECT
  USING (auth.uid() = partner_id);

CREATE POLICY IF NOT EXISTS "Partners can update own status"
  ON public.delivery_partner_status FOR UPDATE
  USING (auth.uid() = partner_id);

CREATE POLICY IF NOT EXISTS "Partners can insert own status"
  ON public.delivery_partner_status FOR INSERT
  WITH CHECK (auth.uid() = partner_id);

CREATE POLICY IF NOT EXISTS "Admins can view all partner statuses"
  ON public.delivery_partner_status FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')));

-- Available orders queue for delivery partners
CREATE TABLE IF NOT EXISTS public.available_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  restaurant_latitude DECIMAL(10, 8),
  restaurant_longitude DECIMAL(11, 8),
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),
  estimated_distance_km DECIMAL(10, 2),
  estimated_earnings DECIMAL(10, 2),
  priority INT DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_available_orders_expires ON public.available_orders(expires_at);

ALTER TABLE public.available_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Partners can view available orders"
  ON public.available_orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'delivery_partner'));

-- Order offers to specific delivery partners
CREATE TABLE IF NOT EXISTS public.order_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  offered_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  estimated_earnings DECIMAL(10, 2),
  rejection_reason TEXT,
  UNIQUE(order_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_order_offers_partner ON public.order_offers(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_order_offers_order ON public.order_offers(order_id);

ALTER TABLE public.order_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Partners can view own offers"
  ON public.order_offers FOR SELECT
  USING (auth.uid() = partner_id);

CREATE POLICY IF NOT EXISTS "Partners can update own offers"
  ON public.order_offers FOR UPDATE
  USING (auth.uid() = partner_id);

-- =====================================================
-- 5. MENU ITEM STOCK TRACKING
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'menu_items' AND column_name = 'stock_quantity') THEN
    ALTER TABLE public.menu_items ADD COLUMN stock_quantity INT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'menu_items' AND column_name = 'track_stock') THEN
    ALTER TABLE public.menu_items ADD COLUMN track_stock BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'menu_items' AND column_name = 'low_stock_threshold') THEN
    ALTER TABLE public.menu_items ADD COLUMN low_stock_threshold INT DEFAULT 10;
  END IF;
END $$;

-- =====================================================
-- 6. RESTAURANT OPERATING HOURS (DAY-SPECIFIC)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.restaurant_operating_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  is_open BOOLEAN DEFAULT true,
  opening_time TIME,
  closing_time TIME,
  break_start TIME,
  break_end TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, day_of_week)
);

ALTER TABLE public.restaurant_operating_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can view restaurant hours"
  ON public.restaurant_operating_hours FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Restaurant owners can manage hours"
  ON public.restaurant_operating_hours FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = restaurant_id AND owner_id = auth.uid()
  ));

-- Special closures/holidays
CREATE TABLE IF NOT EXISTS public.restaurant_special_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  closure_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, closure_date)
);

ALTER TABLE public.restaurant_special_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can view closures"
  ON public.restaurant_special_closures FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Restaurant owners can manage closures"
  ON public.restaurant_special_closures FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = restaurant_id AND owner_id = auth.uid()
  ));

-- =====================================================
-- 7. VENDOR PROMOTIONS MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vendor_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat', 'bogo', 'free_delivery')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2),
  promo_code TEXT,
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'category', 'items')),
  applicable_items UUID[] DEFAULT '{}',
  applicable_categories UUID[] DEFAULT '{}',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  usage_limit INT,
  usage_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_promotions_restaurant ON public.vendor_promotions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_vendor_promotions_active ON public.vendor_promotions(is_active, start_date, end_date);

ALTER TABLE public.vendor_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can view active promotions"
  ON public.vendor_promotions FOR SELECT
  USING (is_active = true AND now() BETWEEN start_date AND end_date);

CREATE POLICY IF NOT EXISTS "Restaurant owners can manage promotions"
  ON public.vendor_promotions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = restaurant_id AND owner_id = auth.uid()
  ));

-- =====================================================
-- 8. VENDOR PAYOUT REQUESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vendor_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
  bank_name TEXT,
  account_number TEXT,
  branch_code TEXT,
  account_holder_name TEXT,
  reference_number TEXT,
  notes TEXT,
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_restaurant ON public.vendor_payout_requests(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.vendor_payout_requests(status);

ALTER TABLE public.vendor_payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Restaurant owners can view own payouts"
  ON public.vendor_payout_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = restaurant_id AND owner_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "Restaurant owners can request payouts"
  ON public.vendor_payout_requests FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = restaurant_id AND owner_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "Admins can manage all payouts"
  ON public.vendor_payout_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')));

-- Vendor earnings tracking
CREATE TABLE IF NOT EXISTS public.vendor_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  order_amount DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 4) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,
  net_earnings DECIMAL(10, 2) NOT NULL,
  is_paid_out BOOLEAN DEFAULT false,
  payout_request_id UUID REFERENCES public.vendor_payout_requests(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_earnings_restaurant ON public.vendor_earnings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_vendor_earnings_paid ON public.vendor_earnings(is_paid_out);

ALTER TABLE public.vendor_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Restaurant owners can view own earnings"
  ON public.vendor_earnings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = restaurant_id AND owner_id = auth.uid()
  ));

-- =====================================================
-- 9. RIDES MODULE - COMPLETE SCHEMA
-- =====================================================

-- Create ride service tiers if not exists
CREATE TABLE IF NOT EXISTS public.ride_service_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  base_fare DECIMAL(10, 2) NOT NULL,
  per_km_rate DECIMAL(10, 4) NOT NULL,
  per_minute_rate DECIMAL(10, 4) DEFAULT 0,
  minimum_fare DECIMAL(10, 2) NOT NULL,
  cancellation_fee DECIMAL(10, 2) DEFAULT 0,
  vehicle_types TEXT[] DEFAULT '{}',
  icon TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default tiers if empty
INSERT INTO public.ride_service_tiers (name, display_name, description, base_fare, per_km_rate, minimum_fare, vehicle_types, sort_order)
SELECT 'budget', 'Budget', 'Affordable rides for everyday trips', 15.00, 8.00, 25.00, ARRAY['sedan', 'hatchback'], 1
WHERE NOT EXISTS (SELECT 1 FROM public.ride_service_tiers WHERE name = 'budget');

INSERT INTO public.ride_service_tiers (name, display_name, description, base_fare, per_km_rate, minimum_fare, vehicle_types, sort_order)
SELECT 'comfort', 'Comfort', 'Comfortable rides with extra space', 25.00, 12.00, 40.00, ARRAY['sedan', 'suv'], 2
WHERE NOT EXISTS (SELECT 1 FROM public.ride_service_tiers WHERE name = 'comfort');

INSERT INTO public.ride_service_tiers (name, display_name, description, base_fare, per_km_rate, minimum_fare, vehicle_types, sort_order)
SELECT 'premium', 'Premium', 'Premium vehicles for special occasions', 45.00, 18.00, 75.00, ARRAY['luxury', 'suv'], 3
WHERE NOT EXISTS (SELECT 1 FROM public.ride_service_tiers WHERE name = 'premium');

INSERT INTO public.ride_service_tiers (name, display_name, description, base_fare, per_km_rate, minimum_fare, vehicle_types, sort_order)
SELECT 'xl', 'XL', 'Extra large vehicles for groups', 35.00, 15.00, 60.00, ARRAY['suv', 'van', 'minibus'], 4
WHERE NOT EXISTS (SELECT 1 FROM public.ride_service_tiers WHERE name = 'xl');

ALTER TABLE public.ride_service_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can view ride tiers"
  ON public.ride_service_tiers FOR SELECT
  USING (is_active = true);

-- Drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INT NOT NULL,
  vehicle_color TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('sedan', 'hatchback', 'suv', 'van', 'minibus', 'luxury')),
  insurance_number TEXT,
  insurance_expiry DATE,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 5.00,
  total_rides INT DEFAULT 0,
  total_earnings DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_drivers_online ON public.drivers(is_online, is_verified, is_active);
CREATE INDEX IF NOT EXISTS idx_drivers_location ON public.drivers(current_latitude, current_longitude) WHERE is_online = true;

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Drivers can view own profile"
  ON public.drivers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Drivers can update own profile"
  ON public.drivers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Anyone can view online drivers"
  ON public.drivers FOR SELECT
  USING (is_online = true AND is_verified = true AND is_active = true);

-- Riders table
CREATE TABLE IF NOT EXISTS public.riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  default_payment_method TEXT DEFAULT 'cash',
  rating DECIMAL(3, 2) DEFAULT 5.00,
  total_rides INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Riders can view own profile"
  ON public.riders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Riders can manage own profile"
  ON public.riders FOR ALL
  USING (auth.uid() = user_id);

-- Rides table
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES public.riders(id),
  driver_id UUID REFERENCES public.drivers(id),
  service_tier_id UUID REFERENCES public.ride_service_tiers(id),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'searching', 'driver_assigned', 'driver_arriving', 'arrived', 'in_progress', 'completed', 'cancelled')),
  pickup_address TEXT NOT NULL,
  pickup_latitude DECIMAL(10, 8) NOT NULL,
  pickup_longitude DECIMAL(11, 8) NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_latitude DECIMAL(10, 8) NOT NULL,
  dropoff_longitude DECIMAL(11, 8) NOT NULL,
  estimated_distance_km DECIMAL(10, 2),
  actual_distance_km DECIMAL(10, 2),
  estimated_duration_mins INT,
  actual_duration_mins INT,
  estimated_fare DECIMAL(10, 2),
  final_fare DECIMAL(10, 2),
  surge_multiplier DECIMAL(4, 2) DEFAULT 1.00,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'wallet')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  special_instructions TEXT,
  cancellation_reason TEXT,
  cancelled_by TEXT CHECK (cancelled_by IN ('rider', 'driver', 'system')),
  driver_arrived_at TIMESTAMPTZ,
  ride_started_at TIMESTAMPTZ,
  ride_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rides_rider ON public.rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Riders can view own rides"
  ON public.rides FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.riders WHERE id = rider_id AND user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Riders can create rides"
  ON public.rides FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.riders WHERE id = rider_id AND user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Drivers can view assigned rides"
  ON public.rides FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.drivers WHERE id = driver_id AND user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Drivers can update assigned rides"
  ON public.rides FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.drivers WHERE id = driver_id AND user_id = auth.uid()));

-- Ride ratings
CREATE TABLE IF NOT EXISTS public.ride_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  rated_by TEXT NOT NULL CHECK (rated_by IN ('rider', 'driver')),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ride_id, rated_by)
);

ALTER TABLE public.ride_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view ride ratings"
  ON public.ride_ratings FOR SELECT
  USING (true);

-- Driver earnings
CREATE TABLE IF NOT EXISTS public.driver_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  ride_id UUID REFERENCES public.rides(id),
  fare_amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  net_earnings DECIMAL(10, 2) NOT NULL,
  tip_amount DECIMAL(10, 2) DEFAULT 0,
  is_paid_out BOOLEAN DEFAULT false,
  paid_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver ON public.driver_earnings(driver_id);

ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Drivers can view own earnings"
  ON public.driver_earnings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.drivers WHERE id = driver_id AND user_id = auth.uid()));

-- =====================================================
-- 10. RATE LIMITING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or user ID
  endpoint TEXT NOT NULL,
  request_count INT DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identifier, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON public.rate_limits(identifier, endpoint, window_start);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INT DEFAULT 100,
  p_window_seconds INT DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INT;
BEGIN
  v_window_start := date_trunc('minute', now());

  -- Try to increment existing record
  UPDATE public.rate_limits
  SET request_count = request_count + 1
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start = v_window_start
  RETURNING request_count INTO v_current_count;

  -- If no record exists, create one
  IF v_current_count IS NULL THEN
    INSERT INTO public.rate_limits (identifier, endpoint, window_start, request_count)
    VALUES (p_identifier, p_endpoint, v_window_start, 1)
    ON CONFLICT (identifier, endpoint, window_start)
    DO UPDATE SET request_count = rate_limits.request_count + 1
    RETURNING request_count INTO v_current_count;
  END IF;

  -- Clean up old records (older than 1 hour)
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 hour';

  -- Return true if under limit
  RETURN v_current_count <= p_max_requests;
END;
$$;

-- =====================================================
-- 11. HELPER FUNCTIONS
-- =====================================================

-- Function to find nearby available delivery partners
CREATE OR REPLACE FUNCTION public.find_nearby_delivery_partners(
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_radius_km DECIMAL DEFAULT 5
)
RETURNS TABLE (
  partner_id UUID,
  distance_km DECIMAL,
  current_order_count INT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    dps.partner_id,
    (6371 * acos(cos(radians(p_latitude))
      * cos(radians(dps.current_latitude))
      * cos(radians(dps.current_longitude) - radians(p_longitude))
      + sin(radians(p_latitude))
      * sin(radians(dps.current_latitude)))) AS distance_km,
    dps.current_order_count
  FROM public.delivery_partner_status dps
  WHERE dps.is_online = true
    AND dps.available_for_orders = true
    AND dps.current_order_count < dps.max_concurrent_orders
    AND dps.current_latitude IS NOT NULL
    AND dps.current_longitude IS NOT NULL
  HAVING (6371 * acos(cos(radians(p_latitude))
      * cos(radians(dps.current_latitude))
      * cos(radians(dps.current_longitude) - radians(p_longitude))
      + sin(radians(p_latitude))
      * sin(radians(dps.current_latitude)))) <= p_radius_km
  ORDER BY distance_km ASC
  LIMIT 10;
$$;

-- Function to calculate ride fare
CREATE OR REPLACE FUNCTION public.calculate_ride_fare(
  p_service_tier_id UUID,
  p_distance_km DECIMAL,
  p_duration_mins INT DEFAULT 0,
  p_surge_multiplier DECIMAL DEFAULT 1.0
)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_tier public.ride_service_tiers;
  v_fare DECIMAL;
BEGIN
  SELECT * INTO v_tier FROM public.ride_service_tiers WHERE id = p_service_tier_id;

  IF v_tier IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate fare: base + (distance * per_km) + (duration * per_minute)
  v_fare := v_tier.base_fare
    + (p_distance_km * v_tier.per_km_rate)
    + (p_duration_mins * COALESCE(v_tier.per_minute_rate, 0));

  -- Apply surge
  v_fare := v_fare * p_surge_multiplier;

  -- Ensure minimum fare
  IF v_fare < v_tier.minimum_fare THEN
    v_fare := v_tier.minimum_fare;
  END IF;

  RETURN ROUND(v_fare, 2);
END;
$$;

-- Function to assign delivery partner to order
CREATE OR REPLACE FUNCTION public.assign_delivery_partner(
  p_order_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order public.orders;
  v_restaurant public.restaurants;
  v_partner_id UUID;
BEGIN
  -- Get order details
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Get restaurant location
  SELECT * INTO v_restaurant FROM public.restaurants WHERE id = v_order.restaurant_id;
  IF v_restaurant IS NULL THEN
    RAISE EXCEPTION 'Restaurant not found';
  END IF;

  -- Find nearest available partner
  SELECT partner_id INTO v_partner_id
  FROM public.find_nearby_delivery_partners(
    v_restaurant.latitude,
    v_restaurant.longitude,
    15 -- 15km radius
  )
  LIMIT 1;

  IF v_partner_id IS NOT NULL THEN
    -- Create order offer
    INSERT INTO public.order_offers (order_id, partner_id, expires_at, estimated_earnings)
    VALUES (
      p_order_id,
      v_partner_id,
      now() + interval '2 minutes',
      v_order.delivery_fee * 0.8 -- 80% of delivery fee
    );

    -- Create notification
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
      v_partner_id,
      'New Delivery Request',
      'You have a new delivery request nearby',
      'delivery',
      '/delivery/orders'
    );
  END IF;

  RETURN v_partner_id;
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
