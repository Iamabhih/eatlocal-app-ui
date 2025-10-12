-- Enable REPLICA IDENTITY FULL for delivery_partner_locations table
-- This ensures all column values are included in realtime updates
ALTER TABLE delivery_partner_locations REPLICA IDENTITY FULL;

-- Create indexes for faster location queries
CREATE INDEX IF NOT EXISTS idx_delivery_partner_locations_order_id 
ON delivery_partner_locations(order_id);

CREATE INDEX IF NOT EXISTS idx_delivery_partner_locations_partner_id 
ON delivery_partner_locations(delivery_partner_id);

CREATE INDEX IF NOT EXISTS idx_delivery_partner_locations_updated_at 
ON delivery_partner_locations(updated_at DESC);