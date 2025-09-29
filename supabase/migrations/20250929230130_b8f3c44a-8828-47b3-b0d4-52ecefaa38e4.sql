-- Create admin activity log table for audit trail
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin activity logs
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins and superadmins can view all activity logs
CREATE POLICY "Admins can view activity logs"
ON public.admin_activity_logs
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'superadmin')
);

-- Only authenticated users can insert activity logs
CREATE POLICY "System can insert activity logs"
ON public.admin_activity_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Admin RLS policies for viewing all data

-- Admins can view all restaurants
CREATE POLICY "Admins can view all restaurants"
ON public.restaurants
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'superadmin')
);

-- Admins can update restaurants
CREATE POLICY "Admins can update restaurants"
ON public.restaurants
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'superadmin')
);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'superadmin')
);

-- Admins can update all orders
CREATE POLICY "Admins can update all orders"
ON public.orders
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'superadmin')
);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'superadmin')
);

-- Admins can view all user roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'superadmin')
);

-- Superadmins can manage user roles
CREATE POLICY "Superadmins can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update user roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can delete user roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'superadmin'));

-- Admins can view all delivery earnings
CREATE POLICY "Admins can view all delivery earnings"
ON public.delivery_earnings
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'superadmin')
);

-- Admins can view all menu items
CREATE POLICY "Admins can view all menu items"
ON public.menu_items
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'superadmin')
);

-- Admins can view all menu categories
CREATE POLICY "Admins can view all menu categories"
ON public.menu_categories
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'superadmin')
);

-- Admins can view all customer addresses
CREATE POLICY "Admins can view all customer addresses"
ON public.customer_addresses
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'superadmin')
);