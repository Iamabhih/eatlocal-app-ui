import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserWallet { id: string; user_id: string; balance: number; currency: string; created_at: string; updated_at: string; }
export interface WalletTransaction { id: string; wallet_id: string; type: 'credit' | 'debit' | 'refund' | 'promo' | 'referral'; amount: number; description: string | null; reference_id: string | null; reference_type: string | null; balance_after: number; created_at: string; }

export function useUserWallet() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-wallet', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase as any).from('user_wallets').select('*').eq('user_id', user.id).single();
      if (error) { if (error.code === 'PGRST116') return { id: '', user_id: user.id, balance: 0, currency: 'ZAR', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as UserWallet; throw error; }
      return data as UserWallet;
    },
    enabled: !!user,
  });
}

export function useWalletTransactions(limit = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['wallet-transactions', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      const { data: walletData } = await (supabase as any).from('user_wallets').select('id').eq('user_id', user.id).single();
      if (!walletData) return [];
      const { data, error } = await (supabase as any).from('wallet_transactions').select('*').eq('wallet_id', walletData.id).order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!user,
  });
}

export function useWalletPayment() {
  const { user } = useAuth(); const { toast } = useToast(); const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ amount, description, referenceId, referenceType }: { amount: number; description?: string; referenceId?: string; referenceType?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: wallet, error: walletError } = await (supabase as any).from('user_wallets').select('id, balance').eq('user_id', user.id).gte('balance', amount).single();
      if (walletError) { if (walletError.code === 'PGRST116') throw new Error('Insufficient wallet balance'); throw walletError; }
      const newBalance = wallet.balance - amount;
      const { data: updated, error: updateError } = await (supabase as any).from('user_wallets').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', wallet.id).eq('balance', wallet.balance).select('balance').single();
      if (updateError) { if (updateError.code === 'PGRST116') throw new Error('Transaction failed - please try again'); throw updateError; }
      await (supabase as any).from('wallet_transactions').insert({ wallet_id: wallet.id, type: 'debit', amount: -amount, description: description || 'Payment', reference_id: referenceId, reference_type: referenceType, balance_after: updated.balance });
      return { amountPaid: amount, newBalance: updated.balance };
    },
    onSuccess: ({ amountPaid }) => { queryClient.invalidateQueries({ queryKey: ['user-wallet'] }); queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] }); toast({ title: 'Payment Successful', description: `R${amountPaid.toFixed(2)} paid from your wallet.` }); },
    onError: (error: Error) => { toast({ title: 'Payment Failed', description: error.message, variant: 'destructive' }); },
  });
}

export function useAddWalletCredits() {
  const { user } = useAuth(); const { toast } = useToast(); const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ amount, type, description, referenceId, referenceType }: { amount: number; type: 'credit' | 'refund' | 'promo' | 'referral'; description?: string; referenceId?: string; referenceType?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: existingWallet, error: fetchError } = await (supabase as any).from('user_wallets').select('id, balance').eq('user_id', user.id).single();
      let walletId: string; let currentBalance: number;
      if (fetchError && fetchError.code === 'PGRST116') {
        const { data: newWallet, error: createError } = await (supabase as any).from('user_wallets').insert({ user_id: user.id, balance: amount }).select('id, balance').single();
        if (createError) throw createError;
        walletId = newWallet.id; currentBalance = newWallet.balance;
      } else if (fetchError) { throw fetchError; }
      else {
        const newBalance = existingWallet.balance + amount;
        const { data: updated, error: updateError } = await (supabase as any).from('user_wallets').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', existingWallet.id).eq('balance', existingWallet.balance).select('id, balance').single();
        if (updateError) { if (updateError.code === 'PGRST116') throw new Error('Transaction failed - please try again'); throw updateError; }
        walletId = updated.id; currentBalance = updated.balance;
      }
      await (supabase as any).from('wallet_transactions').insert({ wallet_id: walletId, type, amount, description: description || getDefaultDescription(type), reference_id: referenceId, reference_type: referenceType, balance_after: currentBalance });
      return { amountAdded: amount, newBalance: currentBalance };
    },
    onSuccess: ({ amountAdded }) => { queryClient.invalidateQueries({ queryKey: ['user-wallet'] }); queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] }); toast({ title: 'Credits Added', description: `R${amountAdded.toFixed(2)} has been added to your wallet.` }); },
    onError: (error: Error) => { toast({ title: 'Failed to Add Credits', description: error.message, variant: 'destructive' }); },
  });
}

function getDefaultDescription(type: string): string {
  switch (type) { case 'refund': return 'Order refund'; case 'promo': return 'Promotional credit'; case 'referral': return 'Referral bonus'; default: return 'Credit added'; }
}

export function formatWalletAmount(amount: number, currency = 'ZAR'): string {
  if (currency === 'ZAR') return `R${amount.toFixed(2)}`;
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(amount);
}

export function getTransactionDisplay(type: WalletTransaction['type']): { icon: string; color: string; label: string } {
  switch (type) {
    case 'credit': return { icon: '💳', color: 'text-green-600', label: 'Credit' };
    case 'debit': return { icon: '🛒', color: 'text-red-600', label: 'Payment' };
    case 'refund': return { icon: '↩️', color: 'text-blue-600', label: 'Refund' };
    case 'promo': return { icon: '🎁', color: 'text-purple-600', label: 'Promo' };
    case 'referral': return { icon: '👥', color: 'text-orange-600', label: 'Referral' };
    default: return { icon: '💰', color: 'text-gray-600', label: 'Transaction' };
  }
}
