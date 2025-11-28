-- Migration: Dark Kitchens & Hotel Bookings System
-- Created: 2025-11-28

-- ============================================================================
-- DARK KITCHENS / HOME SELLERS SUPPORT
-- ============================================================================

-- Add business_type to restaurants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'business_type'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN business_type TEXT DEFAULT 'restaurant'
      CHECK (business_type IN ('restaurant', 'dark_kitchen', 'home_seller', 'spaza_shop', 'food_truck'));
  END IF;

  -- Add verification status for home-based sellers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN verification_status TEXT DEFAULT 'pending'
      CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended'));
  END IF;

  -- Add verification documents
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'verification_documents'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN verification_documents JSONB DEFAULT '[]';
  END IF;

  -- Add home address (for dark kitchens)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'is_home_based'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN is_home_based BOOLEAN DEFAULT false;
  END IF;

  -- Add operating permit number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'permit_number'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN permit_number TEXT;
  END IF;

  -- Add health certificate
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'health_certificate'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN health_certificate TEXT;
  END IF;

  -- Add commission rate (different for different business types)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN commission_rate DECIMAL(5, 2) DEFAULT 15.00;
  END IF;
END $$;

-- Index for business type filtering
CREATE INDEX IF NOT EXISTS idx_restaurants_business_type ON restaurants(business_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_verification ON restaurants(verification_status);

-- ============================================================================
-- HOTELS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,

  -- Location
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'South Africa',
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,

  -- Details
  star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
  property_type TEXT DEFAULT 'hotel' CHECK (property_type IN ('hotel', 'guesthouse', 'bnb', 'lodge', 'resort', 'apartment', 'hostel')),

  -- Amenities stored as array
  amenities TEXT[] DEFAULT '{}',

  -- Images
  main_image TEXT,
  gallery_images TEXT[] DEFAULT '{}',

  -- Policies
  check_in_time TIME DEFAULT '14:00',
  check_out_time TIME DEFAULT '11:00',
  cancellation_policy TEXT DEFAULT 'flexible',
  house_rules TEXT,

  -- Pricing
  base_price DECIMAL(10, 2), -- Lowest room price
  currency TEXT DEFAULT 'ZAR',

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),

  -- Stats
  total_rooms INTEGER DEFAULT 0,
  rating DECIMAL(2, 1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROOM TYPES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Capacity
  max_guests INTEGER DEFAULT 2,
  beds_description TEXT, -- e.g., "1 King Bed" or "2 Single Beds"
  room_size_sqm DECIMAL(6, 2),

  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  weekend_price DECIMAL(10, 2), -- Optional weekend surcharge

  -- Inventory
  total_rooms INTEGER DEFAULT 1,

  -- Amenities specific to room type
  amenities TEXT[] DEFAULT '{}',

  -- Images
  images TEXT[] DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROOM AVAILABILITY TABLE (for managing inventory per date)
-- ============================================================================

CREATE TABLE IF NOT EXISTS room_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available_rooms INTEGER NOT NULL,
  price_override DECIMAL(10, 2), -- Optional price override for specific dates
  is_blocked BOOLEAN DEFAULT false, -- Block dates manually

  UNIQUE(room_type_id, date)
);

-- ============================================================================
-- HOTEL BOOKINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS hotel_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE NOT NULL,

  -- Relations
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE RESTRICT,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
  guest_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Guest details (for non-registered guests)
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,

  -- Booking details
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_guests INTEGER DEFAULT 1,
  num_rooms INTEGER DEFAULT 1,

  -- Pricing
  nightly_rate DECIMAL(10, 2) NOT NULL,
  num_nights INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  taxes DECIMAL(10, 2) DEFAULT 0,
  fees DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'ZAR',

  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded', 'failed')),
  payment_method TEXT,
  payment_reference TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),

  -- Special requests
  special_requests TEXT,

  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- HOTEL REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS hotel_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES hotel_bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Ratings
  overall_rating DECIMAL(2, 1) NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  cleanliness_rating DECIMAL(2, 1) CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  comfort_rating DECIMAL(2, 1) CHECK (comfort_rating >= 1 AND comfort_rating <= 5),
  location_rating DECIMAL(2, 1) CHECK (location_rating >= 1 AND location_rating <= 5),
  service_rating DECIMAL(2, 1) CHECK (service_rating >= 1 AND service_rating <= 5),
  value_rating DECIMAL(2, 1) CHECK (value_rating >= 1 AND value_rating <= 5),

  -- Content
  title TEXT,
  review_text TEXT,

  -- Travel context
  travel_type TEXT CHECK (travel_type IN ('business', 'leisure', 'family', 'couple', 'solo', 'friends')),

  -- Response
  response_text TEXT,
  response_date TIMESTAMPTZ,

  -- Status
  is_verified BOOLEAN DEFAULT false, -- Verified stay
  helpful_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(booking_id)
);

-- ============================================================================
-- HOTEL AMENITIES REFERENCE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS hotel_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  category TEXT CHECK (category IN ('general', 'room', 'bathroom', 'kitchen', 'entertainment', 'outdoor', 'services', 'accessibility'))
);

-- Insert common amenities
INSERT INTO hotel_amenities (name, icon, category) VALUES
  ('Free WiFi', 'wifi', 'general'),
  ('Parking', 'car', 'general'),
  ('Swimming Pool', 'waves', 'outdoor'),
  ('Gym', 'dumbbell', 'general'),
  ('Restaurant', 'utensils', 'services'),
  ('Room Service', 'bell-concierge', 'services'),
  ('Spa', 'sparkles', 'services'),
  ('Air Conditioning', 'snowflake', 'room'),
  ('TV', 'tv', 'entertainment'),
  ('Mini Bar', 'wine', 'room'),
  ('Safe', 'lock', 'room'),
  ('Hairdryer', 'wind', 'bathroom'),
  ('Breakfast Included', 'coffee', 'services'),
  ('Airport Shuttle', 'plane', 'services'),
  ('24/7 Front Desk', 'clock', 'services'),
  ('Pet Friendly', 'paw-print', 'general'),
  ('Non-Smoking Rooms', 'cigarette-off', 'room'),
  ('Laundry Service', 'shirt', 'services'),
  ('Business Center', 'briefcase', 'services'),
  ('Meeting Rooms', 'users', 'services')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);
CREATE INDEX IF NOT EXISTS idx_hotels_active ON hotels(is_active);
CREATE INDEX IF NOT EXISTS idx_hotels_featured ON hotels(is_featured);
CREATE INDEX IF NOT EXISTS idx_hotels_type ON hotels(property_type);
CREATE INDEX IF NOT EXISTS idx_hotels_rating ON hotels(rating DESC);
CREATE INDEX IF NOT EXISTS idx_hotels_location ON hotels USING gist (
  point(longitude, latitude)
);

CREATE INDEX IF NOT EXISTS idx_room_types_hotel ON room_types(hotel_id);
CREATE INDEX IF NOT EXISTS idx_room_availability_date ON room_availability(date);
CREATE INDEX IF NOT EXISTS idx_room_availability_room ON room_availability(room_type_id);

CREATE INDEX IF NOT EXISTS idx_hotel_bookings_hotel ON hotel_bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_guest ON hotel_bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_dates ON hotel_bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_status ON hotel_bookings(status);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_number ON hotel_bookings(booking_number);

CREATE INDEX IF NOT EXISTS idx_hotel_reviews_hotel ON hotel_reviews(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_reviews_rating ON hotel_reviews(overall_rating DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_reviews ENABLE ROW LEVEL SECURITY;

-- Hotels: Public read, owner write
CREATE POLICY "Public can view active hotels"
  ON hotels FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can manage their hotels"
  ON hotels FOR ALL
  USING (auth.uid() = owner_id);

-- Room Types: Public read, hotel owner write
CREATE POLICY "Public can view room types"
  ON room_types FOR SELECT
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE is_active = true)
  );

CREATE POLICY "Hotel owners can manage room types"
  ON room_types FOR ALL
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE owner_id = auth.uid())
  );

-- Room Availability: Public read, hotel owner write
CREATE POLICY "Public can view availability"
  ON room_availability FOR SELECT
  USING (
    room_type_id IN (
      SELECT rt.id FROM room_types rt
      JOIN hotels h ON rt.hotel_id = h.id
      WHERE h.is_active = true
    )
  );

CREATE POLICY "Hotel owners can manage availability"
  ON room_availability FOR ALL
  USING (
    room_type_id IN (
      SELECT rt.id FROM room_types rt
      JOIN hotels h ON rt.hotel_id = h.id
      WHERE h.owner_id = auth.uid()
    )
  );

-- Hotel Bookings: Guest and hotel owner access
CREATE POLICY "Guests can view own bookings"
  ON hotel_bookings FOR SELECT
  USING (guest_id = auth.uid());

CREATE POLICY "Guests can create bookings"
  ON hotel_bookings FOR INSERT
  WITH CHECK (guest_id = auth.uid() OR guest_id IS NULL);

CREATE POLICY "Hotel owners can view their bookings"
  ON hotel_bookings FOR SELECT
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE owner_id = auth.uid())
  );

CREATE POLICY "Hotel owners can update bookings"
  ON hotel_bookings FOR UPDATE
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE owner_id = auth.uid())
  );

-- Hotel Reviews: Public read, verified guests write
CREATE POLICY "Public can view hotel reviews"
  ON hotel_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their stays"
  ON hotel_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON hotel_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'HB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
END;
$$ LANGUAGE plpgsql;

-- Function to check room availability
CREATE OR REPLACE FUNCTION check_room_availability(
  p_room_type_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_num_rooms INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available INTEGER;
  v_booked INTEGER;
  v_total_rooms INTEGER;
  v_date DATE;
BEGIN
  -- Get total rooms for this room type
  SELECT total_rooms INTO v_total_rooms
  FROM room_types
  WHERE id = p_room_type_id;

  -- Check each date in the range
  v_date := p_check_in;
  WHILE v_date < p_check_out LOOP
    -- Get available rooms from availability table (or use total if not set)
    SELECT COALESCE(available_rooms, v_total_rooms) INTO v_available
    FROM room_availability
    WHERE room_type_id = p_room_type_id AND date = v_date;

    IF v_available IS NULL THEN
      v_available := v_total_rooms;
    END IF;

    -- Count existing bookings for this date
    SELECT COALESCE(SUM(num_rooms), 0) INTO v_booked
    FROM hotel_bookings
    WHERE room_type_id = p_room_type_id
      AND status NOT IN ('cancelled', 'no_show')
      AND check_in_date <= v_date
      AND check_out_date > v_date;

    -- Check if enough rooms available
    IF (v_available - v_booked) < p_num_rooms THEN
      RETURN FALSE;
    END IF;

    v_date := v_date + 1;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get room price for a date
CREATE OR REPLACE FUNCTION get_room_price(
  p_room_type_id UUID,
  p_date DATE
)
RETURNS DECIMAL AS $$
DECLARE
  v_base_price DECIMAL;
  v_weekend_price DECIMAL;
  v_override_price DECIMAL;
  v_day_of_week INTEGER;
BEGIN
  -- Get base and weekend prices
  SELECT base_price, weekend_price INTO v_base_price, v_weekend_price
  FROM room_types
  WHERE id = p_room_type_id;

  -- Check for price override
  SELECT price_override INTO v_override_price
  FROM room_availability
  WHERE room_type_id = p_room_type_id AND date = p_date;

  IF v_override_price IS NOT NULL THEN
    RETURN v_override_price;
  END IF;

  -- Check if weekend (Friday=5, Saturday=6)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  IF v_weekend_price IS NOT NULL AND v_day_of_week IN (5, 6) THEN
    RETURN v_weekend_price;
  END IF;

  RETURN v_base_price;
END;
$$ LANGUAGE plpgsql;

-- Function to update hotel rating
CREATE OR REPLACE FUNCTION update_hotel_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hotels
  SET
    rating = (
      SELECT ROUND(AVG(overall_rating)::numeric, 1)
      FROM hotel_reviews
      WHERE hotel_id = NEW.hotel_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM hotel_reviews
      WHERE hotel_id = NEW.hotel_id
    ),
    updated_at = NOW()
  WHERE id = NEW.hotel_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hotel_rating_trigger
  AFTER INSERT OR UPDATE ON hotel_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_hotel_rating();

-- Trigger for booking number generation
CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := generate_booking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_number_trigger
  BEFORE INSERT ON hotel_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_number();

COMMENT ON TABLE hotels IS 'Hotels, guesthouses, B&Bs, and accommodation listings';
COMMENT ON TABLE room_types IS 'Room categories within a hotel with pricing';
COMMENT ON TABLE room_availability IS 'Daily room inventory and pricing overrides';
COMMENT ON TABLE hotel_bookings IS 'Guest reservations and booking records';
COMMENT ON TABLE hotel_reviews IS 'Guest reviews and ratings for hotels';
