import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string | null;
  customer_id: string | null;
  corporate_id: string | null;
  line_items: LineItem[];
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  tax_number: string | null;
  business_name: string | null;
  billing_address: Record<string, any> | null;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  due_date: string | null;
  paid_at: string | null;
  pdf_url: string | null;
  created_at: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  category: string;
  region: string;
  is_default: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  free_deliveries_used: number;
  plan?: SubscriptionPlan;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  plan_type: 'customer' | 'restaurant' | 'driver';
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  free_deliveries_per_month: number;
  discount_percentage: number;
  priority_support: boolean;
}

/**
 * Get user's invoices
 */
export function useInvoices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as Invoice[];
    },
    enabled: !!user,
  });
}

/**
 * Get a single invoice
 */
export function useInvoice(invoiceId: string) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          order:orders(order_number, restaurant:restaurants(name))
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });
}

/**
 * Generate invoice for an order
 */
export function useGenerateInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      taxNumber,
      businessName,
      billingAddress,
    }: {
      orderId: string;
      taxNumber?: string;
      businessName?: string;
      billingAddress?: Record<string, any>;
    }) => {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*, menu_item:menu_items(name, price))
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Generate invoice number
      const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number');

      // Calculate tax
      const taxRate = 0.15; // 15% VAT
      const subtotal = order.subtotal || order.total - (order.delivery_fee || 0) - (order.service_fee || 0);
      const taxAmount = subtotal * taxRate;

      // Create line items from order items
      const lineItems = order.order_items?.map((item: any) => ({
        description: item.menu_item?.name || 'Item',
        quantity: item.quantity,
        unit_price: item.unit_price || item.menu_item?.price || 0,
        total: (item.unit_price || item.menu_item?.price || 0) * item.quantity,
      })) || [];

      // Create invoice
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber || `INV-${Date.now()}`,
          order_id: orderId,
          customer_id: order.customer_id,
          line_items: lineItems,
          subtotal,
          delivery_fee: order.delivery_fee || 0,
          service_fee: order.service_fee || 0,
          discount_amount: order.discount_amount || 0,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total: order.total,
          tax_number: taxNumber,
          business_name: businessName,
          billing_address: billingAddress,
          status: 'sent',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Invoice Generated',
        description: 'Your invoice has been created and sent.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Generate Invoice',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get available subscription plans
 */
export function useSubscriptionPlans(planType?: 'customer' | 'restaurant' | 'driver') {
  return useQuery({
    queryKey: ['subscription-plans', planType],
    queryFn: async () => {
      let query = supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (planType) {
        query = query.eq('plan_type', planType);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as SubscriptionPlan[];
    },
  });
}

/**
 * Get user's active subscription
 */
export function useMySubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') return null;
        throw error;
      }

      return data as Subscription;
    },
    enabled: !!user,
  });
}

/**
 * Subscribe to a plan
 */
export function useSubscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      billingCycle,
    }: {
      planId: string;
      billingCycle: 'monthly' | 'yearly';
    }) => {
      if (!user) throw new Error('Not authenticated');

      const now = new Date();
      const periodEnd = new Date(now);
      if (billingCycle === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: planId,
          billing_cycle: billingCycle,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          next_payment_at: periodEnd.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      toast({
        title: 'Subscription Activated',
        description: 'Welcome to your new plan!',
      });
    },
  });
}

/**
 * Cancel subscription
 */
export function useCancelSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: true,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will end at the current period.',
      });
    },
  });
}

/**
 * Get tax rates
 */
export function useTaxRates(category?: string) {
  return useQuery({
    queryKey: ['tax-rates', category],
    queryFn: async () => {
      let query = supabase
        .from('tax_rates')
        .select('*')
        .lte('effective_from', new Date().toISOString())
        .or('effective_to.is.null,effective_to.gte.' + new Date().toISOString());

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as TaxRate[];
    },
  });
}

/**
 * Check if user has active subscription benefits
 */
export function useSubscriptionBenefits() {
  const { data: subscription } = useMySubscription();

  if (!subscription || subscription.status !== 'active') {
    return {
      hasSubscription: false,
      freeDeliveriesRemaining: 0,
      discountPercentage: 0,
      hasPrioritySupport: false,
    };
  }

  const plan = subscription.plan;
  const freeDeliveriesRemaining = Math.max(
    0,
    (plan?.free_deliveries_per_month || 0) - subscription.free_deliveries_used
  );

  return {
    hasSubscription: true,
    freeDeliveriesRemaining,
    discountPercentage: plan?.discount_percentage || 0,
    hasPrioritySupport: plan?.priority_support || false,
    planName: plan?.name,
    currentPeriodEnd: subscription.current_period_end,
    willCancel: subscription.cancel_at_period_end,
  };
}
