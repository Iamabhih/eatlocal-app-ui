import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PendingRestaurant {
  id: string;
  name: string;
  owner_id: string;
  cuisine_type: string | null;
  street_address: string;
  city: string;
  state: string;
  phone: string;
  email: string | null;
  approval_status: string;
  approval_notes: string | null;
  created_at: string;
  owner?: {
    email: string;
  };
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

// Hook to fetch restaurants pending approval
export function usePendingRestaurants() {
  return useQuery({
    queryKey: ['pending-restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          profiles:owner_id (
            email
          )
        `)
        .in('approval_status', ['pending', 'rejected'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PendingRestaurant[];
    },
  });
}

// Hook to fetch all restaurants with approval status
export function useRestaurantsByApprovalStatus(status?: ApprovalStatus) {
  return useQuery({
    queryKey: ['restaurants-by-status', status],
    queryFn: async () => {
      let query = supabase
        .from('restaurants')
        .select(`
          *,
          profiles:owner_id (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('approval_status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

// Hook to approve a restaurant
export function useApproveRestaurant() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          approval_status: 'approved',
          approval_notes: notes || 'Approved',
          approved_at: new Date().toISOString(),
          is_active: true,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log admin action - skip if no user context
      // Activity logging handled separately

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });

      toast({
        title: 'Restaurant Approved',
        description: `${data.name} has been approved and is now active.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to reject a restaurant
export function useRejectRestaurant() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          approval_status: 'rejected',
          approval_notes: reason,
          is_active: false,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Activity logging handled separately

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });

      toast({
        title: 'Restaurant Rejected',
        description: `${data.name} has been rejected.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Rejection Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to suspend a restaurant
export function useSuspendRestaurant() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          approval_status: 'suspended',
          approval_notes: reason,
          is_active: false,
          is_open: false,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Activity logging handled separately

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });

      toast({
        title: 'Restaurant Suspended',
        description: `${data.name} has been suspended.`,
        variant: 'destructive',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Suspension Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to reinstate a suspended restaurant
export function useReinstateRestaurant() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          approval_status: 'approved',
          approval_notes: 'Reinstated',
          is_active: true,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Activity logging handled separately

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });

      toast({
        title: 'Restaurant Reinstated',
        description: `${data.name} has been reinstated and is now active.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Reinstatement Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to update commission rate
export function useUpdateCommission() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, commissionRate }: { id: string; commissionRate: number }) => {
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          commission_rate: commissionRate,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Activity logging handled separately

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });

      toast({
        title: 'Commission Updated',
        description: `Commission rate for ${data.name} set to ${data.commission_rate}%`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook for order refunds
export function useProcessRefund() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      amount,
      reason,
      refundType,
    }: {
      orderId: string;
      amount: number;
      reason: string;
      refundType: 'full' | 'partial';
    }) => {
      // Update order status to cancelled (refund statuses not in enum)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: `Refund (${refundType}): ${reason}`,
        })
        .eq('id', orderId)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create refund record (if payments table exists)
      await supabase.from('payments').insert({
        order_id: orderId,
        amount: -amount,
        status: 'refunded',
        payment_method: 'refund',
        notes: reason,
      });

      // Activity logging handled separately

      return order;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.id] });

      toast({
        title: 'Refund Processed',
        description: `Order ${data.order_number} has been refunded.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Refund Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
