import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type ReviewType = 'restaurant' | 'ride' | 'hotel' | 'venue';

export interface ReviewPhoto {
  id: string;
  review_id: string;
  review_type: ReviewType;
  user_id: string;
  photo_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface ReviewResponse {
  id: string;
  review_id: string;
  review_type: ReviewType;
  business_id: string;
  responder_id: string;
  response_text: string;
  is_edited: boolean;
  created_at: string;
}

export interface ReviewVote {
  id: string;
  review_id: string;
  review_type: ReviewType;
  user_id: string;
  vote_type: 'helpful' | 'not_helpful';
  created_at: string;
}

export interface ReviewModeration {
  id: string;
  review_id: string;
  review_type: ReviewType;
  flag_type: 'spam' | 'offensive' | 'fake' | 'irrelevant' | 'competitor' | 'other';
  flagged_by: string;
  flag_reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'removed';
  auto_flagged: boolean;
  toxicity_score: number | null;
}

/**
 * Get photos for a review
 */
export function useReviewPhotos(reviewId: string, reviewType: ReviewType) {
  return useQuery({
    queryKey: ['review-photos', reviewId, reviewType],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('review_photos')
        .select('*')
        .eq('review_id', reviewId)
        .eq('review_type', reviewType)
        .eq('is_approved', true)
        .order('created_at');

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as ReviewPhoto[];
    },
    enabled: !!reviewId,
  });
}

/**
 * Upload photo for a review
 */
export function useUploadReviewPhoto() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      reviewType,
      file,
      caption,
    }: {
      reviewId: string;
      reviewType: ReviewType;
      file: File;
      caption?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Upload file
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${reviewId}_${Date.now()}.${fileExt}`;
      const storagePath = `review-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('user-content')
        .getPublicUrl(storagePath);

      // Create photo record
      const { data, error } = await (supabase as any)
        .from('review_photos')
        .insert({
          review_id: reviewId,
          review_type: reviewType,
          user_id: user.id,
          photo_url: urlData.publicUrl,
          storage_path: storagePath,
          caption,
          is_approved: true, // Auto-approve for now
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['review-photos', variables.reviewId, variables.reviewType],
      });
      toast({
        title: 'Photo Uploaded',
        description: 'Your photo has been added to the review.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get business response to a review
 */
export function useReviewResponse(reviewId: string, reviewType: ReviewType) {
  return useQuery({
    queryKey: ['review-response', reviewId, reviewType],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('review_responses')
        .select(`
          *,
          responder:profiles(full_name)
        `)
        .eq('review_id', reviewId)
        .eq('review_type', reviewType)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01') return null;
        throw error;
      }

      return data as ReviewResponse | null;
    },
    enabled: !!reviewId,
  });
}

/**
 * Create business response to review
 */
export function useRespondToReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      reviewType,
      businessId,
      responseText,
    }: {
      reviewId: string;
      reviewType: ReviewType;
      businessId: string;
      responseText: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('review_responses')
        .insert({
          review_id: reviewId,
          review_type: reviewType,
          business_id: businessId,
          responder_id: user.id,
          response_text: responseText,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['review-response', variables.reviewId, variables.reviewType],
      });
      toast({
        title: 'Response Posted',
        description: 'Your response has been published.',
      });
    },
  });
}

/**
 * Vote on review helpfulness
 */
export function useVoteReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      reviewType,
      voteType,
    }: {
      reviewId: string;
      reviewType: ReviewType;
      voteType: 'helpful' | 'not_helpful';
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Try to insert, if duplicate update
      const { data, error } = await (supabase as any)
        .from('review_votes')
        .upsert(
          {
            review_id: reviewId,
            review_type: reviewType,
            user_id: user.id,
            vote_type: voteType,
          },
          { onConflict: 'review_id,review_type,user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['review-votes', variables.reviewId, variables.reviewType],
      });
    },
  });
}

/**
 * Get vote counts for a review
 */
export function useReviewVoteCounts(reviewId: string, reviewType: ReviewType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['review-votes', reviewId, reviewType],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('review_votes')
        .select('vote_type')
        .eq('review_id', reviewId)
        .eq('review_type', reviewType);

      if (error) {
        if (error.code === '42P01') return { helpful: 0, not_helpful: 0, userVote: null };
        throw error;
      }

      const helpful = data.filter((v: any) => v.vote_type === 'helpful').length;
      const not_helpful = data.filter((v: any) => v.vote_type === 'not_helpful').length;

      // Get user's vote if logged in
      let userVote = null;
      if (user) {
        const userVoteData = await (supabase as any)
          .from('review_votes')
          .select('vote_type')
          .eq('review_id', reviewId)
          .eq('review_type', reviewType)
          .eq('user_id', user.id)
          .maybeSingle();

        userVote = userVoteData.data?.vote_type || null;
      }

      return { helpful, not_helpful, userVote };
    },
    enabled: !!reviewId,
  });
}

/**
 * Flag a review for moderation
 */
export function useFlagReview() {
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      reviewId,
      reviewType,
      flagType,
      reason,
    }: {
      reviewId: string;
      reviewType: ReviewType;
      flagType: ReviewModeration['flag_type'];
      reason?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('review_moderation')
        .insert({
          review_id: reviewId,
          review_type: reviewType,
          flagged_by: user.id,
          flag_type: flagType,
          flag_reason: reason,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Review Reported',
        description: 'Thank you for your feedback. We will review this content.',
      });
    },
  });
}

/**
 * Check if review is verified purchase
 */
export function useIsVerifiedReview(reviewId: string, reviewType: ReviewType) {
  return useQuery({
    queryKey: ['verified-review', reviewId, reviewType],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('verified_reviews')
        .select('id')
        .eq('review_id', reviewId)
        .eq('review_type', reviewType)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01') return false;
        throw error;
      }

      return !!data;
    },
    enabled: !!reviewId,
  });
}

export const FLAG_TYPES = [
  { value: 'spam', label: 'Spam' },
  { value: 'offensive', label: 'Offensive content' },
  { value: 'fake', label: 'Fake review' },
  { value: 'irrelevant', label: 'Not relevant' },
  { value: 'competitor', label: 'Competitor review' },
  { value: 'other', label: 'Other' },
] as const;
