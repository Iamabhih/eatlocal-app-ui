-- =====================================================
-- COMPREHENSIVE MIGRATION: Missing Tables & Columns
-- =====================================================

-- 1. Add 'scheduled' value to order_status enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'scheduled';

-- 2. Add missing columns to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- 3. Add missing columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wallet_amount_used NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 4. Add missing columns to drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_expiry DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS insurance_number TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS insurance_expiry DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- 5. Create venues table
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  venue_type TEXT NOT NULL DEFAULT 'other',
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'South Africa',
  zip_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  phone TEXT,
  email TEXT,
  website TEXT,
  main_image TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  price_level TEXT DEFAULT '$$',
  rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending',
  opening_hours JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Create experiences table
CREATE TABLE IF NOT EXISTS public.experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  experience_type TEXT NOT NULL DEFAULT 'other',
  duration_minutes INTEGER,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  max_participants INTEGER,
  min_participants INTEGER DEFAULT 1,
  main_image TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  includes TEXT[],
  excludes TEXT[],
  requirements TEXT[],
  cancellation_policy TEXT,
  rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Create experience_schedules table
CREATE TABLE IF NOT EXISTS public.experience_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  available_spots INTEGER NOT NULL,
  booked_spots INTEGER DEFAULT 0,
  price_override NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Create experience_bookings table
CREATE TABLE IF NOT EXISTS public.experience_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_number TEXT DEFAULT ('EB-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  experience_id UUID NOT NULL REFERENCES public.experiences(id),
  schedule_id UUID REFERENCES public.experience_schedules(id),
  guest_id UUID,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  num_participants INTEGER NOT NULL DEFAULT 1,
  booking_date DATE NOT NULL,
  booking_time TIME,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  taxes NUMERIC DEFAULT 0,
  fees NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT DEFAULT 'pending',
  special_requests TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Create venue_reviews table
CREATE TABLE IF NOT EXISTS public.venue_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES public.experiences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  booking_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  images TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  response_text TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Create provider_applications table
CREATE TABLE IF NOT EXISTS public.provider_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  provider_type TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT,
  registration_number TEXT,
  vat_number TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  status TEXT DEFAULT 'pending',
  documents JSONB,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for venues
CREATE POLICY "Anyone can view active venues" ON public.venues FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage their venues" ON public.venues FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all venues" ON public.venues FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

-- RLS Policies for experiences
CREATE POLICY "Anyone can view active experiences" ON public.experiences FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage their experiences" ON public.experiences FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all experiences" ON public.experiences FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

-- RLS Policies for experience_schedules
CREATE POLICY "Anyone can view active schedules" ON public.experience_schedules FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage schedules" ON public.experience_schedules FOR ALL 
  USING (EXISTS (SELECT 1 FROM experiences WHERE experiences.id = experience_schedules.experience_id AND experiences.owner_id = auth.uid()));

-- RLS Policies for experience_bookings
CREATE POLICY "Guests can view their bookings" ON public.experience_bookings FOR SELECT USING (auth.uid() = guest_id);
CREATE POLICY "Guests can create bookings" ON public.experience_bookings FOR INSERT WITH CHECK (auth.uid() = guest_id OR guest_id IS NULL);
CREATE POLICY "Guests can update their bookings" ON public.experience_bookings FOR UPDATE USING (auth.uid() = guest_id);
CREATE POLICY "Owners can view bookings" ON public.experience_bookings FOR SELECT 
  USING (EXISTS (SELECT 1 FROM experiences WHERE experiences.id = experience_bookings.experience_id AND experiences.owner_id = auth.uid()));
CREATE POLICY "Admins can manage all bookings" ON public.experience_bookings FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

-- RLS Policies for venue_reviews
CREATE POLICY "Anyone can view reviews" ON public.venue_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON public.venue_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.venue_reviews FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for provider_applications
CREATE POLICY "Users can view their own applications" ON public.provider_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create applications" ON public.provider_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all applications" ON public.provider_applications FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_venues_city ON public.venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_is_active ON public.venues(is_active);
CREATE INDEX IF NOT EXISTS idx_experiences_venue_id ON public.experiences(venue_id);
CREATE INDEX IF NOT EXISTS idx_experience_bookings_guest_id ON public.experience_bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_provider_applications_status ON public.provider_applications(status);