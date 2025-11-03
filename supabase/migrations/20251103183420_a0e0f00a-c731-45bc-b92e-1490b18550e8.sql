-- Production-critical indexes for performance optimization

-- Orders table indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_restaurant 
ON orders(status, restaurant_id) 
WHERE status IN ('pending', 'confirmed', 'preparing');

CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner 
ON orders(delivery_partner_id) 
WHERE status IN ('ready_for_pickup', 'picked_up');

CREATE INDEX IF NOT EXISTS idx_orders_customer 
ON orders(customer_id, created_at DESC);

-- Menu items indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_menu_items_available 
ON menu_items(restaurant_id, category_id) 
WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant 
ON menu_items(restaurant_id) 
WHERE is_available = true;

-- Order items for join performance
CREATE INDEX IF NOT EXISTS idx_order_items_order 
ON order_items(order_id);

-- Payments for order lookups
CREATE INDEX IF NOT EXISTS idx_payments_order 
ON payments(order_id);

-- Restaurants for search and filtering
CREATE INDEX IF NOT EXISTS idx_restaurants_active 
ON restaurants(is_active, is_open) 
WHERE is_active = true;

-- Add rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset 
ON rate_limits(reset_at);

-- Add system health monitoring table
CREATE TABLE IF NOT EXISTS system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL,
  database_healthy BOOLEAN,
  auth_healthy BOOLEAN,
  storage_healthy BOOLEAN,
  response_time_ms INTEGER,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_system_health_timestamp 
ON system_health(timestamp DESC);

-- Enable RLS on new tables
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for monitoring tables
CREATE POLICY "Admins can view rate limits"
ON rate_limits FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Admins can view system health"
ON system_health FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "System can insert health records"
ON system_health FOR INSERT
WITH CHECK (true);