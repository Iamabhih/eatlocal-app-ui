import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'orders' | 'reviews' | 'referrals' | 'loyalty' | 'explorer' | 'social' | 'special';
  requirement_type: string;
  requirement_value: number;
  requirement_period: string | null;
  reward_type: 'points' | 'credit' | 'badge' | 'discount' | 'free_delivery' | null;
  reward_value: number | null;
  icon: string | null;
  badge_image_url: string | null;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  is_secret: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  current_progress: number;
  earned_at: string | null;
  reward_claimed: boolean;
  reward_claimed_at: string | null;
  achievement?: Achievement;
}

export interface LeaderboardEntry {
  user_id: string;
  score: number;
  rank: number;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

// Rarity colors for display
export const RARITY_COLORS = {
  common: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  uncommon: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-400' },
  rare: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400' },
  epic: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-400' },
  legendary: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400' },
};

/**
 * Get all achievements
 */
export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        if (error.code === '42P01') return []; // Table doesn't exist yet
        throw error;
      }

      return data as Achievement[];
    },
  });
}

/**
 * Get user's achievement progress
 */
export function useUserAchievements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id);

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as UserAchievement[];
    },
    enabled: !!user,
  });
}

/**
 * Get achievements with user progress combined
 */
export function useAchievementsWithProgress() {
  const { data: achievements, isLoading: achievementsLoading } = useAchievements();
  const { data: userAchievements, isLoading: userLoading } = useUserAchievements();

  const combined = achievements?.map(achievement => {
    const userProgress = userAchievements?.find(ua => ua.achievement_id === achievement.id);
    return {
      ...achievement,
      progress: userProgress?.current_progress || 0,
      earned: !!userProgress?.earned_at,
      earnedAt: userProgress?.earned_at,
      rewardClaimed: userProgress?.reward_claimed || false,
    };
  });

  // Group by category
  const byCategory = combined?.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, typeof combined>);

  return {
    achievements: combined || [],
    byCategory: byCategory || {},
    isLoading: achievementsLoading || userLoading,
    earnedCount: combined?.filter(a => a.earned).length || 0,
    totalCount: combined?.length || 0,
  };
}

/**
 * Check and update achievements for current user
 */
export function useCheckAchievements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });

      // Show toast for newly earned achievements
      if (data?.newly_earned?.length > 0) {
        toast({
          title: '🏆 Achievement Unlocked!',
          description: `You earned ${data.newly_earned.length} new achievement(s)!`,
        });
      }
    },
  });
}

/**
 * Claim achievement reward
 */
export function useClaimAchievementReward() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (achievementId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Get the achievement details
      const { data: userAchievement, error: fetchError } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', user.id)
        .eq('achievement_id', achievementId)
        .single();

      if (fetchError) throw fetchError;
      if (!userAchievement.earned_at) throw new Error('Achievement not earned yet');
      if (userAchievement.reward_claimed) throw new Error('Reward already claimed');

      const achievement = userAchievement.achievement;

      // Apply reward based on type
      if (achievement.reward_type === 'credit' && achievement.reward_value) {
        // Add wallet credit
        const { data: wallet } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (wallet) {
          await supabase.from('wallet_transactions').insert({
            wallet_id: wallet.id,
            amount: achievement.reward_value,
            type: 'credit',
            description: `Achievement reward: ${achievement.name}`,
            reference_type: 'achievement',
            reference_id: achievementId,
          });

          await supabase
            .from('wallets')
            .update({ balance: supabase.rpc('increment', { x: achievement.reward_value }) })
            .eq('id', wallet.id);
        }
      } else if (achievement.reward_type === 'points' && achievement.reward_value) {
        // Add loyalty points
        await supabase
          .from('loyalty_points')
          .insert({
            user_id: user.id,
            points: achievement.reward_value,
            action: 'achievement_reward',
            description: `Achievement: ${achievement.name}`,
          });
      }

      // Mark reward as claimed
      const { error: updateError } = await supabase
        .from('user_achievements')
        .update({
          reward_claimed: true,
          reward_claimed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('achievement_id', achievementId);

      if (updateError) throw updateError;

      return { achievement, rewardValue: achievement.reward_value };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty'] });

      toast({
        title: 'Reward Claimed! 🎁',
        description: `You received ${data.achievement.reward_type === 'credit' ? 'R' : ''}${data.rewardValue} ${data.achievement.reward_type}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Claim Reward',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get leaderboard
 */
export function useLeaderboard(
  type: 'orders' | 'reviews' | 'referrals' | 'spending' | 'points' = 'orders',
  period: 'weekly' | 'monthly' | 'all_time' = 'monthly'
) {
  return useQuery({
    queryKey: ['leaderboard', type, period],
    queryFn: async () => {
      // Get latest snapshot for this type/period
      const { data: snapshot, error } = await supabase
        .from('leaderboard_snapshots')
        .select('rankings')
        .eq('leaderboard_type', type)
        .eq('period_type', period)
        .order('period_start', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST116') {
          return []; // Table doesn't exist or no data
        }
        throw error;
      }

      const rankings = (snapshot?.rankings || []) as LeaderboardEntry[];

      // Fetch profile info for top entries
      if (rankings.length > 0) {
        const userIds = rankings.slice(0, 50).map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));

        return rankings.map(r => ({
          ...r,
          profile: profileMap.get(r.user_id),
        }));
      }

      return rankings;
    },
  });
}

/**
 * Get user's rank on leaderboard
 */
export function useUserLeaderboardRank(
  type: 'orders' | 'reviews' | 'referrals' | 'spending' | 'points' = 'orders'
) {
  const { user } = useAuth();
  const { data: leaderboard } = useLeaderboard(type, 'monthly');

  if (!user || !leaderboard) {
    return { rank: null, score: null };
  }

  const userEntry = leaderboard.find(e => e.user_id === user.id);
  return {
    rank: userEntry?.rank || null,
    score: userEntry?.score || null,
  };
}

/**
 * Get achievement stats summary
 */
export function useAchievementStats() {
  const { achievements, earnedCount, totalCount } = useAchievementsWithProgress();

  const byRarity = achievements.reduce((acc, a) => {
    if (!acc[a.rarity]) {
      acc[a.rarity] = { total: 0, earned: 0 };
    }
    acc[a.rarity].total++;
    if (a.earned) acc[a.rarity].earned++;
    return acc;
  }, {} as Record<string, { total: number; earned: number }>);

  const totalPoints = achievements
    .filter(a => a.earned && a.reward_type === 'points')
    .reduce((sum, a) => sum + (a.reward_value || 0), 0);

  const totalCredits = achievements
    .filter(a => a.earned && a.reward_type === 'credit')
    .reduce((sum, a) => sum + (a.reward_value || 0), 0);

  return {
    earnedCount,
    totalCount,
    completionPercentage: totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0,
    byRarity,
    totalPoints,
    totalCredits,
  };
}
