-- Day-Specific Business Hours Migration
-- Allows restaurants to set different hours for each day of the week

CREATE TABLE IF NOT EXISTS restaurant_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, day_of_week)
);

-- RLS for restaurant_hours
ALTER TABLE restaurant_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view restaurant hours"
  ON restaurant_hours FOR SELECT
  USING (true);

CREATE POLICY "Restaurant owners can manage their hours"
  ON restaurant_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = restaurant_hours.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all restaurant hours"
  ON restaurant_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_hours_restaurant_id ON restaurant_hours(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_hours_day ON restaurant_hours(day_of_week);

-- Function to check if restaurant is open now
CREATE OR REPLACE FUNCTION is_restaurant_open_now(restaurant_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_day INTEGER;
  current_time TIME;
  hours_record RECORD;
BEGIN
  -- Get current day (0 = Sunday, 6 = Saturday)
  current_day := EXTRACT(DOW FROM NOW());
  current_time := NOW()::TIME;

  -- Get hours for current day
  SELECT * INTO hours_record
  FROM restaurant_hours
  WHERE restaurant_id = restaurant_uuid
  AND day_of_week = current_day;

  -- If no hours set, fall back to restaurant.opening_time/closing_time
  IF NOT FOUND THEN
    RETURN EXISTS (
      SELECT 1 FROM restaurants
      WHERE id = restaurant_uuid
      AND is_open = true
      AND (
        (opening_time IS NULL AND closing_time IS NULL)
        OR
        (current_time >= opening_time AND current_time <= closing_time)
      )
    );
  END IF;

  -- Check if closed for the day
  IF hours_record.is_closed THEN
    RETURN false;
  END IF;

  -- Check if within operating hours
  RETURN current_time >= hours_record.open_time
    AND current_time <= hours_record.close_time;
END;
$$ LANGUAGE plpgsql STABLE;

-- Updated_at trigger
CREATE TRIGGER update_restaurant_hours_updated_at
  BEFORE UPDATE ON restaurant_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
