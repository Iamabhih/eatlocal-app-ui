-- Phase 1: Fix Critical RLS Error
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Superadmins can insert user roles" ON public.user_roles;

-- Create new policy that allows user self-registration for non-admin roles
CREATE POLICY "Users can insert their own non-admin roles" 
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role IN ('customer', 'restaurant', 'delivery_partner')
);

-- Keep superadmin management policy (drop first if exists to avoid duplicates)
DROP POLICY IF EXISTS "Superadmins can manage all roles" ON public.user_roles;
CREATE POLICY "Superadmins can manage all roles" 
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::user_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::user_role));

-- Phase 3: Add Shop Support - Step 1: Add enum value FIRST
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'shop' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role ADD VALUE 'shop';
  END IF;
END $$;

-- Commit the enum value addition before proceeding
COMMIT;

-- Phase 3: Add Shop Support - Step 2: Now we can use the new enum value
-- Add business_type to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS business_type text DEFAULT 'restaurant'
  CHECK (business_type IN ('restaurant', 'shop', 'convenience_store'));

-- Create shop_categories table
CREATE TABLE IF NOT EXISTS shop_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS for shop_categories
ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shop categories" 
ON shop_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage shop categories" 
ON shop_categories FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

-- Insert default shop categories
INSERT INTO shop_categories (name, description, icon, display_order) VALUES
  ('Groceries', 'Fresh produce, dairy, meat', 'shopping-basket', 1),
  ('Household', 'Cleaning, toiletries, home essentials', 'home', 2),
  ('Snacks & Drinks', 'Beverages, chips, candy', 'coffee', 3),
  ('Personal Care', 'Beauty, hygiene, wellness', 'sparkles', 4),
  ('General', 'Miscellaneous items', 'package', 5)
ON CONFLICT DO NOTHING;

-- Update menu_items to support shop products
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'food'
  CHECK (product_type IN ('food', 'grocery', 'household', 'general'));
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS barcode text;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS quantity_in_stock integer;

-- Phase 4: Enable Store Collection (Pickup)
-- Add fulfillment_type to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_type text DEFAULT 'delivery'
  CHECK (fulfillment_type IN ('delivery', 'pickup'));

-- Add pickup-related fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_time timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_code text;

-- Add pickup support fields to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS pickup_instructions text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS supports_pickup boolean DEFAULT true;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS supports_delivery boolean DEFAULT true;

-- Update RLS policy to allow shop role
DROP POLICY IF EXISTS "Users can insert their own non-admin roles" ON public.user_roles;
CREATE POLICY "Users can insert their own non-admin roles" 
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role::text IN ('customer', 'restaurant', 'delivery_partner', 'shop')
);