import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SavedPaymentMethod {
  id: string;
  user_id: string;
  card_type: 'visa' | 'mastercard' | 'amex' | 'other';
  last_four: string;
  expiry_month: number;
  expiry_year: number;
  cardholder_name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentMethodInput {
  card_type: SavedPaymentMethod['card_type'];
  last_four: string;
  expiry_month: number;
  expiry_year: number;
  cardholder_name: string;
  is_default?: boolean;
}

// Hook to fetch saved payment methods for the current user
export function useSavedPaymentMethods() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['saved-payment-methods', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('saved_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedPaymentMethod[];
    },
    enabled: !!user,
  });
}

// Hook to add a new payment method
export function useAddPaymentMethod() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePaymentMethodInput) => {
      if (!user) throw new Error('Not authenticated');

      // If setting as default, clear other defaults first
      if (input.is_default) {
        await supabase
          .from('saved_payment_methods')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('saved_payment_methods')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-payment-methods'] });
      toast({
        title: 'Payment Method Added',
        description: 'Your card has been saved securely.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Add Card',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to delete a payment method
export function useDeletePaymentMethod() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const { error } = await supabase
        .from('saved_payment_methods')
        .delete()
        .eq('id', paymentMethodId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-payment-methods'] });
      toast({
        title: 'Card Removed',
        description: 'Your payment method has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Remove Card',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to set a payment method as default
export function useSetDefaultPaymentMethod() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentMethodId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Clear all defaults first
      await supabase
        .from('saved_payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set the new default
      const { error } = await supabase
        .from('saved_payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-payment-methods'] });
      toast({
        title: 'Default Card Updated',
        description: 'Your default payment method has been changed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Default',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Helper to get card brand icon
export function getCardBrandIcon(cardType: SavedPaymentMethod['card_type']): string {
  switch (cardType) {
    case 'visa':
      return '💳 Visa';
    case 'mastercard':
      return '💳 Mastercard';
    case 'amex':
      return '💳 Amex';
    default:
      return '💳 Card';
  }
}

// Helper to format expiry date
export function formatExpiryDate(month: number, year: number): string {
  return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
}
