import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface LoyaltyTier {
  id: string;
  name: string;
  min_points: number;
  multiplier: number;
  benefits: string[];
  badge_color: string;
}

export interface UserLoyalty {
  id: string;
  user_id: string;
  total_points: number;
  current_points: number;
  tier_id: string;
  lifetime_orders: number;
  created_at: string;
  updated_at: string;
  tier?: LoyaltyTier;
}

export interface LoyaltyTransaction {
  id: string;
  type: 'earn' | 'redeem' | 'expire' | 'bonus';
  points: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

// Hook to get all loyalty tiers
export function useLoyaltyTiers() {
  return useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .order('min_points', { ascending: true });

      if (error) throw error;
      return data as LoyaltyTier[];
    },
  });
}

// Hook to get user's loyalty status
export function useUserLoyalty() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-loyalty', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_loyalty')
        .select(`
          *,
          tier:loyalty_tiers(*)
        `)
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no record exists, return default bronze status
        if (error.code === 'PGRST116') {
          return {
            id: '',
            user_id: user.id,
            total_points: 0,
            current_points: 0,
            tier_id: '',
            lifetime_orders: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tier: {
              id: '',
              name: 'Bronze',
              min_points: 0,
              multiplier: 1,
              benefits: ['Free delivery on first order'],
              badge_color: '#CD7F32',
            },
          } as UserLoyalty;
        }
        throw error;
      }

      return data as UserLoyalty;
    },
    enabled: !!user,
  });
}

// Hook to get user's loyalty transaction history
export function useLoyaltyTransactions(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['loyalty-transactions', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      // First get user's loyalty ID
      const { data: loyaltyData } = await supabase
        .from('user_loyalty')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!loyaltyData) return [];

      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_loyalty_id', loyaltyData.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as LoyaltyTransaction[];
    },
    enabled: !!user,
  });
}

// Hook to redeem loyalty points
export function useRedeemPoints() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ points, description }: { points: number; description?: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Get user's current loyalty data
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('user_loyalty')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (loyaltyError) throw loyaltyError;

      if (loyaltyData.current_points < points) {
        throw new Error('Insufficient points');
      }

      // Deduct points
      const { error: updateError } = await supabase
        .from('user_loyalty')
        .update({
          current_points: loyaltyData.current_points - points,
          updated_at: new Date().toISOString(),
        })
        .eq('id', loyaltyData.id);

      if (updateError) throw updateError;

      // Log transaction
      const { error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert({
          user_loyalty_id: loyaltyData.id,
          type: 'redeem',
          points: -points,
          description: description || 'Points redeemed',
        });

      if (transactionError) throw transactionError;

      return { pointsRedeemed: points };
    },
    onSuccess: ({ pointsRedeemed }) => {
      queryClient.invalidateQueries({ queryKey: ['user-loyalty'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
      toast({
        title: 'Points Redeemed!',
        description: `You've redeemed ${pointsRedeemed} points.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Redemption Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Calculate points for a given order total
export function calculatePointsForOrder(total: number, multiplier = 1): number {
  // 1 point per R10 spent
  return Math.floor((total / 10) * multiplier);
}

// Get progress to next tier
export function getProgressToNextTier(
  currentPoints: number,
  tiers: LoyaltyTier[]
): { nextTier: LoyaltyTier | null; pointsNeeded: number; progressPercent: number } {
  if (!tiers.length) {
    return { nextTier: null, pointsNeeded: 0, progressPercent: 100 };
  }

  // Sort tiers by min_points
  const sortedTiers = [...tiers].sort((a, b) => a.min_points - b.min_points);

  // Find current tier and next tier
  let currentTierIndex = 0;
  for (let i = 0; i < sortedTiers.length; i++) {
    if (currentPoints >= sortedTiers[i].min_points) {
      currentTierIndex = i;
    }
  }

  const nextTierIndex = currentTierIndex + 1;

  // If at max tier
  if (nextTierIndex >= sortedTiers.length) {
    return { nextTier: null, pointsNeeded: 0, progressPercent: 100 };
  }

  const currentTier = sortedTiers[currentTierIndex];
  const nextTier = sortedTiers[nextTierIndex];
  const pointsNeeded = nextTier.min_points - currentPoints;

  // Calculate progress within current tier range
  const tierRangeStart = currentTier.min_points;
  const tierRangeEnd = nextTier.min_points;
  const progressWithinRange = currentPoints - tierRangeStart;
  const rangeSize = tierRangeEnd - tierRangeStart;
  const progressPercent = Math.floor((progressWithinRange / rangeSize) * 100);

  return { nextTier, pointsNeeded, progressPercent };
}
