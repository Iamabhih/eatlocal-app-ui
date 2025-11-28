-- Panic Alerts System for South Africa
-- Emergency response integration across all 9 provinces

-- Create enum for South African provinces
CREATE TYPE sa_province AS ENUM (
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
);

-- Create enum for alert status
CREATE TYPE alert_status AS ENUM (
  'active',
  'acknowledged',
  'responding',
  'resolved',
  'cancelled',
  'false_alarm'
);

-- Create enum for alert priority
CREATE TYPE alert_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Panic Alerts table
CREATE TABLE panic_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Location data
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  province sa_province,

  -- User info (for anonymous alerts)
  user_name TEXT,
  user_phone TEXT,
  user_email TEXT,

  -- Alert details
  description TEXT,
  priority alert_priority DEFAULT 'high',
  status alert_status DEFAULT 'active',

  -- Response tracking
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES profiles(id),
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,

  -- Security provider response
  security_provider_id UUID,
  security_response_time TIMESTAMPTZ,

  -- Metadata
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Security Providers table
CREATE TABLE security_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_name TEXT,
  registration_number TEXT,

  -- Contact info
  phone TEXT NOT NULL,
  emergency_phone TEXT,
  email TEXT,
  website TEXT,

  -- Coverage area
  provinces sa_province[] DEFAULT '{}',
  cities TEXT[] DEFAULT '{}',
  coverage_radius_km INTEGER DEFAULT 50,

  -- Location (headquarters)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,

  -- Service details
  services TEXT[] DEFAULT '{}', -- armed response, patrol, monitoring, etc.
  response_time_minutes INTEGER DEFAULT 15,
  is_24_hours BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,

  -- Stats
  total_responses INTEGER DEFAULT 0,
  average_response_time INTEGER, -- in minutes
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Emergency Contacts by Province
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province sa_province NOT NULL,
  service_type TEXT NOT NULL, -- police, ambulance, fire, etc.
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternative_phone TEXT,
  address TEXT,
  is_24_hours BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default emergency contacts for all provinces
INSERT INTO emergency_contacts (province, service_type, name, phone) VALUES
  -- National numbers (apply to all provinces)
  ('Gauteng', 'police', 'SAPS National', '10111'),
  ('Gauteng', 'ambulance', 'National Ambulance', '10177'),
  ('Gauteng', 'emergency', 'Emergency (Cell)', '112'),
  ('Western Cape', 'police', 'SAPS National', '10111'),
  ('Western Cape', 'ambulance', 'National Ambulance', '10177'),
  ('Western Cape', 'emergency', 'Emergency (Cell)', '112'),
  ('KwaZulu-Natal', 'police', 'SAPS National', '10111'),
  ('KwaZulu-Natal', 'ambulance', 'National Ambulance', '10177'),
  ('KwaZulu-Natal', 'emergency', 'Emergency (Cell)', '112'),
  ('Eastern Cape', 'police', 'SAPS National', '10111'),
  ('Eastern Cape', 'ambulance', 'National Ambulance', '10177'),
  ('Eastern Cape', 'emergency', 'Emergency (Cell)', '112'),
  ('Free State', 'police', 'SAPS National', '10111'),
  ('Free State', 'ambulance', 'National Ambulance', '10177'),
  ('Free State', 'emergency', 'Emergency (Cell)', '112'),
  ('Limpopo', 'police', 'SAPS National', '10111'),
  ('Limpopo', 'ambulance', 'National Ambulance', '10177'),
  ('Limpopo', 'emergency', 'Emergency (Cell)', '112'),
  ('Mpumalanga', 'police', 'SAPS National', '10111'),
  ('Mpumalanga', 'ambulance', 'National Ambulance', '10177'),
  ('Mpumalanga', 'emergency', 'Emergency (Cell)', '112'),
  ('Northern Cape', 'police', 'SAPS National', '10111'),
  ('Northern Cape', 'ambulance', 'National Ambulance', '10177'),
  ('Northern Cape', 'emergency', 'Emergency (Cell)', '112'),
  ('North West', 'police', 'SAPS National', '10111'),
  ('North West', 'ambulance', 'National Ambulance', '10177'),
  ('North West', 'emergency', 'Emergency (Cell)', '112');

-- Add province column to existing tables for SA coverage
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS province sa_province;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS province sa_province;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS province sa_province;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS province sa_province;

-- Provider applications table (for service provider signups)
CREATE TABLE provider_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Application type
  provider_type TEXT NOT NULL CHECK (provider_type IN ('restaurant', 'hotel', 'venue', 'delivery', 'security')),

  -- Business info
  business_name TEXT NOT NULL,
  business_type TEXT,
  registration_number TEXT,
  vat_number TEXT,

  -- Contact
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,

  -- Location
  address TEXT,
  city TEXT,
  province sa_province,
  postal_code TEXT,

  -- Documents
  documents JSONB DEFAULT '{}', -- store document URLs

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'more_info_needed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_panic_alerts_status ON panic_alerts(status);
CREATE INDEX idx_panic_alerts_province ON panic_alerts(province);
CREATE INDEX idx_panic_alerts_created ON panic_alerts(created_at DESC);
CREATE INDEX idx_panic_alerts_user ON panic_alerts(user_id);

CREATE INDEX idx_security_providers_active ON security_providers(is_active) WHERE is_active = true;
CREATE INDEX idx_security_providers_provinces ON security_providers USING GIN(provinces);

CREATE INDEX idx_provider_applications_status ON provider_applications(status);
CREATE INDEX idx_provider_applications_type ON provider_applications(provider_type);

-- RLS Policies

-- Panic Alerts - Users can create, admins can manage
ALTER TABLE panic_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create panic alerts"
  ON panic_alerts FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can view their own panic alerts"
  ON panic_alerts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  ));

CREATE POLICY "Admins can update panic alerts"
  ON panic_alerts FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  ));

-- Security Providers - Public read, admin manage
ALTER TABLE security_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active security providers"
  ON security_providers FOR SELECT
  TO authenticated, anon
  USING (is_active = true AND is_verified = true);

CREATE POLICY "Admins can manage security providers"
  ON security_providers FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  ));

-- Emergency Contacts - Public read
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view emergency contacts"
  ON emergency_contacts FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Provider Applications
ALTER TABLE provider_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create applications"
  ON provider_applications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own applications"
  ON provider_applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  ));

CREATE POLICY "Admins can update applications"
  ON provider_applications FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  ));

-- Function to notify security providers on panic alert
CREATE OR REPLACE FUNCTION notify_security_providers()
RETURNS TRIGGER AS $$
BEGIN
  -- In production, this would trigger actual notifications
  -- via push notifications, SMS, or other channels
  RAISE NOTICE 'Panic alert created: %', NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_panic_alert_created
  AFTER INSERT ON panic_alerts
  FOR EACH ROW
  EXECUTE FUNCTION notify_security_providers();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_panic_alert_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_panic_alerts_timestamp
  BEFORE UPDATE ON panic_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_panic_alert_timestamp();

CREATE TRIGGER update_security_providers_timestamp
  BEFORE UPDATE ON security_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_panic_alert_timestamp();

CREATE TRIGGER update_provider_applications_timestamp
  BEFORE UPDATE ON provider_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_panic_alert_timestamp();
