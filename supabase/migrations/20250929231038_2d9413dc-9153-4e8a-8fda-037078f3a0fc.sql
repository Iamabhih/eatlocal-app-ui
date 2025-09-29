-- Phase 2: Monetization System Database Changes

-- Add commission tracking to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN commission_rate numeric DEFAULT 15.00 NOT NULL,
ADD COLUMN custom_commission boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN public.restaurants.commission_rate IS 'Percentage commission that platform takes from each order (default 15%)';
COMMENT ON COLUMN public.restaurants.custom_commission IS 'Whether this restaurant has a custom commission rate';

-- Add platform commission tracking to orders table
ALTER TABLE public.orders 
ADD COLUMN platform_commission numeric DEFAULT 0.00 NOT NULL;

COMMENT ON COLUMN public.orders.platform_commission IS 'Amount platform keeps as commission from this order';

-- Add delivery partner fee tracking to delivery_earnings table
ALTER TABLE public.delivery_earnings 
ADD COLUMN platform_fee_rate numeric DEFAULT 12.00 NOT NULL,
ADD COLUMN platform_fee_amount numeric DEFAULT 0.00 NOT NULL,
ADD COLUMN net_payout numeric DEFAULT 0.00 NOT NULL;

COMMENT ON COLUMN public.delivery_earnings.platform_fee_rate IS 'Percentage platform charges delivery partner (default 12%)';
COMMENT ON COLUMN public.delivery_earnings.platform_fee_amount IS 'Amount platform keeps from delivery earnings';
COMMENT ON COLUMN public.delivery_earnings.net_payout IS 'Net amount delivery partner receives after platform fee';

-- Create function to calculate platform commission on order
CREATE OR REPLACE FUNCTION public.calculate_order_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  restaurant_commission_rate numeric;
BEGIN
  -- Get the commission rate for this restaurant
  SELECT commission_rate INTO restaurant_commission_rate
  FROM public.restaurants
  WHERE id = NEW.restaurant_id;
  
  -- Calculate platform commission (commission on subtotal only, not delivery/tax/tip)
  NEW.platform_commission := (NEW.subtotal * restaurant_commission_rate / 100);
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-calculate commission on order insert/update
CREATE TRIGGER calculate_commission_on_order
BEFORE INSERT OR UPDATE OF subtotal, restaurant_id ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.calculate_order_commission();

-- Create function to calculate delivery partner fees
CREATE OR REPLACE FUNCTION public.calculate_delivery_fees()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calculate platform fee
  NEW.platform_fee_amount := (NEW.total_earnings * NEW.platform_fee_rate / 100);
  
  -- Calculate net payout
  NEW.net_payout := NEW.total_earnings - NEW.platform_fee_amount;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-calculate delivery fees
CREATE TRIGGER calculate_fees_on_delivery_earnings
BEFORE INSERT OR UPDATE OF total_earnings, platform_fee_rate ON public.delivery_earnings
FOR EACH ROW
EXECUTE FUNCTION public.calculate_delivery_fees();

-- Phase 4: Marketing Portal Database Tables

-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric DEFAULT 0.00,
  max_discount_amount numeric,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  per_user_limit integer DEFAULT 1,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  applicable_to text DEFAULT 'all' CHECK (applicable_to IN ('all', 'first_order', 'specific_restaurants')),
  restaurant_ids uuid[],
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create promo_code_usage table to track who used which codes
CREATE TABLE public.promo_code_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_applied numeric NOT NULL,
  used_at timestamp with time zone DEFAULT now()
);

-- Create marketing_campaigns table
CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  campaign_type text NOT NULL CHECK (campaign_type IN ('email', 'sms', 'push', 'banner')),
  target_audience text NOT NULL CHECK (target_audience IN ('all_customers', 'new_customers', 'inactive_customers', 'high_value_customers')),
  promo_code_id uuid REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create promotional_banners table
CREATE TABLE public.promotional_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  link_url text,
  link_type text CHECK (link_type IN ('restaurant', 'category', 'promo_code', 'external')),
  position text DEFAULT 'home_hero' CHECK (position IN ('home_hero', 'home_middle', 'restaurant_list', 'restaurant_detail')),
  display_order integer DEFAULT 0,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on marketing tables
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Authenticated users can view active promo codes"
ON public.promo_codes FOR SELECT
USING (is_active = true AND now() BETWEEN start_date AND end_date);

-- RLS Policies for promo_code_usage
CREATE POLICY "Admins can view all promo code usage"
ON public.promo_code_usage FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can view their own promo code usage"
ON public.promo_code_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert promo code usage"
ON public.promo_code_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for marketing_campaigns
CREATE POLICY "Admins can manage campaigns"
ON public.marketing_campaigns FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

-- RLS Policies for promotional_banners
CREATE POLICY "Admins can manage banners"
ON public.promotional_banners FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Anyone can view active banners"
ON public.promotional_banners FOR SELECT
USING (is_active = true AND now() BETWEEN start_date AND end_date);

-- Create indexes for performance
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_codes_active ON public.promo_codes(is_active, start_date, end_date);
CREATE INDEX idx_promo_code_usage_user ON public.promo_code_usage(user_id);
CREATE INDEX idx_promo_code_usage_promo ON public.promo_code_usage(promo_code_id);
CREATE INDEX idx_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX idx_banners_active ON public.promotional_banners(is_active, position, display_order);

-- Add triggers for updated_at columns
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.marketing_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.promotional_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();