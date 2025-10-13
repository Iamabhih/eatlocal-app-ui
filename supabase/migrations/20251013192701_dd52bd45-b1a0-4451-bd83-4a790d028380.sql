-- Phase 2: Add Settlement Fee Tracking and Update Fee Calculations

-- Add settlement fee columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS settlement_fee numeric DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS net_restaurant_payout numeric DEFAULT 0.00 NOT NULL;

-- Add settlement fee column to delivery_earnings table
ALTER TABLE public.delivery_earnings
ADD COLUMN IF NOT EXISTS settlement_fee_amount numeric DEFAULT 0.00 NOT NULL;

-- Update calculate_order_commission function to include settlement fee
CREATE OR REPLACE FUNCTION public.calculate_order_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  restaurant_commission_rate numeric;
BEGIN
  -- Get the commission rate for this restaurant
  SELECT commission_rate INTO restaurant_commission_rate
  FROM public.restaurants
  WHERE id = NEW.restaurant_id;
  
  -- Calculate platform commission (15% on subtotal only)
  NEW.platform_commission := (NEW.subtotal * restaurant_commission_rate / 100);
  
  -- Calculate settlement fee (4.5% on total transaction including all fees)
  NEW.settlement_fee := (NEW.total * 4.5 / 100);
  
  -- Calculate net restaurant payout (what restaurant actually receives)
  -- Restaurant gets: subtotal - platform_commission - settlement_fee
  NEW.net_restaurant_payout := (NEW.subtotal - NEW.platform_commission - NEW.settlement_fee);
  
  RETURN NEW;
END;
$function$;

-- Update calculate_delivery_fees function to include settlement fee
CREATE OR REPLACE FUNCTION public.calculate_delivery_fees()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Calculate platform fee (15% of total earnings)
  NEW.platform_fee_amount := (NEW.total_earnings * NEW.platform_fee_rate / 100);
  
  -- Calculate settlement fee (4.5% of total earnings)
  NEW.settlement_fee_amount := (NEW.total_earnings * 4.5 / 100);
  
  -- Calculate net payout (what delivery partner actually receives)
  -- Partner gets: total_earnings - platform_fee - settlement_fee + tip (tip is separate)
  NEW.net_payout := NEW.total_earnings - NEW.platform_fee_amount - NEW.settlement_fee_amount;
  
  RETURN NEW;
END;
$function$;