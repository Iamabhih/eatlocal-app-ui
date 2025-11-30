-- SuperAdmin Platform Configuration Tables
-- Comprehensive backend control for all platform settings

-- =============================================================================
-- API KEYS & THIRD-PARTY INTEGRATIONS
-- =============================================================================

-- Store encrypted API keys and secrets for third-party services
CREATE TABLE IF NOT EXISTS api_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL UNIQUE,
  service_category TEXT NOT NULL, -- 'payment', 'sms', 'maps', 'email', 'analytics', 'storage', 'ai'
  display_name TEXT NOT NULL,
  description TEXT,
  api_key TEXT, -- Encrypted in production
  api_secret TEXT, -- Encrypted in production
  webhook_url TEXT,
  webhook_secret TEXT,
  environment TEXT NOT NULL DEFAULT 'sandbox', -- 'sandbox', 'production'
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  config_json JSONB DEFAULT '{}', -- Additional service-specific configuration
  last_tested_at TIMESTAMPTZ,
  test_status TEXT, -- 'success', 'failed', 'pending'
  test_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configuration change audit log
CREATE TABLE IF NOT EXISTS config_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  changed_by UUID REFERENCES auth.users(id),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PLATFORM FEES & COMMISSION STRUCTURE
-- =============================================================================

-- Commission and fee structure for different entities
CREATE TABLE IF NOT EXISTS commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'restaurant', 'driver', 'hotel', 'venue'
  tier_name TEXT NOT NULL, -- 'standard', 'premium', 'enterprise'
  commission_percentage DECIMAL(5,2) NOT NULL,
  min_commission DECIMAL(10,2),
  max_commission DECIMAL(10,2),
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_type, tier_name, effective_from)
);

-- Platform fees configuration
CREATE TABLE IF NOT EXISTS platform_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_name TEXT NOT NULL UNIQUE,
  fee_type TEXT NOT NULL, -- 'percentage', 'fixed', 'tiered'
  fee_category TEXT NOT NULL, -- 'delivery', 'service', 'payment', 'subscription', 'cancellation'
  base_amount DECIMAL(10,2),
  percentage DECIMAL(5,2),
  min_amount DECIMAL(10,2),
  max_amount DECIMAL(10,2),
  tier_config JSONB, -- For tiered pricing
  applies_to TEXT[], -- ['food_orders', 'rides', 'hotels', 'venues']
  is_taxable BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dynamic surge pricing configuration
CREATE TABLE IF NOT EXISTS surge_pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL, -- 'delivery', 'ride'
  trigger_type TEXT NOT NULL, -- 'demand', 'weather', 'event', 'time'
  trigger_conditions JSONB NOT NULL,
  multiplier_min DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  multiplier_max DECIMAL(3,2) NOT NULL DEFAULT 3.0,
  increment_step DECIMAL(3,2) NOT NULL DEFAULT 0.1,
  cooldown_minutes INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- FEATURE FLAGS & SYSTEM SETTINGS
-- =============================================================================

-- Feature flags for gradual rollouts
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT NOT NULL UNIQUE,
  flag_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER NOT NULL DEFAULT 0, -- 0-100
  target_users TEXT[], -- Specific user IDs
  target_regions TEXT[], -- Specific regions/cities
  target_user_types TEXT[], -- 'customer', 'driver', 'restaurant', 'admin'
  config_json JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System-wide settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL, -- 'string', 'number', 'boolean', 'json'
  category TEXT NOT NULL, -- 'general', 'security', 'notifications', 'limits', 'appearance'
  display_name TEXT NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN NOT NULL DEFAULT false, -- Hide value in UI
  validation_rules JSONB, -- Min/max, regex, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- APPROVAL WORKFLOWS
-- =============================================================================

-- Approval workflow configuration
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type TEXT NOT NULL UNIQUE, -- 'driver_registration', 'restaurant_registration', 'payout', 'refund', 'menu_change'
  workflow_name TEXT NOT NULL,
  description TEXT,
  required_approvals INTEGER NOT NULL DEFAULT 1,
  auto_approve_threshold DECIMAL(10,2), -- Auto-approve below this amount
  auto_reject_conditions JSONB,
  escalation_hours INTEGER, -- Hours before escalation
  escalation_to TEXT[], -- Role IDs to escalate to
  notification_config JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pending approvals queue
CREATE TABLE IF NOT EXISTS approval_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  requester_id UUID REFERENCES auth.users(id),
  request_data JSONB NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5, -- 1=highest, 10=lowest
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'escalated', 'expired'
  assigned_to UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- VERIFICATION THRESHOLDS & RULES
-- =============================================================================

-- Verification requirements configuration
CREATE TABLE IF NOT EXISTS verification_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'driver', 'restaurant', 'hotel', 'venue'
  requirement_type TEXT NOT NULL, -- 'identity', 'background_check', 'license', 'insurance', 'health_permit'
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  expiry_days INTEGER, -- Days until re-verification needed
  verification_provider TEXT, -- Third-party provider
  auto_approve_score INTEGER, -- Auto-approve above this score
  manual_review_score INTEGER, -- Manual review between this and auto_approve
  rejection_score INTEGER, -- Auto-reject below this
  cost DECIMAL(10,2), -- Cost to platform per verification
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_type, requirement_type)
);

-- =============================================================================
-- OPERATIONAL LIMITS & THRESHOLDS
-- =============================================================================

-- Rate limits and operational thresholds
CREATE TABLE IF NOT EXISTS operational_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  limit_name TEXT NOT NULL UNIQUE,
  limit_type TEXT NOT NULL, -- 'rate', 'quantity', 'amount', 'distance', 'time'
  limit_category TEXT NOT NULL, -- 'orders', 'payouts', 'refunds', 'api', 'user'
  limit_value DECIMAL(15,2) NOT NULL,
  time_window_minutes INTEGER, -- For rate limits
  applies_to TEXT[], -- User types or entities
  action_on_exceed TEXT NOT NULL DEFAULT 'block', -- 'block', 'warn', 'queue', 'throttle'
  notification_threshold DECIMAL(5,2), -- Alert at X% of limit
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- NOTIFICATION TEMPLATES & CONFIG
-- =============================================================================

-- Notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  channel TEXT NOT NULL, -- 'email', 'sms', 'push', 'in_app'
  subject TEXT,
  body_template TEXT NOT NULL,
  variables TEXT[], -- Available template variables
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification preferences by event type
CREATE TABLE IF NOT EXISTS notification_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL UNIQUE, -- 'order_placed', 'order_delivered', 'payout_processed', etc.
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  email_template_id UUID REFERENCES notification_templates(id),
  sms_template_id UUID REFERENCES notification_templates(id),
  push_template_id UUID REFERENCES notification_templates(id),
  delay_seconds INTEGER DEFAULT 0,
  batch_window_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- REGIONS & SERVICE AREAS
-- =============================================================================

-- Service regions configuration
CREATE TABLE IF NOT EXISTS service_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name TEXT NOT NULL,
  region_code TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL DEFAULT 'ZA',
  timezone TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
  currency_code TEXT NOT NULL DEFAULT 'ZAR',
  center_lat DECIMAL(10,7),
  center_lng DECIMAL(10,7),
  boundary_polygon JSONB, -- GeoJSON polygon
  services_available TEXT[] NOT NULL DEFAULT ARRAY['food_delivery'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  launch_date DATE,
  operating_hours JSONB, -- Day-by-day operating hours
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SUPPORT & HELP CONFIGURATION
-- =============================================================================

-- Support categories and routing
CREATE TABLE IF NOT EXISTS support_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  category_key TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES support_categories(id),
  priority INTEGER NOT NULL DEFAULT 5,
  auto_response TEXT,
  routing_team TEXT,
  sla_hours INTEGER NOT NULL DEFAULT 24,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FAQ/Help articles
CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES support_categories(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  target_audience TEXT[] NOT NULL DEFAULT ARRAY['customer'],
  search_keywords TEXT[],
  view_count INTEGER NOT NULL DEFAULT 0,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ANALYTICS DASHBOARDS CONFIGURATION
-- =============================================================================

-- Custom dashboard configurations
CREATE TABLE IF NOT EXISTS admin_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_name TEXT NOT NULL,
  dashboard_key TEXT NOT NULL UNIQUE,
  description TEXT,
  layout_config JSONB NOT NULL,
  widgets JSONB NOT NULL, -- Array of widget configurations
  access_roles TEXT[] NOT NULL DEFAULT ARRAY['super_admin'],
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PAYOUT CONFIGURATION
-- =============================================================================

-- Payout schedules and rules
CREATE TABLE IF NOT EXISTS payout_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'driver', 'restaurant', 'venue', 'hotel'
  payout_frequency TEXT NOT NULL DEFAULT 'weekly', -- 'daily', 'weekly', 'biweekly', 'monthly'
  payout_day INTEGER, -- Day of week (0-6) or month (1-31)
  min_payout_amount DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  max_payout_amount DECIMAL(10,2),
  hold_period_days INTEGER NOT NULL DEFAULT 7, -- Days to hold funds before payout
  auto_payout_enabled BOOLEAN NOT NULL DEFAULT true,
  payout_methods TEXT[] NOT NULL DEFAULT ARRAY['bank_transfer'],
  transaction_fee DECIMAL(10,2) DEFAULT 0,
  transaction_fee_percentage DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_type)
);

-- =============================================================================
-- SEED DEFAULT CONFIGURATIONS
-- =============================================================================

-- Default API configurations (keys should be added via SuperAdmin)
INSERT INTO api_configurations (service_name, service_category, display_name, description, environment) VALUES
  ('payfast', 'payment', 'PayFast', 'South African payment gateway', 'sandbox'),
  ('twilio', 'sms', 'Twilio', 'SMS and voice communication', 'sandbox'),
  ('google_maps', 'maps', 'Google Maps', 'Maps, geocoding, and directions', 'sandbox'),
  ('sendgrid', 'email', 'SendGrid', 'Transactional email service', 'sandbox'),
  ('sentry', 'analytics', 'Sentry', 'Error tracking and monitoring', 'sandbox'),
  ('supabase_storage', 'storage', 'Supabase Storage', 'File and image storage', 'production'),
  ('openai', 'ai', 'OpenAI', 'AI recommendations and chatbot', 'sandbox'),
  ('firebase_fcm', 'notifications', 'Firebase FCM', 'Push notifications', 'sandbox'),
  ('yoco', 'payment', 'Yoco', 'Alternative payment provider', 'sandbox'),
  ('whatsapp_business', 'sms', 'WhatsApp Business', 'WhatsApp messaging', 'sandbox')
ON CONFLICT (service_name) DO NOTHING;

-- Default commission rates
INSERT INTO commission_rates (entity_type, tier_name, commission_percentage, effective_from) VALUES
  ('restaurant', 'standard', 15.00, CURRENT_DATE),
  ('restaurant', 'premium', 12.00, CURRENT_DATE),
  ('restaurant', 'enterprise', 10.00, CURRENT_DATE),
  ('driver', 'standard', 20.00, CURRENT_DATE),
  ('driver', 'premium', 18.00, CURRENT_DATE),
  ('hotel', 'standard', 12.00, CURRENT_DATE),
  ('venue', 'standard', 10.00, CURRENT_DATE)
ON CONFLICT (entity_type, tier_name, effective_from) DO NOTHING;

-- Default platform fees
INSERT INTO platform_fees (fee_name, fee_type, fee_category, base_amount, percentage, applies_to, description, effective_from) VALUES
  ('delivery_fee_base', 'fixed', 'delivery', 15.00, NULL, ARRAY['food_orders'], 'Base delivery fee', CURRENT_DATE),
  ('delivery_fee_per_km', 'fixed', 'delivery', 5.00, NULL, ARRAY['food_orders'], 'Per kilometer delivery charge', CURRENT_DATE),
  ('service_fee', 'percentage', 'service', NULL, 5.00, ARRAY['food_orders', 'rides'], 'Platform service fee', CURRENT_DATE),
  ('payment_processing', 'percentage', 'payment', NULL, 2.50, ARRAY['food_orders', 'rides', 'hotels', 'venues'], 'Payment gateway fees', CURRENT_DATE),
  ('cancellation_fee', 'percentage', 'cancellation', 25.00, NULL, ARRAY['food_orders'], 'Order cancellation fee (after prep)', CURRENT_DATE),
  ('small_order_fee', 'fixed', 'service', 10.00, NULL, ARRAY['food_orders'], 'Fee for orders under minimum', CURRENT_DATE)
ON CONFLICT (fee_name) DO NOTHING;

-- Default feature flags
INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled, rollout_percentage) VALUES
  ('ai_recommendations', 'AI-Powered Recommendations', 'Enable AI-based food recommendations', true, 100),
  ('group_ordering', 'Group Ordering', 'Allow multiple users to order together', true, 100),
  ('scheduled_orders', 'Scheduled Orders', 'Allow scheduling orders in advance', true, 100),
  ('ride_pooling', 'Ride Pooling', 'Enable shared ride option', true, 50),
  ('women_only_rides', 'Women-Only Rides', 'Safety feature for women passengers', true, 100),
  ('carbon_tracking', 'Carbon Footprint Tracking', 'Track and offset carbon emissions', true, 100),
  ('loyalty_program', 'Loyalty & Rewards', 'Points-based loyalty system', true, 100),
  ('food_stories', 'Food Stories', 'Social media style food content', true, 75),
  ('virtual_tours', 'Virtual Tours', '360-degree venue tours', true, 100),
  ('digital_checkin', 'Digital Check-in', 'Mobile check-in for hotels', true, 100),
  ('chatbot', 'AI Chatbot Support', 'Automated customer support', false, 0),
  ('surge_pricing', 'Dynamic Surge Pricing', 'Demand-based price adjustments', true, 100)
ON CONFLICT (flag_key) DO NOTHING;

-- Default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, display_name, description) VALUES
  ('platform_name', 'EatLocal', 'string', 'general', 'Platform Name', 'Display name of the platform'),
  ('support_email', 'support@eatlocal.co.za', 'string', 'general', 'Support Email', 'Customer support email'),
  ('support_phone', '+27 10 123 4567', 'string', 'general', 'Support Phone', 'Customer support phone number'),
  ('min_order_amount', '50', 'number', 'limits', 'Minimum Order Amount', 'Minimum order value in ZAR'),
  ('max_delivery_distance', '25', 'number', 'limits', 'Max Delivery Distance', 'Maximum delivery distance in km'),
  ('order_timeout_minutes', '45', 'number', 'limits', 'Order Timeout', 'Minutes before unaccepted orders timeout'),
  ('driver_search_radius', '5', 'number', 'limits', 'Driver Search Radius', 'Initial search radius for drivers in km'),
  ('max_concurrent_orders', '3', 'number', 'limits', 'Max Concurrent Orders', 'Maximum orders a driver can have'),
  ('refund_window_hours', '24', 'number', 'limits', 'Refund Window', 'Hours after delivery to request refund'),
  ('session_timeout_minutes', '60', 'number', 'security', 'Session Timeout', 'Admin session timeout in minutes'),
  ('require_2fa_admin', 'true', 'boolean', 'security', 'Require 2FA for Admin', 'Two-factor auth for admin users'),
  ('maintenance_mode', 'false', 'boolean', 'general', 'Maintenance Mode', 'Put platform in maintenance mode'),
  ('new_user_promo_amount', '50', 'number', 'general', 'New User Promo', 'Welcome discount for new users')
ON CONFLICT (setting_key) DO NOTHING;

-- Default approval workflows
INSERT INTO approval_workflows (workflow_type, workflow_name, description, required_approvals, auto_approve_threshold, escalation_hours) VALUES
  ('driver_registration', 'Driver Registration', 'New driver onboarding approval', 1, NULL, 48),
  ('restaurant_registration', 'Restaurant Registration', 'New restaurant partner approval', 1, NULL, 72),
  ('payout_request', 'Payout Request', 'Manual payout approval', 1, 10000.00, 24),
  ('refund_request', 'Refund Request', 'Customer refund approval', 1, 500.00, 12),
  ('menu_update', 'Menu Update', 'Menu changes requiring review', 1, NULL, 24),
  ('promotion_creation', 'Promotion Creation', 'New promotions approval', 1, NULL, 24)
ON CONFLICT (workflow_type) DO NOTHING;

-- Default verification requirements
INSERT INTO verification_requirements (entity_type, requirement_type, is_mandatory, expiry_days, auto_approve_score, manual_review_score) VALUES
  ('driver', 'identity', true, NULL, 90, 70),
  ('driver', 'background_check', true, 365, 85, 60),
  ('driver', 'license', true, NULL, 95, 80),
  ('driver', 'vehicle_inspection', true, 180, 90, 75),
  ('driver', 'insurance', true, 365, NULL, NULL),
  ('restaurant', 'health_permit', true, 365, NULL, NULL),
  ('restaurant', 'business_license', true, NULL, NULL, NULL),
  ('restaurant', 'food_safety', true, 365, NULL, NULL)
ON CONFLICT (entity_type, requirement_type) DO NOTHING;

-- Default operational limits
INSERT INTO operational_limits (limit_name, limit_type, limit_category, limit_value, time_window_minutes, action_on_exceed) VALUES
  ('max_daily_orders_per_user', 'quantity', 'orders', 20, 1440, 'warn'),
  ('max_order_amount', 'amount', 'orders', 10000, NULL, 'block'),
  ('max_daily_payout', 'amount', 'payouts', 100000, 1440, 'queue'),
  ('max_refund_per_order', 'amount', 'refunds', 5000, NULL, 'queue'),
  ('api_rate_limit', 'rate', 'api', 100, 1, 'throttle'),
  ('max_promo_usage_per_user', 'quantity', 'user', 5, 43200, 'block')
ON CONFLICT (limit_name) DO NOTHING;

-- Default payout configurations
INSERT INTO payout_config (entity_type, payout_frequency, payout_day, min_payout_amount, hold_period_days) VALUES
  ('driver', 'weekly', 1, 100.00, 7),
  ('restaurant', 'weekly', 2, 500.00, 7),
  ('hotel', 'biweekly', 15, 1000.00, 14),
  ('venue', 'monthly', 1, 500.00, 14)
ON CONFLICT (entity_type) DO NOTHING;

-- Default service regions
INSERT INTO service_regions (region_name, region_code, center_lat, center_lng, services_available, is_active) VALUES
  ('Johannesburg', 'JHB', -26.2041, 28.0473, ARRAY['food_delivery', 'rides', 'hotels', 'venues'], true),
  ('Cape Town', 'CPT', -33.9249, 18.4241, ARRAY['food_delivery', 'rides', 'hotels', 'venues'], true),
  ('Durban', 'DUR', -29.8587, 31.0218, ARRAY['food_delivery', 'rides', 'hotels'], true),
  ('Pretoria', 'PTA', -25.7479, 28.2293, ARRAY['food_delivery', 'rides'], true)
ON CONFLICT (region_code) DO NOTHING;

-- Default support categories
INSERT INTO support_categories (category_key, category_name, priority, sla_hours, sort_order) VALUES
  ('order_issues', 'Order Issues', 2, 4, 1),
  ('payment_billing', 'Payment & Billing', 2, 12, 2),
  ('delivery_problems', 'Delivery Problems', 1, 2, 3),
  ('account_access', 'Account & Access', 3, 24, 4),
  ('driver_support', 'Driver Support', 2, 12, 5),
  ('restaurant_support', 'Restaurant Support', 2, 24, 6),
  ('technical_issues', 'Technical Issues', 3, 48, 7),
  ('feedback_suggestions', 'Feedback & Suggestions', 5, 72, 8)
ON CONFLICT (category_key) DO NOTHING;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE surge_pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_config ENABLE ROW LEVEL SECURITY;

-- Super admin policies (only super_admin role can access)
CREATE POLICY "Super admin full access to api_configurations"
  ON api_configurations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Super admin full access to config_audit_log"
  ON config_audit_log FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Super admin full access to commission_rates"
  ON commission_rates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Super admin full access to platform_fees"
  ON platform_fees FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Super admin full access to surge_pricing_config"
  ON surge_pricing_config FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Super admin full access to feature_flags"
  ON feature_flags FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- Feature flags can be read by system for feature checks
CREATE POLICY "Public read for feature flags"
  ON feature_flags FOR SELECT
  USING (is_enabled = true);

CREATE POLICY "Super admin full access to system_settings"
  ON system_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- Non-sensitive settings can be read
CREATE POLICY "Public read for non-sensitive settings"
  ON system_settings FOR SELECT
  USING (is_sensitive = false);

CREATE POLICY "Super admin full access to approval_workflows"
  ON approval_workflows FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Admin access to approval_queue"
  ON approval_queue FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Super admin full access to verification_requirements"
  ON verification_requirements FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Super admin full access to operational_limits"
  ON operational_limits FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Super admin full access to notification_templates"
  ON notification_templates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Super admin full access to notification_config"
  ON notification_config FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Public read for service_regions"
  ON service_regions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admin full access to service_regions"
  ON service_regions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Public read for support_categories"
  ON support_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admin full access to support_categories"
  ON support_categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Public read for published help_articles"
  ON help_articles FOR SELECT
  USING (is_published = true);

CREATE POLICY "Super admin full access to help_articles"
  ON help_articles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Super admin full access to admin_dashboards"
  ON admin_dashboards FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Super admin full access to payout_config"
  ON payout_config FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- =============================================================================
-- TRIGGERS FOR AUDIT LOGGING
-- =============================================================================

CREATE OR REPLACE FUNCTION log_config_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO config_audit_log (table_name, record_id, action, changed_by, old_values)
    VALUES (TG_TABLE_NAME, OLD.id, 'delete', auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO config_audit_log (table_name, record_id, action, changed_by, old_values, new_values)
    VALUES (TG_TABLE_NAME, NEW.id, 'update', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO config_audit_log (table_name, record_id, action, changed_by, new_values)
    VALUES (TG_TABLE_NAME, NEW.id, 'create', auth.uid(), to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_api_configurations
  AFTER INSERT OR UPDATE OR DELETE ON api_configurations
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

CREATE TRIGGER audit_commission_rates
  AFTER INSERT OR UPDATE OR DELETE ON commission_rates
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

CREATE TRIGGER audit_platform_fees
  AFTER INSERT OR UPDATE OR DELETE ON platform_fees
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

CREATE TRIGGER audit_feature_flags
  AFTER INSERT OR UPDATE OR DELETE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

CREATE TRIGGER audit_system_settings
  AFTER INSERT OR UPDATE OR DELETE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_configurations_updated_at
  BEFORE UPDATE ON api_configurations
  FOR EACH ROW EXECUTE FUNCTION update_config_updated_at();

CREATE TRIGGER update_commission_rates_updated_at
  BEFORE UPDATE ON commission_rates
  FOR EACH ROW EXECUTE FUNCTION update_config_updated_at();

CREATE TRIGGER update_platform_fees_updated_at
  BEFORE UPDATE ON platform_fees
  FOR EACH ROW EXECUTE FUNCTION update_config_updated_at();

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_config_updated_at();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_config_updated_at();

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_api_configurations_service ON api_configurations(service_name, is_enabled);
CREATE INDEX IF NOT EXISTS idx_config_audit_log_table ON config_audit_log(table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commission_rates_entity ON commission_rates(entity_type, is_active);
CREATE INDEX IF NOT EXISTS idx_platform_fees_active ON platform_fees(is_active, fee_category);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key, is_enabled);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_approval_queue_status ON approval_queue(status, workflow_type);
CREATE INDEX IF NOT EXISTS idx_service_regions_active ON service_regions(is_active);
