-- Phase 5: Complete Remaining Features
-- Payment, Reviews, Restaurant Portal, Driver Verification, Analytics, Ride-Sharing, Hotels, Safety

-- ============================================
-- PAYMENT SYSTEM COMPLETION
-- ============================================

-- Invoices for orders
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  corporate_id UUID REFERENCES corporate_accounts(id) ON DELETE SET NULL,

  -- Line items stored as JSONB
  line_items JSONB NOT NULL DEFAULT '[]',

  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  service_fee DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,

  -- Tax breakdown
  tax_rate DECIMAL(5,4) DEFAULT 0.15, -- 15% VAT in SA
  tax_amount DECIMAL(10,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,

  -- Tax details
  tax_number TEXT, -- Customer's tax number if provided
  business_name TEXT,
  billing_address JSONB,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
  due_date DATE,
  paid_at TIMESTAMPTZ,

  -- Document
  pdf_url TEXT,
  pdf_storage_path TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax rates by category
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rate DECIMAL(5,4) NOT NULL,
  category TEXT NOT NULL, -- 'food', 'delivery', 'service', 'alcohol'
  region TEXT DEFAULT 'ZA',
  is_default BOOLEAN DEFAULT FALSE,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment reconciliation
CREATE TABLE IF NOT EXISTS payment_reconciliation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reconciliation_date DATE NOT NULL,
  payment_provider TEXT NOT NULL, -- 'payfast', 'stripe', 'wallet'

  -- Expected vs Actual
  expected_amount DECIMAL(14,2) NOT NULL,
  actual_amount DECIMAL(14,2) NOT NULL,
  discrepancy DECIMAL(14,2) GENERATED ALWAYS AS (actual_amount - expected_amount) STORED,

  -- Counts
  transaction_count INTEGER DEFAULT 0,
  matched_count INTEGER DEFAULT 0,
  unmatched_count INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'requires_review')),
  notes TEXT,
  reconciled_by UUID REFERENCES auth.users(id),
  reconciled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('customer', 'restaurant', 'driver')),

  -- Pricing
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  currency TEXT DEFAULT 'ZAR',

  -- Features
  features JSONB DEFAULT '[]',
  free_deliveries_per_month INTEGER DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  priority_support BOOLEAN DEFAULT FALSE,

  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE RESTRICT,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),

  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,

  -- Payment
  payment_method_id TEXT,
  last_payment_at TIMESTAMPTZ,
  next_payment_at TIMESTAMPTZ,

  -- Usage tracking
  free_deliveries_used INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REVIEWS SYSTEM ENHANCEMENT
-- ============================================

-- Review photos
CREATE TABLE IF NOT EXISTS review_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL, -- Will reference appropriate review table
  review_type TEXT NOT NULL CHECK (review_type IN ('restaurant', 'ride', 'hotel', 'venue')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  photo_url TEXT NOT NULL,
  storage_path TEXT,
  thumbnail_url TEXT,
  caption TEXT,

  -- Moderation
  is_approved BOOLEAN DEFAULT TRUE,
  flagged_at TIMESTAMPTZ,
  flagged_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review moderation queue
CREATE TABLE IF NOT EXISTS review_moderation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('restaurant', 'ride', 'hotel', 'venue')),

  -- Flags
  flag_type TEXT NOT NULL CHECK (flag_type IN ('spam', 'offensive', 'fake', 'irrelevant', 'competitor', 'other')),
  flagged_by UUID REFERENCES auth.users(id),
  flagged_at TIMESTAMPTZ DEFAULT NOW(),
  flag_reason TEXT,

  -- Resolution
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  -- Auto-moderation
  auto_flagged BOOLEAN DEFAULT FALSE,
  toxicity_score DECIMAL(3,2),
  spam_score DECIMAL(3,2)
);

-- Business responses to reviews
CREATE TABLE IF NOT EXISTS review_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('restaurant', 'ride', 'hotel', 'venue')),
  business_id UUID NOT NULL, -- Restaurant, hotel, or venue ID

  responder_id UUID REFERENCES auth.users(id),
  response_text TEXT NOT NULL CHECK (LENGTH(response_text) <= 1000),

  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review helpfulness votes
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('restaurant', 'ride', 'hotel', 'venue')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(review_id, review_type, user_id)
);

-- Verified purchase badges
CREATE TABLE IF NOT EXISTS verified_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('restaurant', 'ride', 'hotel', 'venue')),
  order_id UUID, -- The order that verifies this review
  booking_id UUID, -- For hotels/venues

  verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESTAURANT PORTAL ENHANCEMENTS
-- ============================================

-- Menu import jobs
CREATE TABLE IF NOT EXISTS menu_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),

  -- File info
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('csv', 'xlsx', 'json')),

  -- Progress
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  successful_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,

  -- Results
  errors JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory management
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  sku TEXT,
  unit TEXT DEFAULT 'each', -- 'each', 'kg', 'g', 'l', 'ml'

  -- Stock levels
  current_stock DECIMAL(10,2) DEFAULT 0,
  minimum_stock DECIMAL(10,2) DEFAULT 0,
  maximum_stock DECIMAL(10,2),
  reorder_point DECIMAL(10,2),

  -- Cost tracking
  unit_cost DECIMAL(10,2),
  last_cost DECIMAL(10,2),
  average_cost DECIMAL(10,2),

  -- Status
  is_tracked BOOLEAN DEFAULT TRUE,
  is_low_stock BOOLEAN GENERATED ALWAYS AS (current_stock <= minimum_stock) STORED,
  last_restocked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,

  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'waste', 'transfer')),
  quantity DECIMAL(10,2) NOT NULL, -- Positive for in, negative for out

  reference_type TEXT, -- 'order', 'purchase_order', 'manual'
  reference_id UUID,

  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),

  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order batching for kitchen efficiency
CREATE TABLE IF NOT EXISTS order_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,

  batch_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed')),

  order_count INTEGER DEFAULT 0,
  item_count INTEGER DEFAULT 0,

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  target_completion TIMESTAMPTZ
);

-- Link orders to batches
CREATE TABLE IF NOT EXISTS batch_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES order_batches(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sequence_number INTEGER,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_id, order_id)
);

-- Prep time predictions
CREATE TABLE IF NOT EXISTS prep_time_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  item_count INTEGER NOT NULL,
  predicted_minutes INTEGER,
  actual_minutes INTEGER,

  -- Context
  day_of_week INTEGER,
  hour_of_day INTEGER,
  concurrent_orders INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DRIVER/PARTNER VERIFICATION
-- ============================================

-- Verification requests
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('identity', 'background', 'vehicle', 'insurance', 'license')),

  -- Provider info
  provider TEXT, -- 'veriff', 'checkr', 'manual'
  provider_reference TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'expired')),

  -- Documents
  documents JSONB DEFAULT '[]', -- Array of document URLs

  -- Results
  result_data JSONB,
  rejection_reason TEXT,

  -- Timing
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Background check results
CREATE TABLE IF NOT EXISTS background_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_request_id UUID REFERENCES verification_requests(id),

  check_type TEXT NOT NULL CHECK (check_type IN ('criminal', 'driving', 'employment', 'education')),
  provider TEXT NOT NULL,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'clear', 'review', 'fail')),
  result_summary TEXT,
  full_report_url TEXT,

  checked_at TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle inspections
CREATE TABLE IF NOT EXISTS vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id UUID, -- Reference to driver's vehicle

  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('initial', 'annual', 'spot_check', 'post_accident')),

  -- Scheduling
  scheduled_date DATE,
  scheduled_time TIME,
  location TEXT,

  -- Results
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'passed', 'failed', 'cancelled', 'no_show')),
  inspector_name TEXT,

  -- Checklist results
  checklist_results JSONB DEFAULT '{}',
  overall_score INTEGER,
  pass_threshold INTEGER DEFAULT 80,

  photos JSONB DEFAULT '[]',
  notes TEXT,

  inspected_at TIMESTAMPTZ,
  next_inspection_due DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insurance verification
CREATE TABLE IF NOT EXISTS insurance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,

  insurance_type TEXT NOT NULL CHECK (insurance_type IN ('vehicle', 'liability', 'cargo', 'health')),
  provider_name TEXT NOT NULL,
  policy_number TEXT NOT NULL,

  -- Coverage
  coverage_amount DECIMAL(14,2),
  deductible DECIMAL(10,2),
  coverage_details JSONB,

  -- Validity
  effective_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,

  -- Documents
  document_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANALYTICS & REPORTING
-- ============================================

-- Pre-calculated daily metrics
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL,
  entity_type TEXT NOT NULL, -- 'platform', 'restaurant', 'driver', 'region'
  entity_id UUID, -- NULL for platform-wide

  -- Order metrics
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,

  -- Revenue
  gross_revenue DECIMAL(14,2) DEFAULT 0,
  net_revenue DECIMAL(14,2) DEFAULT 0,
  delivery_fees DECIMAL(12,2) DEFAULT 0,
  service_fees DECIMAL(12,2) DEFAULT 0,
  refunds DECIMAL(12,2) DEFAULT 0,

  -- Average metrics
  avg_order_value DECIMAL(10,2),
  avg_delivery_time INTEGER, -- minutes
  avg_prep_time INTEGER,

  -- Customer metrics
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,

  -- Ratings
  avg_rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(metric_date, entity_type, entity_id)
);

-- Scheduled reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,

  report_type TEXT NOT NULL CHECK (report_type IN ('sales', 'orders', 'customers', 'drivers', 'restaurants', 'custom')),

  -- Scheduling
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
  day_of_week INTEGER, -- 0-6 for weekly
  day_of_month INTEGER, -- 1-31 for monthly
  time_of_day TIME DEFAULT '08:00:00',
  timezone TEXT DEFAULT 'Africa/Johannesburg',

  -- Recipients
  recipients JSONB NOT NULL DEFAULT '[]', -- Array of email addresses

  -- Filters
  filters JSONB DEFAULT '{}',
  date_range TEXT DEFAULT 'last_period', -- 'last_period', 'last_7_days', 'last_30_days', 'custom'

  -- Format
  format TEXT DEFAULT 'pdf' CHECK (format IN ('pdf', 'csv', 'xlsx')),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_status TEXT,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report history
CREATE TABLE IF NOT EXISTS report_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scheduled_report_id UUID REFERENCES scheduled_reports(id) ON DELETE SET NULL,

  report_type TEXT NOT NULL,
  report_name TEXT NOT NULL,

  -- Generation info
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Parameters used
  parameters JSONB DEFAULT '{}',
  date_from DATE,
  date_to DATE,

  -- Results
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  file_url TEXT,
  file_size INTEGER,
  row_count INTEGER,

  error_message TEXT
);

-- A/B test experiments
CREATE TABLE IF NOT EXISTS ab_experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,

  -- Targeting
  target_audience TEXT DEFAULT 'all', -- 'all', 'new_users', 'returning', 'segment'
  target_percentage INTEGER DEFAULT 100, -- % of audience to include

  -- Variants
  variants JSONB NOT NULL DEFAULT '[{"name": "control", "weight": 50}, {"name": "variant_a", "weight": 50}]',

  -- Metrics
  primary_metric TEXT NOT NULL, -- 'conversion_rate', 'order_value', 'retention'
  secondary_metrics JSONB DEFAULT '[]',

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'archived')),

  -- Timing
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- Results
  winner_variant TEXT,
  statistical_significance DECIMAL(5,4),
  results_summary JSONB,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User experiment assignments
CREATE TABLE IF NOT EXISTS experiment_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  variant TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  -- Conversion tracking
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ,
  conversion_value DECIMAL(10,2),

  UNIQUE(experiment_id, user_id)
);

-- ============================================
-- RIDE-SHARING ENHANCEMENTS
-- ============================================

-- Ride pools
CREATE TABLE IF NOT EXISTS ride_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Route info
  origin_lat DECIMAL(10,8) NOT NULL,
  origin_lng DECIMAL(11,8) NOT NULL,
  destination_lat DECIMAL(10,8) NOT NULL,
  destination_lng DECIMAL(11,8) NOT NULL,

  -- Pool settings
  max_passengers INTEGER DEFAULT 4,
  current_passengers INTEGER DEFAULT 0,
  max_detour_minutes INTEGER DEFAULT 10,

  -- Pricing
  base_fare DECIMAL(10,2) NOT NULL,
  per_passenger_discount DECIMAL(5,2) DEFAULT 0.20, -- 20% off per additional passenger

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_progress', 'completed', 'cancelled')),

  -- Timing
  departure_window_start TIMESTAMPTZ NOT NULL,
  departure_window_end TIMESTAMPTZ NOT NULL,
  actual_departure TIMESTAMPTZ,

  driver_id UUID REFERENCES drivers(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pool participants
CREATE TABLE IF NOT EXISTS pool_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID REFERENCES ride_pools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,

  -- Pickup/dropoff
  pickup_lat DECIMAL(10,8) NOT NULL,
  pickup_lng DECIMAL(11,8) NOT NULL,
  dropoff_lat DECIMAL(10,8) NOT NULL,
  dropoff_lng DECIMAL(11,8) NOT NULL,
  pickup_address TEXT,
  dropoff_address TEXT,

  -- Sequence
  pickup_sequence INTEGER,
  dropoff_sequence INTEGER,

  -- Fare
  fare_amount DECIMAL(10,2),
  discount_applied DECIMAL(10,2),

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'picked_up', 'dropped_off', 'cancelled')),

  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled rides
CREATE TABLE IF NOT EXISTS scheduled_rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Trip details
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10,8) NOT NULL,
  pickup_lng DECIMAL(11,8) NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DECIMAL(10,8) NOT NULL,
  dropoff_lng DECIMAL(11,8) NOT NULL,

  -- Scheduling
  scheduled_time TIMESTAMPTZ NOT NULL,
  pickup_window_minutes INTEGER DEFAULT 15,

  -- Preferences
  vehicle_type TEXT DEFAULT 'standard',
  passenger_count INTEGER DEFAULT 1,
  women_only BOOLEAN DEFAULT FALSE,

  -- Estimated
  estimated_fare DECIMAL(10,2),
  estimated_duration INTEGER, -- minutes

  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'driver_assigned', 'in_progress', 'completed', 'cancelled')),

  -- Assignment
  driver_id UUID REFERENCES drivers(id),
  ride_id UUID REFERENCES rides(id),

  -- Reminders
  reminder_sent_24h BOOLEAN DEFAULT FALSE,
  reminder_sent_1h BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

-- Women-only ride preferences
CREATE TABLE IF NOT EXISTS safety_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  women_only_rides BOOLEAN DEFAULT FALSE,
  share_trip_auto BOOLEAN DEFAULT FALSE,
  emergency_contacts JSONB DEFAULT '[]',

  -- Verification
  gender_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HOTELS & VENUES ENHANCEMENTS
-- ============================================

-- Dynamic pricing rules
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('hotel', 'venue', 'restaurant')),
  entity_id UUID NOT NULL,

  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('time_based', 'demand_based', 'event_based', 'occupancy_based')),

  -- Conditions
  conditions JSONB NOT NULL, -- { "day_of_week": [5,6], "occupancy_above": 80, "event_type": "concert" }

  -- Adjustment
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('percentage', 'fixed')),
  adjustment_value DECIMAL(10,2) NOT NULL, -- Can be negative for discounts

  -- Limits
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),

  -- Validity
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from DATE,
  valid_to DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Package deals
CREATE TABLE IF NOT EXISTS package_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,

  -- Components
  components JSONB NOT NULL, -- [{ "type": "hotel", "id": "...", "nights": 2 }, { "type": "experience", "id": "..." }]

  -- Pricing
  individual_price DECIMAL(12,2) NOT NULL, -- Sum of components
  package_price DECIMAL(12,2) NOT NULL, -- Discounted price
  savings_amount DECIMAL(10,2) GENERATED ALWAYS AS (individual_price - package_price) STORED,

  -- Availability
  available_from DATE,
  available_to DATE,
  max_bookings INTEGER,
  current_bookings INTEGER DEFAULT 0,

  -- Images
  image_url TEXT,
  gallery JSONB DEFAULT '[]',

  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Virtual tours
CREATE TABLE IF NOT EXISTS virtual_tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('hotel', 'venue', 'restaurant')),
  entity_id UUID NOT NULL,

  tour_name TEXT NOT NULL,
  tour_type TEXT DEFAULT '360' CHECK (tour_type IN ('360', 'video', 'interactive')),

  -- Content
  tour_url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Hotspots for interactive tours
  hotspots JSONB DEFAULT '[]', -- [{ "position": {x,y,z}, "label": "Kitchen", "link": "..." }]

  -- Stats
  view_count INTEGER DEFAULT 0,
  avg_duration_seconds INTEGER,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital check-in
CREATE TABLE IF NOT EXISTS digital_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL, -- Hotel booking ID
  guest_id UUID REFERENCES auth.users(id),

  -- Pre-arrival info
  arrival_time TIMESTAMPTZ,
  special_requests TEXT,

  -- Documents
  id_document_url TEXT,
  id_verified BOOLEAN DEFAULT FALSE,

  -- Check-in status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'checked_in', 'checked_out')),

  -- Room assignment
  room_number TEXT,
  room_key_type TEXT CHECK (room_key_type IN ('physical', 'mobile', 'qr')),
  mobile_key_token TEXT,
  qr_code_url TEXT,

  -- Timing
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SAFETY & TRUST
-- ============================================

-- Food safety ratings
CREATE TABLE IF NOT EXISTS food_safety_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,

  -- Rating
  rating TEXT NOT NULL CHECK (rating IN ('A', 'B', 'C', 'D', 'F', 'pending')),
  score INTEGER CHECK (score BETWEEN 0 AND 100),

  -- Inspection details
  inspection_date DATE NOT NULL,
  inspector_name TEXT,
  inspection_type TEXT DEFAULT 'routine' CHECK (inspection_type IN ('routine', 'follow_up', 'complaint', 'pre_opening')),

  -- Violations
  critical_violations INTEGER DEFAULT 0,
  major_violations INTEGER DEFAULT 0,
  minor_violations INTEGER DEFAULT 0,
  violations_details JSONB DEFAULT '[]',

  -- Status
  is_current BOOLEAN DEFAULT TRUE,
  report_url TEXT,

  next_inspection_due DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allergen information
CREATE TABLE IF NOT EXISTS menu_item_allergens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,

  allergen_type TEXT NOT NULL CHECK (allergen_type IN (
    'gluten', 'dairy', 'eggs', 'nuts', 'peanuts', 'soy', 'fish',
    'shellfish', 'sesame', 'mustard', 'celery', 'lupin', 'molluscs', 'sulphites'
  )),

  severity TEXT DEFAULT 'contains' CHECK (severity IN ('contains', 'may_contain', 'trace')),
  notes TEXT,

  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(menu_item_id, allergen_type)
);

-- Carbon footprint tracking
CREATE TABLE IF NOT EXISTS carbon_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,

  -- Distance
  distance_km DECIMAL(10,2) NOT NULL,

  -- Vehicle type factor
  vehicle_type TEXT,
  emission_factor DECIMAL(6,4), -- kg CO2 per km

  -- Calculated emissions
  carbon_kg DECIMAL(8,4) NOT NULL,

  -- Offset status
  offset_purchased BOOLEAN DEFAULT FALSE,
  offset_amount DECIMAL(10,2),
  offset_provider TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User carbon footprint summary
CREATE TABLE IF NOT EXISTS user_carbon_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  year INTEGER NOT NULL,
  month INTEGER NOT NULL,

  total_orders INTEGER DEFAULT 0,
  total_rides INTEGER DEFAULT 0,
  total_distance_km DECIMAL(12,2) DEFAULT 0,
  total_carbon_kg DECIMAL(10,4) DEFAULT 0,
  carbon_offset_kg DECIMAL(10,4) DEFAULT 0,

  -- Comparisons
  vs_average_percentage DECIMAL(5,2), -- Compared to platform average

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, year, month)
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_carbon_summary ENABLE ROW LEVEL SECURITY;

-- Invoice policies
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT
  USING (auth.uid() = customer_id);

-- Subscription policies
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscriptions" ON user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Review photo policies
CREATE POLICY "Anyone can view approved review photos" ON review_photos FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Users can upload own review photos" ON review_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Review vote policies
CREATE POLICY "Anyone can view review votes" ON review_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote on reviews" ON review_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Inventory policies (restaurant owners)
CREATE POLICY "Restaurant owners can manage inventory" ON inventory_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE id = restaurant_id AND owner_id = auth.uid()
    )
  );

-- Verification request policies
CREATE POLICY "Users can view own verification requests" ON verification_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit verification requests" ON verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Scheduled ride policies
CREATE POLICY "Users can view own scheduled rides" ON scheduled_rides FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create scheduled rides" ON scheduled_rides FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own scheduled rides" ON scheduled_rides FOR UPDATE
  USING (auth.uid() = user_id);

-- Safety preferences policies
CREATE POLICY "Users can manage own safety preferences" ON safety_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Digital check-in policies
CREATE POLICY "Guests can view own check-ins" ON digital_checkins FOR SELECT
  USING (auth.uid() = guest_id);

CREATE POLICY "Guests can submit check-in" ON digital_checkins FOR INSERT
  WITH CHECK (auth.uid() = guest_id);

-- Carbon summary policies
CREATE POLICY "Users can view own carbon summary" ON user_carbon_summary FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_photos_review ON review_photos(review_id, review_type);
CREATE INDEX IF NOT EXISTS idx_review_moderation_status ON review_moderation(status);
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id, review_type);
CREATE INDEX IF NOT EXISTS idx_inventory_items_restaurant ON inventory_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory_items(restaurant_id) WHERE is_low_stock = true;
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(inventory_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(metric_date, entity_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_experiment ON experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ride_pools_status ON ride_pools(status, departure_window_start);
CREATE INDEX IF NOT EXISTS idx_scheduled_rides_user ON scheduled_rides(user_id, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_rides_status ON scheduled_rides(status, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_food_safety_restaurant ON food_safety_ratings(restaurant_id) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_menu_item_allergens_item ON menu_item_allergens(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_carbon_tracking_order ON carbon_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_user_carbon_summary_user ON user_carbon_summary(user_id, year, month);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 'INV-' || v_year || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || v_year || '-%';

  RETURN 'INV-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');
END;
$$;

-- Calculate prep time prediction
CREATE OR REPLACE FUNCTION predict_prep_time(
  p_restaurant_id UUID,
  p_item_count INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_avg_time INTEGER;
  v_current_orders INTEGER;
  v_base_time INTEGER;
BEGIN
  -- Get historical average for similar item counts
  SELECT AVG(actual_minutes)::INTEGER INTO v_avg_time
  FROM prep_time_history
  WHERE restaurant_id = p_restaurant_id
  AND item_count BETWEEN p_item_count - 2 AND p_item_count + 2
  AND actual_minutes IS NOT NULL
  AND created_at > NOW() - INTERVAL '30 days';

  -- Count current active orders
  SELECT COUNT(*) INTO v_current_orders
  FROM orders
  WHERE restaurant_id = p_restaurant_id
  AND status IN ('pending', 'confirmed', 'preparing');

  -- Base calculation
  v_base_time := COALESCE(v_avg_time, 15 + (p_item_count * 3));

  -- Adjust for current load
  RETURN v_base_time + (v_current_orders * 2);
END;
$$;

-- Update daily metrics (to be called by cron job)
CREATE OR REPLACE FUNCTION update_daily_metrics(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Platform-wide metrics
  INSERT INTO daily_metrics (
    metric_date, entity_type, entity_id,
    total_orders, completed_orders, cancelled_orders,
    gross_revenue, net_revenue, delivery_fees, service_fees, refunds,
    avg_order_value, new_customers, returning_customers
  )
  SELECT
    p_date,
    'platform',
    NULL,
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'delivered'),
    COUNT(*) FILTER (WHERE status = 'cancelled'),
    SUM(total),
    SUM(total) - COALESCE(SUM(r.amount), 0),
    SUM(delivery_fee),
    SUM(service_fee),
    COALESCE(SUM(r.amount), 0),
    AVG(total),
    COUNT(DISTINCT customer_id) FILTER (WHERE is_first_order = true),
    COUNT(DISTINCT customer_id) FILTER (WHERE is_first_order = false)
  FROM orders o
  LEFT JOIN refunds r ON o.id = r.order_id AND r.status = 'completed'
  LEFT JOIN LATERAL (
    SELECT customer_id, MIN(created_at) = o.created_at as is_first_order
    FROM orders WHERE customer_id = o.customer_id
    GROUP BY customer_id
  ) fo ON true
  WHERE DATE(o.created_at) = p_date
  ON CONFLICT (metric_date, entity_type, entity_id)
  DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    completed_orders = EXCLUDED.completed_orders,
    gross_revenue = EXCLUDED.gross_revenue;
END;
$$;

-- Insert default tax rates for South Africa
INSERT INTO tax_rates (name, rate, category, region, is_default, effective_from) VALUES
('Standard VAT', 0.15, 'food', 'ZA', true, '2018-04-01'),
('Standard VAT', 0.15, 'delivery', 'ZA', true, '2018-04-01'),
('Standard VAT', 0.15, 'service', 'ZA', true, '2018-04-01'),
('Alcohol VAT', 0.15, 'alcohol', 'ZA', true, '2018-04-01')
ON CONFLICT DO NOTHING;

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, plan_type, price_monthly, price_yearly, features, free_deliveries_per_month, discount_percentage, priority_support) VALUES
('EatLocal Plus', 'Free delivery on all orders over R100', 'customer', 49.99, 449.99, '["Free delivery on orders R100+", "5% discount on all orders", "Early access to deals", "Priority customer support"]', 0, 5.00, true),
('EatLocal Premium', 'Unlimited free delivery + exclusive perks', 'customer', 99.99, 899.99, '["Unlimited free delivery", "10% discount on all orders", "Exclusive restaurant deals", "VIP customer support", "Birthday rewards"]', 999, 10.00, true),
('Restaurant Pro', 'Advanced tools for restaurants', 'restaurant', 299.99, 2699.99, '["Advanced analytics", "Menu import/export", "Inventory management", "Order batching", "Dedicated support"]', 0, 0, true)
ON CONFLICT DO NOTHING;

GRANT EXECUTE ON FUNCTION generate_invoice_number TO authenticated;
GRANT EXECUTE ON FUNCTION predict_prep_time TO authenticated;
