-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create new enums for ride-sharing
CREATE TYPE journey_mode AS ENUM (
  'budget',
  'night_out', 
  'family',
  'shopping',
  'business',
  'quick',
  'eco',
  'accessible'
);

CREATE TYPE ride_status AS ENUM (
  'requested',
  'accepted',
  'driver_arriving',
  'started',
  'completed',
  'cancelled'
);

CREATE TYPE service_tier AS ENUM (
  'budget',
  'enhanced',
  'premium',
  'luxury'
);

CREATE TYPE verification_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- Create riders table
CREATE TABLE public.riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  preferred_journey_mode journey_mode DEFAULT 'budget',
  total_rides INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INTEGER NOT NULL,
  vehicle_color TEXT NOT NULL,
  vehicle_license_plate TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'sedan',
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_holder TEXT,
  is_available BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  current_tier service_tier DEFAULT 'budget',
  total_rides INTEGER DEFAULT 0,
  completed_rides INTEGER DEFAULT 0,
  cancelled_rides INTEGER DEFAULT 0,
  acceptance_rate NUMERIC(5,2) DEFAULT 100.00,
  average_rating NUMERIC(3,2) DEFAULT 0.00,
  total_earnings NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(vehicle_license_plate)
);

-- Create ride service tiers configuration
CREATE TABLE public.ride_service_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier service_tier NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  base_fare NUMERIC(10,2) NOT NULL,
  per_km_rate NUMERIC(10,2) NOT NULL,
  per_minute_rate NUMERIC(10,2) NOT NULL,
  minimum_vehicle_year INTEGER NOT NULL,
  minimum_rating NUMERIC(3,2) NOT NULL,
  platform_commission_rate NUMERIC(5,2) NOT NULL,
  features JSONB DEFAULT '[]',
  requirements JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default tier configurations
INSERT INTO public.ride_service_tiers (tier, name, description, base_fare, per_km_rate, per_minute_rate, minimum_vehicle_year, minimum_rating, platform_commission_rate, features, requirements) VALUES
('budget', 'Budget', 'Affordable rides for everyday travel', 15.00, 8.50, 1.50, 2015, 3.50, 15.00, '["Basic ride", "Reliable drivers"]', '["Vehicle 2015+", "3.5+ rating"]'),
('enhanced', 'Enhanced', 'Comfortable rides with extra safety', 20.00, 10.00, 2.00, 2018, 4.30, 20.00, '["Dashcam recording", "Enhanced safety", "Newer vehicles"]', '["Vehicle 2018+", "4.3+ rating", "Dashcam required"]'),
('premium', 'Premium', 'Professional service with comfort', 30.00, 12.50, 2.50, 2020, 4.50, 22.00, '["Professional drivers", "Premium vehicles", "Uniform required"]', '["Vehicle 2020+", "4.5+ rating", "Uniform required"]'),
('luxury', 'Luxury', 'High-end experience with luxury vehicles', 50.00, 18.00, 3.50, 2022, 4.70, 25.00, '["Luxury vehicles only", "Top-rated drivers", "Premium amenities"]', '["BMW/Mercedes/Audi", "Vehicle 2022+", "4.7+ rating"]');

-- Create driver tier verifications
CREATE TABLE public.driver_tier_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  tier service_tier NOT NULL,
  status verification_status DEFAULT 'pending',
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(driver_id, tier)
);

-- Create driver documents
CREATE TABLE public.driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  status verification_status DEFAULT 'pending',
  expiry_date DATE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create rides table
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_number TEXT NOT NULL UNIQUE,
  rider_id UUID NOT NULL REFERENCES public.riders(id),
  driver_id UUID REFERENCES public.drivers(id),
  journey_mode journey_mode NOT NULL DEFAULT 'budget',
  service_tier service_tier NOT NULL DEFAULT 'budget',
  status ride_status NOT NULL DEFAULT 'requested',
  
  -- Location data
  pickup_address TEXT NOT NULL,
  pickup_latitude NUMERIC(10,8) NOT NULL,
  pickup_longitude NUMERIC(11,8) NOT NULL,
  pickup_location GEOGRAPHY(POINT, 4326),
  dropoff_address TEXT NOT NULL,
  dropoff_latitude NUMERIC(10,8) NOT NULL,
  dropoff_longitude NUMERIC(11,8) NOT NULL,
  dropoff_location GEOGRAPHY(POINT, 4326),
  
  -- Distance and time
  estimated_distance_km NUMERIC(10,2),
  estimated_duration_minutes INTEGER,
  actual_distance_km NUMERIC(10,2),
  actual_duration_minutes INTEGER,
  
  -- Pricing
  base_fare NUMERIC(10,2) NOT NULL,
  distance_fare NUMERIC(10,2) DEFAULT 0.00,
  time_fare NUMERIC(10,2) DEFAULT 0.00,
  surge_multiplier NUMERIC(3,2) DEFAULT 1.00,
  subtotal NUMERIC(10,2) NOT NULL,
  platform_commission NUMERIC(10,2) DEFAULT 0.00,
  settlement_fee NUMERIC(10,2) DEFAULT 0.00,
  tip NUMERIC(10,2) DEFAULT 0.00,
  total NUMERIC(10,2) NOT NULL,
  net_driver_payout NUMERIC(10,2) DEFAULT 0.00,
  
  -- Timestamps
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  driver_arrived_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Additional info
  special_instructions TEXT,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES auth.users(id),
  
  -- Emergency tracking
  trip_share_token TEXT UNIQUE,
  emergency_contact_notified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create spatial indexes
CREATE INDEX idx_rides_pickup_location ON public.rides USING GIST(pickup_location);
CREATE INDEX idx_rides_dropoff_location ON public.rides USING GIST(dropoff_location);
CREATE INDEX idx_rides_status ON public.rides(status);
CREATE INDEX idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX idx_rides_rider_id ON public.rides(rider_id);

-- Create driver locations table for real-time tracking
CREATE TABLE public.driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES public.rides(id) ON DELETE SET NULL,
  latitude NUMERIC(10,8) NOT NULL,
  longitude NUMERIC(11,8) NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  heading NUMERIC(5,2),
  speed NUMERIC(5,2),
  accuracy NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create spatial index for driver locations
CREATE INDEX idx_driver_locations_location ON public.driver_locations USING GIST(location);
CREATE INDEX idx_driver_locations_driver_id ON public.driver_locations(driver_id);

-- Create ride status history
CREATE TABLE public.ride_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  status ride_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ride ratings
CREATE TABLE public.ride_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  rated_by UUID NOT NULL REFERENCES auth.users(id),
  rated_user_id UUID NOT NULL REFERENCES auth.users(id),
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ride_id, rated_by)
);

-- Create ride emergencies table
CREATE TABLE public.ride_emergencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  emergency_type TEXT NOT NULL,
  location_latitude NUMERIC(10,8),
  location_longitude NUMERIC(11,8),
  notes TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create function to generate ride numbers
CREATE OR REPLACE FUNCTION public.generate_ride_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_ride_number TEXT;
BEGIN
  new_ride_number := 'RIDE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN new_ride_number;
END;
$$;

-- Create function to calculate ride pricing
CREATE OR REPLACE FUNCTION public.calculate_ride_pricing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tier_config RECORD;
BEGIN
  -- Get tier configuration
  SELECT * INTO tier_config
  FROM public.ride_service_tiers
  WHERE tier = NEW.service_tier;
  
  IF tier_config IS NULL THEN
    RAISE EXCEPTION 'Invalid service tier';
  END IF;
  
  -- Calculate fares
  NEW.base_fare := tier_config.base_fare;
  NEW.distance_fare := COALESCE(NEW.estimated_distance_km, 0) * tier_config.per_km_rate;
  NEW.time_fare := COALESCE(NEW.estimated_duration_minutes, 0) * tier_config.per_minute_rate;
  
  -- Calculate subtotal with surge
  NEW.subtotal := (NEW.base_fare + NEW.distance_fare + NEW.time_fare) * NEW.surge_multiplier;
  
  -- Calculate platform commission
  NEW.platform_commission := NEW.subtotal * (tier_config.platform_commission_rate / 100);
  
  -- Calculate settlement fee (4.5% on total)
  NEW.settlement_fee := NEW.subtotal * 0.045;
  
  -- Calculate total
  NEW.total := NEW.subtotal + COALESCE(NEW.tip, 0);
  
  -- Calculate net driver payout
  NEW.net_driver_payout := NEW.subtotal - NEW.platform_commission - NEW.settlement_fee + COALESCE(NEW.tip, 0);
  
  RETURN NEW;
END;
$$;

-- Create trigger for ride pricing
CREATE TRIGGER calculate_ride_pricing_trigger
BEFORE INSERT OR UPDATE ON public.rides
FOR EACH ROW
EXECUTE FUNCTION public.calculate_ride_pricing();

-- Create function to update driver rating
CREATE OR REPLACE FUNCTION public.update_driver_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  driver_user_id UUID;
  avg_rating NUMERIC;
BEGIN
  -- Get driver user_id
  SELECT user_id INTO driver_user_id
  FROM public.drivers
  WHERE id = (
    SELECT driver_id FROM public.rides WHERE id = NEW.ride_id
  );
  
  -- Calculate new average rating
  SELECT AVG(overall_rating) INTO avg_rating
  FROM public.ride_ratings
  WHERE rated_user_id = driver_user_id;
  
  -- Update driver average rating
  UPDATE public.drivers
  SET average_rating = COALESCE(avg_rating, 0)
  WHERE user_id = driver_user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for driver rating updates
CREATE TRIGGER update_driver_rating_trigger
AFTER INSERT ON public.ride_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_driver_rating();

-- Create function to log ride status changes
CREATE OR REPLACE FUNCTION public.log_ride_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.ride_status_history (ride_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for ride status logging
CREATE TRIGGER log_ride_status_change_trigger
AFTER UPDATE ON public.rides
FOR EACH ROW
EXECUTE FUNCTION public.log_ride_status_change();

-- Create function to update pickup/dropoff geography from lat/lng
CREATE OR REPLACE FUNCTION public.update_ride_geography()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.pickup_location := ST_SetSRID(ST_MakePoint(NEW.pickup_longitude, NEW.pickup_latitude), 4326)::geography;
  NEW.dropoff_location := ST_SetSRID(ST_MakePoint(NEW.dropoff_longitude, NEW.dropoff_latitude), 4326)::geography;
  RETURN NEW;
END;
$$;

-- Create trigger for geography updates
CREATE TRIGGER update_ride_geography_trigger
BEFORE INSERT OR UPDATE ON public.rides
FOR EACH ROW
EXECUTE FUNCTION public.update_ride_geography();

-- Create function to update driver location geography
CREATE OR REPLACE FUNCTION public.update_driver_location_geography()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$;

-- Create trigger for driver location geography
CREATE TRIGGER update_driver_location_geography_trigger
BEFORE INSERT OR UPDATE ON public.driver_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_driver_location_geography();

-- Create function to auto-generate ride numbers
CREATE OR REPLACE FUNCTION public.set_ride_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ride_number IS NULL THEN
    NEW.ride_number := generate_ride_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for ride number generation
CREATE TRIGGER set_ride_number_trigger
BEFORE INSERT ON public.rides
FOR EACH ROW
EXECUTE FUNCTION public.set_ride_number();

-- Enable RLS on all tables
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_service_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_tier_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_emergencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for riders
CREATE POLICY "Riders can view own profile"
ON public.riders FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Riders can update own profile"
ON public.riders FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Riders can insert own profile"
ON public.riders FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all riders"
ON public.riders FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

-- RLS Policies for drivers
CREATE POLICY "Drivers can view own profile"
ON public.drivers FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Drivers can update own profile"
ON public.drivers FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Drivers can insert own profile"
ON public.drivers FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all drivers"
ON public.drivers FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

CREATE POLICY "Admins can update drivers"
ON public.drivers FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

-- RLS Policies for ride_service_tiers
CREATE POLICY "Anyone can view active tiers"
ON public.ride_service_tiers FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage tiers"
ON public.ride_service_tiers FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

-- RLS Policies for driver_tier_verifications
CREATE POLICY "Drivers can view own verifications"
ON public.driver_tier_verifications FOR SELECT
USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can insert own verifications"
ON public.driver_tier_verifications FOR INSERT
WITH CHECK (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage verifications"
ON public.driver_tier_verifications FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

-- RLS Policies for driver_documents
CREATE POLICY "Drivers can manage own documents"
ON public.driver_documents FOR ALL
USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all documents"
ON public.driver_documents FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

CREATE POLICY "Admins can update documents"
ON public.driver_documents FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

-- RLS Policies for rides
CREATE POLICY "Riders can view own rides"
ON public.rides FOR SELECT
USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));

CREATE POLICY "Riders can create rides"
ON public.rides FOR INSERT
WITH CHECK (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can view assigned rides"
ON public.rides FOR SELECT
USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can update assigned rides"
ON public.rides FOR UPDATE
USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all rides"
ON public.rides FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

CREATE POLICY "Admins can update rides"
ON public.rides FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

-- RLS Policies for driver_locations
CREATE POLICY "Drivers can manage own location"
ON public.driver_locations FOR ALL
USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Riders can view driver location for their rides"
ON public.driver_locations FOR SELECT
USING (ride_id IN (SELECT id FROM public.rides WHERE rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())));

CREATE POLICY "Admins can view all locations"
ON public.driver_locations FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

-- RLS Policies for ride_status_history
CREATE POLICY "Users can view status history for their rides"
ON public.ride_status_history FOR SELECT
USING (
  ride_id IN (
    SELECT id FROM public.rides 
    WHERE rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Admins can view all status history"
ON public.ride_status_history FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

-- RLS Policies for ride_ratings
CREATE POLICY "Users can view ratings for their rides"
ON public.ride_ratings FOR SELECT
USING (rated_by = auth.uid() OR rated_user_id = auth.uid());

CREATE POLICY "Users can insert ratings for completed rides"
ON public.ride_ratings FOR INSERT
WITH CHECK (
  rated_by = auth.uid() AND
  ride_id IN (
    SELECT id FROM public.rides 
    WHERE status = 'completed' 
    AND (
      rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
      OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    )
  )
);

CREATE POLICY "Admins can view all ratings"
ON public.ride_ratings FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

-- RLS Policies for ride_emergencies
CREATE POLICY "Users can create emergencies for their rides"
ON public.ride_emergencies FOR INSERT
WITH CHECK (
  reported_by = auth.uid() AND
  ride_id IN (
    SELECT id FROM public.rides 
    WHERE rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can view emergencies for their rides"
ON public.ride_emergencies FOR SELECT
USING (
  ride_id IN (
    SELECT id FROM public.rides 
    WHERE rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Admins can manage all emergencies"
ON public.ride_emergencies FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_emergencies;