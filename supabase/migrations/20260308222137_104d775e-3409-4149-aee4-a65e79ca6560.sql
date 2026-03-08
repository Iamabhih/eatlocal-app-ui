
-- Menu Item Option Groups (e.g., "Size", "Toppings", "Extras")
CREATE TABLE public.menu_item_option_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  min_selections INTEGER DEFAULT 0,
  max_selections INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Menu Item Options (e.g., "Small +R0", "Large +R15", "Extra Cheese +R10")
CREATE TABLE public.menu_item_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_group_id UUID NOT NULL REFERENCES public.menu_item_option_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier NUMERIC NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order item selected options (tracks what customer chose)
CREATE TABLE public.order_item_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.menu_item_options(id),
  option_name TEXT NOT NULL,
  price_modifier NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_item_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_options ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view active option groups/options for available menu items
CREATE POLICY "Anyone can view active option groups"
  ON public.menu_item_option_groups FOR SELECT
  USING (is_active = true);

CREATE POLICY "Restaurant owners can manage option groups"
  ON public.menu_item_option_groups FOR ALL
  USING (EXISTS (
    SELECT 1 FROM menu_items mi
    JOIN restaurants r ON r.id = mi.restaurant_id
    WHERE mi.id = menu_item_option_groups.menu_item_id
    AND r.owner_id = auth.uid()
  ));

CREATE POLICY "Anyone can view available options"
  ON public.menu_item_options FOR SELECT
  USING (is_available = true);

CREATE POLICY "Restaurant owners can manage options"
  ON public.menu_item_options FOR ALL
  USING (EXISTS (
    SELECT 1 FROM menu_item_option_groups og
    JOIN menu_items mi ON mi.id = og.menu_item_id
    JOIN restaurants r ON r.id = mi.restaurant_id
    WHERE og.id = menu_item_options.option_group_id
    AND r.owner_id = auth.uid()
  ));

CREATE POLICY "Customers can view their order item options"
  ON public.order_item_options FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_options.order_item_id
    AND o.customer_id = auth.uid()
  ));

CREATE POLICY "Customers can insert order item options"
  ON public.order_item_options FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_options.order_item_id
    AND o.customer_id = auth.uid()
  ));

-- Add opening_hours JSONB to restaurants
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}';

-- Add full-text search index on restaurants
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(cuisine_type, '') || ' ' || coalesce(city, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_restaurants_search ON public.restaurants USING GIN (search_vector);

-- Add full-text search index on menu_items
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(brand, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_menu_items_search ON public.menu_items USING GIN (search_vector);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON public.orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON public.menu_items(restaurant_id, is_available);
CREATE INDEX IF NOT EXISTS idx_delivery_partner_locations_partner ON public.delivery_partner_locations(delivery_partner_id, updated_at DESC);
