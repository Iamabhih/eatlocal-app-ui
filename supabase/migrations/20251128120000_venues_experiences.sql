-- Migration: Venues, Experiences & Activities Booking System
-- Created: 2025-11-28

-- ============================================================================
-- VENUES TABLE - Places that host experiences/events
-- ============================================================================

CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  short_description TEXT,

  -- Location
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'South Africa',
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  area_name TEXT, -- e.g., "Sandton", "V&A Waterfront"

  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',

  -- Category
  venue_type TEXT NOT NULL CHECK (venue_type IN (
    'restaurant', 'bar', 'club', 'cafe', 'brewery', 'winery',
    'museum', 'gallery', 'theater', 'cinema',
    'park', 'beach', 'nature_reserve', 'hiking_trail',
    'spa', 'gym', 'sports_facility', 'adventure_park',
    'tour_operator', 'event_space', 'conference_center',
    'market', 'shopping', 'entertainment', 'other'
  )),
  categories TEXT[] DEFAULT '{}', -- Multiple categories like ["outdoor", "family-friendly"]

  -- Media
  main_image TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  video_url TEXT,

  -- Features
  amenities TEXT[] DEFAULT '{}',
  accessibility_features TEXT[] DEFAULT '{}',

  -- Operating Info
  operating_hours JSONB DEFAULT '{}', -- { "monday": { "open": "09:00", "close": "17:00" }, ... }
  is_24_hours BOOLEAN DEFAULT false,

  -- Pricing
  price_level INTEGER CHECK (price_level >= 1 AND price_level <= 4), -- $ to $$$$
  currency TEXT DEFAULT 'ZAR',

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),

  -- Stats
  rating DECIMAL(2, 1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EXPERIENCES TABLE - Activities/tours/events offered at venues
-- ============================================================================

CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be independent host

  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  short_description TEXT,
  highlights TEXT[] DEFAULT '{}', -- Key selling points

  -- Type
  experience_type TEXT NOT NULL CHECK (experience_type IN (
    'tour', 'activity', 'class', 'workshop', 'tasting',
    'adventure', 'wellness', 'sports', 'entertainment',
    'food_experience', 'cultural', 'nature', 'nightlife',
    'event', 'private_event', 'other'
  )),
  categories TEXT[] DEFAULT '{}',

  -- Duration
  duration_minutes INTEGER NOT NULL,

  -- Capacity
  min_participants INTEGER DEFAULT 1,
  max_participants INTEGER,
  is_private_available BOOLEAN DEFAULT false,
  private_price_multiplier DECIMAL(3, 2) DEFAULT 1.5,

  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  child_price DECIMAL(10, 2), -- Optional child pricing
  group_discount_percent DECIMAL(4, 2), -- e.g., 10% off for groups of 5+
  group_discount_min_size INTEGER,

  -- Media
  main_image TEXT,
  gallery_images TEXT[] DEFAULT '{}',

  -- What's Included
  includes TEXT[] DEFAULT '{}', -- ["Equipment", "Light refreshments", "Guide"]
  excludes TEXT[] DEFAULT '{}', -- ["Transport", "Gratuities"]
  requirements TEXT[] DEFAULT '{}', -- ["Moderate fitness level", "Closed shoes"]

  -- Booking Settings
  advance_booking_required BOOLEAN DEFAULT false,
  min_advance_hours INTEGER DEFAULT 24,
  max_advance_days INTEGER DEFAULT 90,
  cancellation_hours INTEGER DEFAULT 24, -- Hours before for free cancellation
  instant_confirmation BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Stats
  rating DECIMAL(2, 1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(venue_id, slug)
);

-- ============================================================================
-- EXPERIENCE SCHEDULES - When experiences are available
-- ============================================================================

CREATE TABLE IF NOT EXISTS experience_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,

  -- Schedule Type
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('recurring', 'specific_date', 'on_demand')),

  -- For recurring schedules
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday

  -- Time slots
  start_time TIME NOT NULL,
  end_time TIME,

  -- For specific dates
  specific_date DATE,

  -- Capacity override
  capacity_override INTEGER,

  -- Price override
  price_override DECIMAL(10, 2),

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EXPERIENCE BOOKINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS experience_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE NOT NULL,

  -- Relations
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE RESTRICT,
  schedule_id UUID REFERENCES experience_schedules(id),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Customer Info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,

  -- Booking Details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  num_adults INTEGER DEFAULT 1,
  num_children INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT false,

  -- Pricing
  unit_price DECIMAL(10, 2) NOT NULL,
  adult_total DECIMAL(10, 2) NOT NULL,
  child_total DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  taxes DECIMAL(10, 2) DEFAULT 0,
  fees DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'ZAR',

  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded', 'failed')),
  payment_method TEXT,
  payment_reference TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),

  -- Additional
  special_requests TEXT,
  internal_notes TEXT,

  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- VENUE/EXPERIENCE REVIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS venue_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES experience_bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Must review either venue or experience
  CHECK (venue_id IS NOT NULL OR experience_id IS NOT NULL),

  -- Ratings
  overall_rating DECIMAL(2, 1) NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  value_rating DECIMAL(2, 1) CHECK (value_rating >= 1 AND value_rating <= 5),
  service_rating DECIMAL(2, 1) CHECK (service_rating >= 1 AND service_rating <= 5),
  location_rating DECIMAL(2, 1) CHECK (location_rating >= 1 AND location_rating <= 5),

  -- Content
  title TEXT,
  review_text TEXT,
  photos TEXT[] DEFAULT '{}',

  -- Context
  visit_date DATE,
  visit_type TEXT CHECK (visit_type IN ('solo', 'couple', 'family', 'friends', 'business')),

  -- Response
  response_text TEXT,
  response_date TIMESTAMPTZ,

  -- Status
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_type ON venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venues_active ON venues(is_active);
CREATE INDEX IF NOT EXISTS idx_venues_featured ON venues(is_featured);
CREATE INDEX IF NOT EXISTS idx_venues_location ON venues USING gist (point(longitude, latitude));
CREATE INDEX IF NOT EXISTS idx_venues_owner ON venues(owner_id);

CREATE INDEX IF NOT EXISTS idx_experiences_venue ON experiences(venue_id);
CREATE INDEX IF NOT EXISTS idx_experiences_type ON experiences(experience_type);
CREATE INDEX IF NOT EXISTS idx_experiences_active ON experiences(is_active);
CREATE INDEX IF NOT EXISTS idx_experiences_price ON experiences(base_price);

CREATE INDEX IF NOT EXISTS idx_experience_schedules_exp ON experience_schedules(experience_id);
CREATE INDEX IF NOT EXISTS idx_experience_schedules_date ON experience_schedules(specific_date);
CREATE INDEX IF NOT EXISTS idx_experience_schedules_day ON experience_schedules(day_of_week);

CREATE INDEX IF NOT EXISTS idx_experience_bookings_exp ON experience_bookings(experience_id);
CREATE INDEX IF NOT EXISTS idx_experience_bookings_customer ON experience_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_experience_bookings_date ON experience_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_experience_bookings_status ON experience_bookings(status);
CREATE INDEX IF NOT EXISTS idx_experience_bookings_number ON experience_bookings(booking_number);

CREATE INDEX IF NOT EXISTS idx_venue_reviews_venue ON venue_reviews(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_reviews_experience ON venue_reviews(experience_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_reviews ENABLE ROW LEVEL SECURITY;

-- Venues policies
CREATE POLICY "Public can view active venues"
  ON venues FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage their venues"
  ON venues FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all venues"
  ON venues FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Experiences policies
CREATE POLICY "Public can view active experiences"
  ON experiences FOR SELECT USING (is_active = true);

CREATE POLICY "Venue owners can manage experiences"
  ON experiences FOR ALL USING (
    venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
    OR host_id = auth.uid()
  );

-- Schedules policies
CREATE POLICY "Public can view active schedules"
  ON experience_schedules FOR SELECT USING (is_active = true);

CREATE POLICY "Experience owners can manage schedules"
  ON experience_schedules FOR ALL USING (
    experience_id IN (
      SELECT e.id FROM experiences e
      LEFT JOIN venues v ON e.venue_id = v.id
      WHERE v.owner_id = auth.uid() OR e.host_id = auth.uid()
    )
  );

-- Bookings policies
CREATE POLICY "Customers can view own bookings"
  ON experience_bookings FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Customers can create bookings"
  ON experience_bookings FOR INSERT WITH CHECK (customer_id = auth.uid() OR customer_id IS NULL);

CREATE POLICY "Experience owners can view bookings"
  ON experience_bookings FOR SELECT USING (
    experience_id IN (
      SELECT e.id FROM experiences e
      LEFT JOIN venues v ON e.venue_id = v.id
      WHERE v.owner_id = auth.uid() OR e.host_id = auth.uid()
    )
  );

CREATE POLICY "Experience owners can update bookings"
  ON experience_bookings FOR UPDATE USING (
    experience_id IN (
      SELECT e.id FROM experiences e
      LEFT JOIN venues v ON e.venue_id = v.id
      WHERE v.owner_id = auth.uid() OR e.host_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Public can view reviews"
  ON venue_reviews FOR SELECT USING (true);

CREATE POLICY "Users can create reviews"
  ON venue_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON venue_reviews FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate experience booking number
CREATE OR REPLACE FUNCTION generate_experience_booking_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'EXP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
END;
$$ LANGUAGE plpgsql;

-- Trigger for booking number
CREATE OR REPLACE FUNCTION set_experience_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := generate_experience_booking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_experience_booking_number_trigger
  BEFORE INSERT ON experience_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_experience_booking_number();

-- Update venue rating
CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.venue_id IS NOT NULL THEN
    UPDATE venues
    SET
      rating = (SELECT ROUND(AVG(overall_rating)::numeric, 1) FROM venue_reviews WHERE venue_id = NEW.venue_id),
      total_reviews = (SELECT COUNT(*) FROM venue_reviews WHERE venue_id = NEW.venue_id),
      updated_at = NOW()
    WHERE id = NEW.venue_id;
  END IF;

  IF NEW.experience_id IS NOT NULL THEN
    UPDATE experiences
    SET
      rating = (SELECT ROUND(AVG(overall_rating)::numeric, 1) FROM venue_reviews WHERE experience_id = NEW.experience_id),
      total_reviews = (SELECT COUNT(*) FROM venue_reviews WHERE experience_id = NEW.experience_id),
      updated_at = NOW()
    WHERE id = NEW.experience_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_venue_experience_rating_trigger
  AFTER INSERT OR UPDATE ON venue_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_rating();

-- Check experience availability
CREATE OR REPLACE FUNCTION check_experience_availability(
  p_experience_id UUID,
  p_date DATE,
  p_time TIME,
  p_num_people INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_max_capacity INTEGER;
  v_booked INTEGER;
  v_schedule_capacity INTEGER;
BEGIN
  -- Get experience max capacity
  SELECT max_participants INTO v_max_capacity
  FROM experiences
  WHERE id = p_experience_id;

  -- Check for schedule-specific capacity
  SELECT capacity_override INTO v_schedule_capacity
  FROM experience_schedules
  WHERE experience_id = p_experience_id
    AND (
      (schedule_type = 'specific_date' AND specific_date = p_date)
      OR (schedule_type = 'recurring' AND day_of_week = EXTRACT(DOW FROM p_date))
    )
    AND start_time = p_time
    AND is_active = true
  LIMIT 1;

  IF v_schedule_capacity IS NOT NULL THEN
    v_max_capacity := v_schedule_capacity;
  END IF;

  -- If no max capacity, always available
  IF v_max_capacity IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Count existing bookings
  SELECT COALESCE(SUM(num_adults + num_children), 0) INTO v_booked
  FROM experience_bookings
  WHERE experience_id = p_experience_id
    AND booking_date = p_date
    AND start_time = p_time
    AND status NOT IN ('cancelled', 'no_show');

  RETURN (v_max_capacity - v_booked) >= p_num_people;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE venues IS 'Places and locations offering experiences and activities';
COMMENT ON TABLE experiences IS 'Tours, activities, classes, and events available for booking';
COMMENT ON TABLE experience_schedules IS 'When experiences are available - recurring or specific dates';
COMMENT ON TABLE experience_bookings IS 'Customer bookings for experiences';
COMMENT ON TABLE venue_reviews IS 'Reviews for venues and experiences';
