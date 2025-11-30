import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ReferralCode {
  code: string;
  userId: string;
  createdAt: string;
  totalReferrals: number;
  pendingRewards: number;
  totalRewardsEarned: number;
}

export interface ReferralReward {
  id: string;
  referrerId: string;
  referredId: string;
  status: 'pending' | 'credited' | 'expired';
  referrerReward: number;
  referredReward: number;
  createdAt: string;
  creditedAt: string | null;
}

const REFERRAL_REWARDS = {
  REFERRER: 50, // R50 for referrer
  REFERRED: 25, // R25 for new user
};

/**
 * Generate a unique referral code based on user ID
 */
function generateReferralCode(userId: string): string {
  // Take first 3 chars of user ID and add random suffix
  const prefix = userId.slice(0, 4).toUpperCase().replace(/-/g, '');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EAT${prefix}${suffix}`;
}

/**
 * Get or create user's referral code from database
 */
export function useReferralCode() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['referral-code', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Check if referral code exists in database
      const { data: existingCode, error: fetchError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (existingCode) {
        return {
          code: existingCode.code,
          userId: user.id,
          createdAt: existingCode.created_at,
          totalReferrals: existingCode.current_uses || 0,
          pendingRewards: 0,
          totalRewardsEarned: 0,
        } as ReferralCode;
      }

      // Generate new code and store in database
      const newCode = generateReferralCode(user.id);

      const { data: newCodeData, error: insertError } = await supabase
        .from('referral_codes')
        .insert({
          user_id: user.id,
          code: newCode,
          referrer_reward_type: 'credit',
          referrer_reward_value: REFERRAL_REWARDS.REFERRER,
          referee_reward_type: 'credit',
          referee_reward_value: REFERRAL_REWARDS.REFERRED,
          is_active: true,
        })
        .select()
        .single();

      // Also store in user metadata for backwards compatibility
      await supabase.auth.updateUser({
        data: { referral_code: newCode },
      });

      return {
        code: newCode,
        userId: user.id,
        createdAt: new Date().toISOString(),
        totalReferrals: 0,
        pendingRewards: 0,
        totalRewardsEarned: 0,
      } as ReferralCode;
    },
    enabled: !!user,
    staleTime: Infinity, // Code doesn't change
  });
}

/**
 * Get referral statistics from database
 */
export function useReferralStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get user's referral code info
      const { data: codeData } = await supabase
        .from('referral_codes')
        .select('id, code, current_uses, referrer_reward_value')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      // Get referrals made by this user
      const { data: referrals } = await supabase
        .from('referrals')
        .select(`
          id,
          status,
          created_at,
          qualified_at,
          referee_id
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get referee profile names
      let recentReferrals: Array<{ name: string; date: string; status: 'pending' | 'completed'; reward: number }> = [];
      if (referrals && referrals.length > 0) {
        const refereeIds = referrals.map(r => r.referee_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', refereeIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

        recentReferrals = referrals.map(r => ({
          name: profileMap.get(r.referee_id) || 'Anonymous',
          date: r.created_at,
          status: r.status === 'rewarded' ? 'completed' as const : 'pending' as const,
          reward: Number(codeData?.referrer_reward_value || REFERRAL_REWARDS.REFERRER),
        }));
      }

      // Get bonuses earned
      const { data: bonuses } = await supabase
        .from('referral_bonuses')
        .select('reward_value, status')
        .eq('user_id', user.id)
        .eq('bonus_type', 'referrer');

      const totalRewardsEarned = bonuses?.filter(b => b.status === 'credited').reduce((sum, b) => sum + Number(b.reward_value), 0) || 0;
      const pendingRewards = bonuses?.filter(b => b.status === 'pending').reduce((sum, b) => sum + Number(b.reward_value), 0) || 0;

      return {
        totalReferrals: codeData?.current_uses || 0,
        pendingRewards,
        totalRewardsEarned,
        referralCode: codeData?.code,
        recentReferrals,
      };
    },
    enabled: !!user,
  });
}

/**
 * Apply a referral code during signup using database function
 */
export function useApplyReferralCode() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Call the database function to apply referral code
      const { data, error } = await supabase.rpc('apply_referral_code', {
        p_referee_id: user.id,
        p_code: code.toUpperCase(),
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to apply referral code');
      }

      // Also store in user metadata for reference
      await supabase.auth.updateUser({
        data: { referred_by: code.toUpperCase() },
      });

      return {
        success: true,
        referralId: data.referral_id,
        rewardType: data.reward_type,
        rewardValue: data.reward_value,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
      toast({
        title: 'Referral Applied!',
        description: `You'll receive R${data.rewardValue} credit after your first order.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Invalid Referral Code',
        description: error.message || 'The referral code you entered is not valid.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Generate sharing URL
 */
export function getReferralUrl(code: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://eatlocal.co.za';
  return `${baseUrl}/auth?role=customer&ref=${code}`;
}

/**
 * Share referral via different methods
 */
export function useShareReferral() {
  const { toast } = useToast();

  const shareViaClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(getReferralUrl(code));
      toast({
        title: 'Copied!',
        description: 'Referral link copied to clipboard.',
      });
      return true;
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy link. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const shareViaWebShare = async (code: string) => {
    if (!navigator.share) {
      return shareViaClipboard(code);
    }

    try {
      await navigator.share({
        title: 'Join EatLocal!',
        text: `Use my referral code ${code} and get R${REFERRAL_REWARDS.REFERRED} off your first order!`,
        url: getReferralUrl(code),
      });
      return true;
    } catch (error) {
      // User cancelled or share failed
      return false;
    }
  };

  const shareViaWhatsApp = (code: string) => {
    const text = encodeURIComponent(
      `Hey! Join me on EatLocal and get R${REFERRAL_REWARDS.REFERRED} off your first order. Use my code: ${code}\n\n${getReferralUrl(code)}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaTwitter = (code: string) => {
    const text = encodeURIComponent(
      `Join @EatLocalZA and get R${REFERRAL_REWARDS.REFERRED} off your first order! Use code ${code}`
    );
    const url = encodeURIComponent(getReferralUrl(code));
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareViaFacebook = (code: string) => {
    const url = encodeURIComponent(getReferralUrl(code));
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareViaTelegram = (code: string) => {
    const text = encodeURIComponent(
      `Join EatLocal and get R${REFERRAL_REWARDS.REFERRED} off your first order! Use my code: ${code}`
    );
    const url = encodeURIComponent(getReferralUrl(code));
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const shareViaEmail = (code: string) => {
    const subject = encodeURIComponent('Join me on EatLocal!');
    const body = encodeURIComponent(
      `Hey!\n\nI've been using EatLocal for food delivery and it's great. Join using my referral code and get R${REFERRAL_REWARDS.REFERRED} off your first order!\n\nCode: ${code}\n\nSign up here: ${getReferralUrl(code)}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareViaSms = (code: string) => {
    const body = encodeURIComponent(
      `Join EatLocal! Use code ${code} for R${REFERRAL_REWARDS.REFERRED} off: ${getReferralUrl(code)}`
    );
    window.open(`sms:?body=${body}`, '_blank');
  };

  return {
    shareViaClipboard,
    shareViaWebShare,
    shareViaWhatsApp,
    shareViaTwitter,
    shareViaFacebook,
    shareViaTelegram,
    shareViaEmail,
    shareViaSms,
    REWARDS: REFERRAL_REWARDS,
  };
}

/**
 * Check if current URL has a referral code
 */
export function useReferralFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
}
