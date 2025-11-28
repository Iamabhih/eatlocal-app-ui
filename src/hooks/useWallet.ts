import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserWallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: 'credit' | 'debit' | 'refund' | 'promo' | 'referral';
  amount: number;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  balance_after: number;
  created_at: string;
}

// Hook to get user's wallet
export function useUserWallet() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-wallet', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no wallet exists, return default
        if (error.code === 'PGRST116') {
          return {
            id: '',
            user_id: user.id,
            balance: 0,
            currency: 'ZAR',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as UserWallet;
        }
        throw error;
      }

      return data as UserWallet;
    },
    enabled: !!user,
  });
}

// Hook to get wallet transactions
export function useWalletTransactions(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wallet-transactions', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      // First get user's wallet ID
      const { data: walletData } = await supabase
        .from('user_wallets')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!walletData) return [];

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletData.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!user,
  });
}

// Hook to use wallet balance for payment
export function useWalletPayment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      description,
      referenceId,
      referenceType,
    }: {
      amount: number;
      description?: string;
      referenceId?: string;
      referenceType?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Get user's wallet
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;

      if (wallet.balance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      const newBalance = wallet.balance - amount;

      // Deduct from wallet
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Log transaction
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'debit',
          amount: -amount,
          description: description || 'Payment',
          reference_id: referenceId,
          reference_type: referenceType,
          balance_after: newBalance,
        });

      if (transactionError) throw transactionError;

      return { amountPaid: amount, newBalance };
    },
    onSuccess: ({ amountPaid }) => {
      queryClient.invalidateQueries({ queryKey: ['user-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      toast({
        title: 'Payment Successful',
        description: `R${amountPaid.toFixed(2)} paid from your wallet.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Payment Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to add credits to wallet (for refunds, promos, etc.)
export function useAddWalletCredits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      type,
      description,
      referenceId,
      referenceType,
    }: {
      amount: number;
      type: 'credit' | 'refund' | 'promo' | 'referral';
      description?: string;
      referenceId?: string;
      referenceType?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Get or create wallet
      let wallet = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (wallet.error && wallet.error.code === 'PGRST116') {
        // Create wallet if doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from('user_wallets')
          .insert({ user_id: user.id, balance: 0 })
          .select()
          .single();

        if (createError) throw createError;
        wallet = { data: newWallet, error: null };
      }

      if (wallet.error) throw wallet.error;

      const newBalance = wallet.data.balance + amount;

      // Add to wallet
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.data.id);

      if (updateError) throw updateError;

      // Log transaction
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.data.id,
          type,
          amount,
          description: description || getDefaultDescription(type),
          reference_id: referenceId,
          reference_type: referenceType,
          balance_after: newBalance,
        });

      if (transactionError) throw transactionError;

      return { amountAdded: amount, newBalance };
    },
    onSuccess: ({ amountAdded }) => {
      queryClient.invalidateQueries({ queryKey: ['user-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      toast({
        title: 'Credits Added',
        description: `R${amountAdded.toFixed(2)} has been added to your wallet.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Add Credits',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

function getDefaultDescription(type: string): string {
  switch (type) {
    case 'refund':
      return 'Order refund';
    case 'promo':
      return 'Promotional credit';
    case 'referral':
      return 'Referral bonus';
    default:
      return 'Credit added';
  }
}

// Format currency
export function formatWalletAmount(amount: number, currency = 'ZAR'): string {
  if (currency === 'ZAR') {
    return `R${amount.toFixed(2)}`;
  }
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Get transaction icon and color
export function getTransactionDisplay(type: WalletTransaction['type']): {
  icon: string;
  color: string;
  label: string;
} {
  switch (type) {
    case 'credit':
      return { icon: '💳', color: 'text-green-600', label: 'Credit' };
    case 'debit':
      return { icon: '🛒', color: 'text-red-600', label: 'Payment' };
    case 'refund':
      return { icon: '↩️', color: 'text-blue-600', label: 'Refund' };
    case 'promo':
      return { icon: '🎁', color: 'text-purple-600', label: 'Promo' };
    case 'referral':
      return { icon: '👥', color: 'text-orange-600', label: 'Referral' };
    default:
      return { icon: '💰', color: 'text-gray-600', label: 'Transaction' };
  }
}
