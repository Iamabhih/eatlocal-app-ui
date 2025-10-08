-- Create delivery partner location tracking table
CREATE TABLE IF NOT EXISTS public.delivery_partner_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  heading NUMERIC(5, 2),
  speed NUMERIC(5, 2),
  accuracy NUMERIC(8, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_delivery_partner_locations_partner_id ON public.delivery_partner_locations(delivery_partner_id);
CREATE INDEX idx_delivery_partner_locations_order_id ON public.delivery_partner_locations(order_id);
CREATE INDEX idx_delivery_partner_locations_updated_at ON public.delivery_partner_locations(updated_at DESC);

-- Enable RLS
ALTER TABLE public.delivery_partner_locations ENABLE ROW LEVEL SECURITY;

-- Delivery partners can insert/update their own location
CREATE POLICY "Delivery partners can update their location"
ON public.delivery_partner_locations
FOR ALL
USING (auth.uid() = delivery_partner_id)
WITH CHECK (auth.uid() = delivery_partner_id);

-- Customers can view location of their order's delivery partner
CREATE POLICY "Customers can view their delivery partner location"
ON public.delivery_partner_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = delivery_partner_locations.order_id
    AND orders.customer_id = auth.uid()
  )
);

-- Restaurant owners can view location of delivery partners assigned to their orders
CREATE POLICY "Restaurant owners can view delivery partner location"
ON public.delivery_partner_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    JOIN public.restaurants ON restaurants.id = orders.restaurant_id
    WHERE orders.id = delivery_partner_locations.order_id
    AND restaurants.owner_id = auth.uid()
  )
);

-- Admins can view all locations
CREATE POLICY "Admins can view all locations"
ON public.delivery_partner_locations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Enable realtime for delivery partner locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_partner_locations;

-- Create trigger to update updated_at
CREATE TRIGGER update_delivery_partner_locations_updated_at
BEFORE UPDATE ON public.delivery_partner_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();