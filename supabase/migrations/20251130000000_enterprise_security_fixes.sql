-- =====================================================
-- Enterprise Security Fixes Migration
-- Fixes RLS and adds missing security policies
-- =====================================================

-- =====================================================
-- 1. RATE LIMITS TABLE SCHEMA FIX AND SECURITY
-- Ensure rate_limits has all required columns and RLS
-- =====================================================

-- Add missing columns to rate_limits if they don't exist
DO $$
BEGIN
  -- Add 'key' column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'rate_limits'
    AND column_name = 'key'
  ) THEN
    ALTER TABLE public.rate_limits ADD COLUMN key TEXT;
    CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);
  END IF;

  -- Add 'last_request' column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'rate_limits'
    AND column_name = 'last_request'
  ) THEN
    ALTER TABLE public.rate_limits ADD COLUMN last_request TIMESTAMPTZ;
  END IF;

  -- Add 'identifier' column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'rate_limits'
    AND column_name = 'identifier'
  ) THEN
    ALTER TABLE public.rate_limits ADD COLUMN identifier TEXT;
  END IF;

  -- Add 'endpoint' column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'rate_limits'
    AND column_name = 'endpoint'
  ) THEN
    ALTER TABLE public.rate_limits ADD COLUMN endpoint TEXT;
  END IF;
END $$;

-- Enable RLS on rate_limits (was missing from previous migration)
ALTER TABLE IF EXISTS public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all rate limits (for edge functions)
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;
CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy: Admins can view rate limits for monitoring
DROP POLICY IF EXISTS "Admins can view rate limits" ON public.rate_limits;
CREATE POLICY "Admins can view rate limits"
  ON public.rate_limits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- =====================================================
-- 2. USER ROLES TABLE SECURITY HARDENING
-- Ensure proper RLS policies
-- =====================================================

-- Make sure RLS is enabled
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'superadmin')
    )
  );

-- Only superadmins can modify roles
DROP POLICY IF EXISTS "Superadmins can manage roles" ON public.user_roles;
CREATE POLICY "Superadmins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- =====================================================
-- 3. PROFILES TABLE SECURITY
-- Ensure users can only update their own profiles
-- =====================================================

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'superadmin')
    )
  );

-- =====================================================
-- 4. TWO FACTOR AUTH SECURITY
-- Users should only access their own 2FA data
-- =====================================================

ALTER TABLE IF EXISTS public.two_factor_auth ENABLE ROW LEVEL SECURITY;

-- Users can only view their own 2FA status (not secrets)
DROP POLICY IF EXISTS "Users can view own 2FA" ON public.two_factor_auth;
CREATE POLICY "Users can view own 2FA"
  ON public.two_factor_auth
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can manage their own 2FA
DROP POLICY IF EXISTS "Users can manage own 2FA" ON public.two_factor_auth;
CREATE POLICY "Users can manage own 2FA"
  ON public.two_factor_auth
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 5. CUSTOMER ADDRESSES SECURITY
-- Users should only access their own addresses
-- =====================================================

ALTER TABLE IF EXISTS public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own addresses" ON public.customer_addresses;
CREATE POLICY "Users can manage own addresses"
  ON public.customer_addresses
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 6. ORDERS SECURITY
-- Customers see own orders, restaurants see their orders
-- =====================================================

ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

-- Customers can view their own orders
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Customers can create orders
DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
CREATE POLICY "Customers can create orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Restaurants can view orders for their restaurant
DROP POLICY IF EXISTS "Restaurants can view their orders" ON public.orders;
CREATE POLICY "Restaurants can view their orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_id
      AND r.owner_id = auth.uid()
    )
  );

-- Restaurants can update their orders
DROP POLICY IF EXISTS "Restaurants can update their orders" ON public.orders;
CREATE POLICY "Restaurants can update their orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_id
      AND r.owner_id = auth.uid()
    )
  );

-- Delivery partners can view assigned orders
DROP POLICY IF EXISTS "Delivery partners can view assigned orders" ON public.orders;
CREATE POLICY "Delivery partners can view assigned orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (delivery_partner_id = auth.uid());

-- Delivery partners can update assigned orders
DROP POLICY IF EXISTS "Delivery partners can update assigned orders" ON public.orders;
CREATE POLICY "Delivery partners can update assigned orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (delivery_partner_id = auth.uid());

-- Admins can view all orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'superadmin')
    )
  );

-- =====================================================
-- 7. PAYMENTS SECURITY
-- Only relevant parties can see payment info
-- =====================================================

ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view payments for their orders
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND o.customer_id = auth.uid()
    )
  );

-- Admins can view all payments
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'superadmin')
    )
  );

-- =====================================================
-- 8. WALLET AND TRANSACTIONS SECURITY
-- =====================================================

ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet"
  ON public.wallets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own transactions"
  ON public.wallet_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = wallet_id
      AND w.user_id = auth.uid()
    )
  );

-- =====================================================
-- 9. AUDIT LOG FOR SECURITY EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_user ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_event ON public.security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_time ON public.security_audit_log(created_at DESC);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.security_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'superadmin')
    )
  );

-- Service role can insert audit logs
CREATE POLICY "Service can insert audit logs"
  ON public.security_audit_log
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 10. HELPER FUNCTION FOR SECURITY LOGGING
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_event_details JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_details
  ) VALUES (
    COALESCE(p_user_id, auth.uid()),
    p_event_type,
    p_event_details
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;

-- =====================================================
-- 11. CLEANUP OLD RATE LIMIT RECORDS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Grant execute to service role only (will be called by scheduled function)
REVOKE ALL ON FUNCTION public.cleanup_old_rate_limits FROM PUBLIC;
