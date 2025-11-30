-- =============================================
-- COMPREHENSIVE PLATFORM MIGRATION
-- Creates all missing tables for full functionality
-- =============================================

-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
ADD COLUMN IF NOT EXISTS suspension_reason text,
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false;

-- 2. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system',
  is_read boolean DEFAULT false,
  action_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- 3. Panic alerts table
CREATE TABLE IF NOT EXISTS public.panic_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  latitude numeric,
  longitude numeric,
  address text,
  province text,
  description text,
  status text DEFAULT 'active',
  user_name text,
  user_phone text,
  user_email text,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.panic_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert panic alerts" ON public.panic_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own panic alerts" ON public.panic_alerts
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all panic alerts" ON public.panic_alerts
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admins can update panic alerts" ON public.panic_alerts
  FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

-- 4. Delivery partner status table
CREATE TABLE IF NOT EXISTS public.delivery_partner_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL UNIQUE,
  is_online boolean DEFAULT false,
  last_online_at timestamptz,
  current_latitude numeric,
  current_longitude numeric,
  available_for_orders boolean DEFAULT true,
  max_concurrent_orders integer DEFAULT 3,
  current_order_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.delivery_partner_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can manage their own status" ON public.delivery_partner_status
  FOR ALL USING (auth.uid() = partner_id) WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Admins can view all partner status" ON public.delivery_partner_status
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

-- 5. Order offers table
CREATE TABLE IF NOT EXISTS public.order_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  status text DEFAULT 'pending',
  offered_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  expires_at timestamptz NOT NULL,
  estimated_earnings numeric,
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their offers" ON public.order_offers
  FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY "Partners can update their offers" ON public.order_offers
  FOR UPDATE USING (auth.uid() = partner_id);

CREATE POLICY "Admins can manage all offers" ON public.order_offers
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

-- 6. Hotels table
CREATE TABLE IF NOT EXISTS public.hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  slug text UNIQUE,
  street_address text NOT NULL,
  city text NOT NULL,
  state text,
  country text DEFAULT 'South Africa',
  zip_code text,
  latitude numeric,
  longitude numeric,
  phone text,
  email text,
  website text,
  star_rating integer,
  property_type text DEFAULT 'hotel',
  amenities text[] DEFAULT '{}',
  main_image text,
  gallery_images text[] DEFAULT '{}',
  check_in_time text DEFAULT '14:00',
  check_out_time text DEFAULT '11:00',
  cancellation_policy text DEFAULT 'Flexible',
  house_rules text,
  base_price numeric,
  currency text DEFAULT 'ZAR',
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  verification_status text DEFAULT 'pending',
  total_rooms integer DEFAULT 0,
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active hotels" ON public.hotels
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage their hotels" ON public.hotels
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all hotels" ON public.hotels
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

-- 7. Room types table
CREATE TABLE IF NOT EXISTS public.room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  max_guests integer DEFAULT 2,
  beds_description text,
  room_size_sqm numeric,
  base_price numeric NOT NULL,
  weekend_price numeric,
  total_rooms integer DEFAULT 1,
  amenities text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view room types" ON public.room_types
  FOR SELECT USING (is_active = true);

CREATE POLICY "Hotel owners can manage room types" ON public.room_types
  FOR ALL USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = room_types.hotel_id AND hotels.owner_id = auth.uid()));

-- 8. Hotel bookings table
CREATE TABLE IF NOT EXISTS public.hotel_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text UNIQUE DEFAULT 'HB-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id),
  room_type_id uuid NOT NULL REFERENCES public.room_types(id),
  guest_id uuid,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  num_guests integer DEFAULT 1,
  num_rooms integer DEFAULT 1,
  nightly_rate numeric NOT NULL,
  num_nights integer NOT NULL,
  subtotal numeric NOT NULL,
  taxes numeric DEFAULT 0,
  fees numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric NOT NULL,
  currency text DEFAULT 'ZAR',
  payment_status text DEFAULT 'pending',
  payment_method text,
  payment_reference text,
  status text DEFAULT 'pending',
  special_requests text,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests can view their bookings" ON public.hotel_bookings
  FOR SELECT USING (auth.uid() = guest_id);

CREATE POLICY "Guests can create bookings" ON public.hotel_bookings
  FOR INSERT WITH CHECK (auth.uid() = guest_id OR guest_id IS NULL);

CREATE POLICY "Guests can update their bookings" ON public.hotel_bookings
  FOR UPDATE USING (auth.uid() = guest_id);

CREATE POLICY "Hotel owners can view bookings" ON public.hotel_bookings
  FOR SELECT USING (EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_bookings.hotel_id AND hotels.owner_id = auth.uid()));

CREATE POLICY "Admins can manage all bookings" ON public.hotel_bookings
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

-- 9. Loyalty tiers table
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  min_points integer NOT NULL DEFAULT 0,
  multiplier numeric NOT NULL DEFAULT 1,
  benefits text[] DEFAULT '{}',
  badge_color text NOT NULL
);

ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view loyalty tiers" ON public.loyalty_tiers
  FOR SELECT USING (true);

-- Insert default tiers
INSERT INTO public.loyalty_tiers (name, min_points, multiplier, benefits, badge_color) VALUES
  ('Bronze', 0, 1, ARRAY['Free delivery on first order', '1 point per R10 spent'], '#CD7F32'),
  ('Silver', 500, 1.25, ARRAY['Free delivery on orders over R100', '1.25x points multiplier', 'Birthday reward'], '#C0C0C0'),
  ('Gold', 2000, 1.5, ARRAY['Free delivery on all orders', '1.5x points multiplier', 'Priority support', 'Exclusive offers'], '#FFD700'),
  ('Platinum', 5000, 2, ARRAY['Free delivery always', '2x points multiplier', 'VIP support', 'Early access to new features', 'Annual gift'], '#E5E4E2')
ON CONFLICT (name) DO NOTHING;

-- 10. User loyalty table
CREATE TABLE IF NOT EXISTS public.user_loyalty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_points integer DEFAULT 0,
  current_points integer DEFAULT 0,
  tier_id uuid REFERENCES public.loyalty_tiers(id),
  lifetime_orders integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_loyalty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own loyalty" ON public.user_loyalty
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty" ON public.user_loyalty
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert loyalty records" ON public.user_loyalty
  FOR INSERT WITH CHECK (true);

-- 11. Loyalty transactions table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_loyalty_id uuid NOT NULL REFERENCES public.user_loyalty(id) ON DELETE CASCADE,
  type text NOT NULL,
  points integer NOT NULL,
  description text,
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their loyalty transactions" ON public.loyalty_transactions
  FOR SELECT USING (EXISTS (SELECT 1 FROM user_loyalty WHERE user_loyalty.id = loyalty_transactions.user_loyalty_id AND user_loyalty.user_id = auth.uid()));

-- 12. Saved payment methods table
CREATE TABLE IF NOT EXISTS public.saved_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_type text NOT NULL,
  last_four text NOT NULL,
  expiry_month integer NOT NULL,
  expiry_year integer NOT NULL,
  cardholder_name text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.saved_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own payment methods" ON public.saved_payment_methods
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 13. User wallets table
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric DEFAULT 0,
  currency text DEFAULT 'ZAR',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.user_wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallets" ON public.user_wallets
  FOR INSERT WITH CHECK (true);

-- 14. Wallet transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.user_wallets(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric NOT NULL,
  description text,
  reference_id uuid,
  reference_type text,
  balance_after numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (EXISTS (SELECT 1 FROM user_wallets WHERE user_wallets.id = wallet_transactions.wallet_id AND user_wallets.user_id = auth.uid()));

CREATE POLICY "System can insert wallet transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (true);

-- 15. Two-factor auth table
CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_enabled boolean DEFAULT false,
  secret text,
  backup_codes text[],
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own 2FA" ON public.two_factor_auth
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 16. Helper function for incrementing order count
CREATE OR REPLACE FUNCTION public.increment_order_count(p_partner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE delivery_partner_status
  SET current_order_count = current_order_count + 1,
      updated_at = now()
  WHERE partner_id = p_partner_id;
END;
$$;

-- 17. Room availability check function
CREATE OR REPLACE FUNCTION public.check_room_availability(
  p_room_type_id uuid,
  p_check_in date,
  p_check_out date,
  p_num_rooms integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_rooms integer;
  v_booked_rooms integer;
BEGIN
  SELECT total_rooms INTO v_total_rooms
  FROM room_types
  WHERE id = p_room_type_id;

  SELECT COALESCE(SUM(num_rooms), 0) INTO v_booked_rooms
  FROM hotel_bookings
  WHERE room_type_id = p_room_type_id
    AND status NOT IN ('cancelled', 'no_show')
    AND check_in_date < p_check_out
    AND check_out_date > p_check_in;

  RETURN (v_total_rooms - v_booked_rooms) >= p_num_rooms;
END;
$$;