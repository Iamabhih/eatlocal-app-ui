import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAddWalletCredits } from '@/hooks/useWallet';

export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
export type RefundReason =
  | 'wrong_order'
  | 'missing_items'
  | 'quality_issue'
  | 'late_delivery'
  | 'never_received'
  | 'cancelled_by_restaurant'
  | 'other';

export interface RefundRequest {
  id: string;
  order_id: string;
  user_id: string;
  reason: RefundReason;
  description: string;
  amount_requested: number;
  amount_approved: number | null;
  status: RefundStatus;
  refund_method: 'wallet' | 'original_payment';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  order?: {
    order_number: string;
    total: number;
    status: string;
    created_at: string;
    restaurant: {
      name: string;
    };
  };
}

export const REFUND_REASONS: Record<RefundReason, { label: string; description: string }> = {
  wrong_order: {
    label: 'Wrong Order',
    description: 'I received a different order than what I ordered',
  },
  missing_items: {
    label: 'Missing Items',
    description: 'Some items were missing from my order',
  },
  quality_issue: {
    label: 'Quality Issue',
    description: 'The food quality was not acceptable',
  },
  late_delivery: {
    label: 'Late Delivery',
    description: 'The order arrived significantly later than expected',
  },
  never_received: {
    label: 'Never Received',
    description: 'I never received my order',
  },
  cancelled_by_restaurant: {
    label: 'Cancelled by Restaurant',
    description: 'The restaurant cancelled my order',
  },
  other: {
    label: 'Other',
    description: 'Other reason not listed above',
  },
};

/**
 * Hook to get user's refund requests
 */
export function useRefundRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['refund-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('refund_requests')
        .select(`
          *,
          order:orders(
            order_number,
            total,
            status,
            created_at,
            restaurant:restaurants(name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Table might not exist yet, return empty array
        if (error.code === '42P01') return [];
        throw error;
      }

      return (data || []) as RefundRequest[];
    },
    enabled: !!user,
  });
}

/**
 * Hook to get a single refund request by ID
 */
export function useRefundRequest(refundId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['refund-request', refundId],
    queryFn: async () => {
      if (!refundId) return null;

      const { data, error } = await supabase
        .from('refund_requests')
        .select(`
          *,
          order:orders(
            order_number,
            total,
            status,
            created_at,
            restaurant:restaurants(name)
          )
        `)
        .eq('id', refundId)
        .single();

      if (error) throw error;
      return data as RefundRequest;
    },
    enabled: !!refundId && !!user,
  });
}

/**
 * Hook to create a refund request
 */
export function useCreateRefundRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
      description,
      amountRequested,
      refundMethod = 'wallet',
    }: {
      orderId: string;
      reason: RefundReason;
      description: string;
      amountRequested: number;
      refundMethod?: 'wallet' | 'original_payment';
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Check if a refund request already exists for this order
      const { data: existing } = await supabase
        .from('refund_requests')
        .select('id, status')
        .eq('order_id', orderId)
        .eq('user_id', user.id)
        .not('status', 'eq', 'rejected')
        .single();

      if (existing) {
        throw new Error('A refund request already exists for this order');
      }

      // Verify order belongs to user and is eligible for refund
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, total, status, created_at')
        .eq('id', orderId)
        .eq('customer_id', user.id)
        .single();

      if (orderError) throw new Error('Order not found');

      // Check if order is within refund window (e.g., 7 days)
      const orderDate = new Date(order.created_at);
      const refundWindow = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (Date.now() - orderDate.getTime() > refundWindow) {
        throw new Error('This order is outside the refund window');
      }

      // Create refund request
      const { data, error } = await supabase
        .from('refund_requests')
        .insert({
          order_id: orderId,
          user_id: user.id,
          reason,
          description,
          amount_requested: amountRequested,
          refund_method: refundMethod,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
      toast({
        title: 'Refund Request Submitted',
        description: 'We\'ll review your request and get back to you within 24-48 hours.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Submit Request',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to cancel a pending refund request
 */
export function useCancelRefundRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (refundId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('refund_requests')
        .delete()
        .eq('id', refundId)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      return refundId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
      toast({
        title: 'Request Cancelled',
        description: 'Your refund request has been cancelled.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to Cancel',
        description: 'Could not cancel the refund request.',
        variant: 'destructive',
      });
    },
  });
}

// =============== ADMIN HOOKS ===============

/**
 * Admin hook to get all refund requests
 */
export function useAdminRefundRequests(status?: RefundStatus) {
  return useQuery({
    queryKey: ['admin-refund-requests', status],
    queryFn: async () => {
      let query = supabase
        .from('refund_requests')
        .select(`
          *,
          order:orders(
            order_number,
            total,
            status,
            created_at,
            restaurant:restaurants(name)
          ),
          user:profiles(full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as (RefundRequest & { user: { full_name: string; phone: string } })[];
    },
  });
}

/**
 * Admin hook to approve a refund
 */
export function useApproveRefund() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const addCredits = useAddWalletCredits();

  return useMutation({
    mutationFn: async ({
      refundId,
      approvedAmount,
      notes,
    }: {
      refundId: string;
      approvedAmount: number;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Get the refund request details
      const { data: refund, error: fetchError } = await supabase
        .from('refund_requests')
        .select('*, order:orders(total, customer_id)')
        .eq('id', refundId)
        .single();

      if (fetchError) throw fetchError;

      // Update refund status
      const { error: updateError } = await supabase
        .from('refund_requests')
        .update({
          status: 'approved',
          amount_approved: approvedAmount,
          admin_notes: notes,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq('id', refundId);

      if (updateError) throw updateError;

      // If refund method is wallet, credit the user's wallet
      if (refund.refund_method === 'wallet') {
        await addCredits.mutateAsync({
          amount: approvedAmount,
          type: 'refund',
          description: `Refund for order #${refund.order?.order_number || refund.order_id}`,
          referenceId: refund.order_id,
          referenceType: 'order_refund',
        });
      }

      return refundId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refund-requests'] });
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
      toast({
        title: 'Refund Approved',
        description: 'The refund has been processed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Process Refund',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Admin hook to reject a refund
 */
export function useRejectRefund() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      refundId,
      notes,
    }: {
      refundId: string;
      notes: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('refund_requests')
        .update({
          status: 'rejected',
          admin_notes: notes,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq('id', refundId);

      if (error) throw error;
      return refundId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refund-requests'] });
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
      toast({
        title: 'Refund Rejected',
        description: 'The refund request has been rejected.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to Reject',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get refund status display info
 */
export function getRefundStatusInfo(status: RefundStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'pending':
      return { label: 'Pending Review', color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
    case 'approved':
      return { label: 'Approved', color: 'text-green-700', bgColor: 'bg-green-100' };
    case 'rejected':
      return { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' };
    case 'processing':
      return { label: 'Processing', color: 'text-blue-700', bgColor: 'bg-blue-100' };
    case 'completed':
      return { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100' };
    default:
      return { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
  }
}

/**
 * Check if an order is eligible for refund
 */
export function isOrderEligibleForRefund(order: {
  status: string;
  created_at: string;
}): { eligible: boolean; reason?: string } {
  // Check order status
  const nonRefundableStatuses = ['pending', 'confirmed', 'preparing'];
  if (nonRefundableStatuses.includes(order.status)) {
    return {
      eligible: false,
      reason: 'Order is still being processed. Please cancel instead.',
    };
  }

  // Check refund window
  const orderDate = new Date(order.created_at);
  const refundWindow = 7 * 24 * 60 * 60 * 1000; // 7 days
  if (Date.now() - orderDate.getTime() > refundWindow) {
    return {
      eligible: false,
      reason: 'Refund window has expired (7 days after order)',
    };
  }

  return { eligible: true };
}
