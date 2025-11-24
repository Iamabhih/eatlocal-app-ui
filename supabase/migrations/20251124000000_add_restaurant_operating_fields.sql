-- Add operating hours and delivery radius fields to restaurants
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS opening_time TIME DEFAULT '09:00:00',
  ADD COLUMN IF NOT EXISTS closing_time TIME DEFAULT '22:00:00',
  ADD COLUMN IF NOT EXISTS delivery_radius_km DECIMAL(5, 2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add comments for documentation
COMMENT ON COLUMN public.restaurants.opening_time IS 'Restaurant opening time (24-hour format)';
COMMENT ON COLUMN public.restaurants.closing_time IS 'Restaurant closing time (24-hour format)';
COMMENT ON COLUMN public.restaurants.delivery_radius_km IS 'Maximum delivery radius in kilometers (default 10km)';
COMMENT ON COLUMN public.restaurants.latitude IS 'Restaurant latitude for distance calculations';
COMMENT ON COLUMN public.restaurants.longitude IS 'Restaurant longitude for distance calculations';
