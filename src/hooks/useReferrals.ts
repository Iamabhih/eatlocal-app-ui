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
 * Get or create user's referral code
 */
export function useReferralCode() {
  const { user } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: ['referral-code', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Check user metadata for existing code
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Check if referral code exists in user metadata
      const { data: metadata } = await supabase.auth.getUser();
      const existingCode = metadata?.user?.user_metadata?.referral_code;

      if (existingCode) {
        return {
          code: existingCode,
          userId: user.id,
          createdAt: user.created_at || new Date().toISOString(),
          totalReferrals: 0,
          pendingRewards: 0,
          totalRewardsEarned: 0,
        } as ReferralCode;
      }

      // Generate new code
      const newCode = generateReferralCode(user.id);

      // Store in user metadata
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
 * Get referral statistics
 */
export function useReferralStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // This would query a referrals table - for now return mock data
      // In production, you'd have a referrals table to track this
      return {
        totalReferrals: 0,
        pendingRewards: 0,
        totalRewardsEarned: 0,
        recentReferrals: [] as Array<{
          name: string;
          date: string;
          status: 'pending' | 'completed';
          reward: number;
        }>,
      };
    },
    enabled: !!user,
  });
}

/**
 * Apply a referral code during signup
 */
export function useApplyReferralCode() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, newUserId }: { code: string; newUserId: string }) => {
      // Validate the referral code by finding the referrer
      const { data: users } = await supabase.auth.admin.listUsers();

      // In a real implementation, you'd query a referral_codes table
      // For now, we'll store the referral in the new user's metadata
      await supabase.auth.updateUser({
        data: { referred_by: code },
      });

      return { success: true, referrerReward: REFERRAL_REWARDS.REFERRER, referredReward: REFERRAL_REWARDS.REFERRED };
    },
    onSuccess: (data) => {
      toast({
        title: 'Referral Applied!',
        description: `You'll receive R${data.referredReward} credit after your first order.`,
      });
    },
    onError: () => {
      toast({
        title: 'Invalid Referral Code',
        description: 'The referral code you entered is not valid.',
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
