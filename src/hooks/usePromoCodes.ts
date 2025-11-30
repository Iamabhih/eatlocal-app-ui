import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  start_date: string;
  end_date: string;
  usage_limit: number | null;
  usage_count: number | null;
  per_user_limit: number | null;
  restaurant_ids: string[] | null;
  applicable_to: string | null;
  is_active: boolean | null;
  created_at: string | null;
  created_by: string | null;
}

export interface PromoValidationResult {
  valid: boolean;
  promoCode: PromoCode | null;
  discountAmount: number;
  errorMessage?: string;
}

export interface ApplyPromoParams {
  code: string;
  orderTotal: number;
  restaurantId?: string;
  serviceType?: 'food' | 'hotel' | 'venue' | 'ride';
}

/**
 * Hook to validate and apply a promo code
 */
export function useValidatePromoCode() {
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      code,
      orderTotal,
      restaurantId,
      serviceType = 'food',
    }: ApplyPromoParams): Promise<PromoValidationResult> => {
      const normalizedCode = code.trim().toUpperCase();

      if (!normalizedCode) {
        return {
          valid: false,
          promoCode: null,
          discountAmount: 0,
          errorMessage: 'Please enter a promo code',
        };
      }

      // Fetch the promo code
      const { data: promoCode, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', normalizedCode)
        .eq('is_active', true)
        .single();

      if (error || !promoCode) {
        return {
          valid: false,
          promoCode: null,
          discountAmount: 0,
          errorMessage: 'Invalid promo code',
        };
      }

      // Check if promo code is within valid date range
      const now = new Date();
      const startDate = new Date(promoCode.start_date);
      const endDate = new Date(promoCode.end_date);

      if (now < startDate) {
        return {
          valid: false,
          promoCode: null,
          discountAmount: 0,
          errorMessage: 'This promo code is not yet active',
        };
      }

      if (now > endDate) {
        return {
          valid: false,
          promoCode: null,
          discountAmount: 0,
          errorMessage: 'This promo code has expired',
        };
      }

      // Check minimum order amount
      if (promoCode.min_order_amount && orderTotal < promoCode.min_order_amount) {
        return {
          valid: false,
          promoCode: null,
          discountAmount: 0,
          errorMessage: `Minimum order of R${promoCode.min_order_amount.toFixed(2)} required`,
        };
      }

      // Check global usage limit
      if (promoCode.usage_limit && (promoCode.usage_count || 0) >= promoCode.usage_limit) {
        return {
          valid: false,
          promoCode: null,
          discountAmount: 0,
          errorMessage: 'This promo code has reached its usage limit',
        };
      }

      // Check per-user limit
      if (user && promoCode.per_user_limit) {
        const { count } = await supabase
          .from('promo_code_usage')
          .select('*', { count: 'exact', head: true })
          .eq('promo_code_id', promoCode.id)
          .eq('user_id', user.id);

        if ((count || 0) >= promoCode.per_user_limit) {
          return {
            valid: false,
            promoCode: null,
            discountAmount: 0,
            errorMessage: `You've already used this promo code ${promoCode.per_user_limit} time(s)`,
          };
        }
      }

      // Check restaurant restriction
      if (promoCode.restaurant_ids && promoCode.restaurant_ids.length > 0 && restaurantId) {
        if (!promoCode.restaurant_ids.includes(restaurantId)) {
          return {
            valid: false,
            promoCode: null,
            discountAmount: 0,
            errorMessage: 'This promo code is not valid for this restaurant',
          };
        }
      }

      // Check applicable service type
      if (promoCode.applicable_to && promoCode.applicable_to !== 'all') {
        const applicableTypes = promoCode.applicable_to.split(',');
        if (!applicableTypes.includes(serviceType)) {
          return {
            valid: false,
            promoCode: null,
            discountAmount: 0,
            errorMessage: `This promo code is not valid for ${serviceType} orders`,
          };
        }
      }

      // Calculate discount
      let discountAmount: number;
      if (promoCode.discount_type === 'percentage') {
        discountAmount = orderTotal * (promoCode.discount_value / 100);
      } else {
        discountAmount = promoCode.discount_value;
      }

      // Apply max discount cap
      if (promoCode.max_discount_amount && discountAmount > promoCode.max_discount_amount) {
        discountAmount = promoCode.max_discount_amount;
      }

      // Ensure discount doesn't exceed order total
      if (discountAmount > orderTotal) {
        discountAmount = orderTotal;
      }

      return {
        valid: true,
        promoCode: promoCode as PromoCode,
        discountAmount,
      };
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to validate promo code',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to record promo code usage after order completion
 */
export function useRecordPromoUsage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      promoCodeId,
      orderId,
      discountAmount,
    }: {
      promoCodeId: string;
      orderId: string;
      discountAmount: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Record the usage
      const { error: usageError } = await supabase
        .from('promo_code_usage')
        .insert({
          promo_code_id: promoCodeId,
          user_id: user.id,
          order_id: orderId,
          discount_applied: discountAmount,
        });

      if (usageError) throw usageError;

      // Manual increment of usage count
      const { data: currentPromo } = await supabase
        .from('promo_codes')
        .select('usage_count')
        .eq('id', promoCodeId)
        .single();

      await supabase
        .from('promo_codes')
        .update({
          usage_count: (currentPromo?.usage_count || 0) + 1,
        })
        .eq('id', promoCodeId);

      return true;
    },
  });
}

/**
 * Hook to get available promo codes for a user
 */
export function useAvailablePromoCodes(restaurantId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['available-promo-codes', user?.id, restaurantId],
    queryFn: async () => {
      const now = new Date().toISOString();

      let query = supabase
        .from('promo_codes')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);

      // Filter by restaurant if provided
      if (restaurantId) {
        query = query.or(`restaurant_ids.is.null,restaurant_ids.cs.{${restaurantId}}`);
      }

      const { data, error } = await query.order('discount_value', { ascending: false });

      if (error) throw error;

      // Filter out codes that have reached usage limit
      const availableCodes = (data || []).filter((code) => {
        if (code.usage_limit && (code.usage_count || 0) >= code.usage_limit) {
          return false;
        }
        return true;
      });

      // If user is logged in, filter out codes they've exceeded per-user limit
      if (user) {
        const { data: usageData } = await supabase
          .from('promo_code_usage')
          .select('promo_code_id')
          .eq('user_id', user.id);

        const userUsageCount = (usageData || []).reduce((acc, usage) => {
          acc[usage.promo_code_id] = (acc[usage.promo_code_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return availableCodes.filter((code) => {
          if (!code.per_user_limit) return true;
          const used = userUsageCount[code.id] || 0;
          return used < code.per_user_limit;
        });
      }

      return availableCodes as PromoCode[];
    },
    enabled: true,
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Hook to get user's promo code usage history
 */
export function usePromoCodeHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['promo-code-history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('promo_code_usage')
        .select(`
          *,
          promo_code:promo_codes(code, description, discount_type, discount_value),
          order:orders(order_number, total, created_at)
        `)
        .eq('user_id', user.id)
        .order('used_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

/**
 * Admin hook to create promo codes
 */
export function useCreatePromoCode() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promoCode: Omit<PromoCode, 'id' | 'created_at' | 'usage_count' | 'created_by'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('promo_codes')
        .insert({
          ...promoCode,
          code: promoCode.code.toUpperCase(),
          created_by: user.id,
          usage_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast({
        title: 'Promo Code Created',
        description: 'The promo code has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Admin hook to update promo codes
 */
export function useUpdatePromoCode() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PromoCode> }) => {
      const { data, error } = await supabase
        .from('promo_codes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast({
        title: 'Promo Code Updated',
        description: 'The promo code has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Admin hook to get all promo codes
 */
export function useAdminPromoCodes() {
  return useQuery({
    queryKey: ['promo-codes', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PromoCode[];
    },
  });
}

/**
 * Admin hook to delete/deactivate promo codes
 */
export function useDeactivatePromoCode() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promo_codes')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast({
        title: 'Promo Code Deactivated',
        description: 'The promo code has been deactivated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Deactivate',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Format discount for display
 */
export function formatDiscount(promoCode: PromoCode): string {
  if (promoCode.discount_type === 'percentage') {
    return `${promoCode.discount_value}% off`;
  }
  return `R${promoCode.discount_value.toFixed(2)} off`;
}

/**
 * Get promo code status
 */
export function getPromoCodeStatus(promoCode: PromoCode): 'active' | 'expired' | 'scheduled' | 'exhausted' | 'inactive' {
  if (!promoCode.is_active) return 'inactive';

  const now = new Date();
  const startDate = new Date(promoCode.start_date);
  const endDate = new Date(promoCode.end_date);

  if (now < startDate) return 'scheduled';
  if (now > endDate) return 'expired';
  if (promoCode.usage_limit && (promoCode.usage_count || 0) >= promoCode.usage_limit) return 'exhausted';

  return 'active';
}
