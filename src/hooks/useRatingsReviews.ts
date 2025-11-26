import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Review {
  id: string;
  user_id: string;
  restaurant_id: string;
  order_id: string;
  rating: number;
  food_rating: number;
  delivery_rating: number;
  review_text: string | null;
  images: string[];
  is_anonymous: boolean;
  helpful_count: number;
  response_text: string | null;
  response_date: string | null;
  created_at: string;
  user?: {
    email: string;
    full_name: string;
  };
}

export interface CreateReviewInput {
  restaurant_id: string;
  order_id: string;
  rating: number;
  food_rating: number;
  delivery_rating: number;
  review_text?: string;
  images?: string[];
  is_anonymous?: boolean;
}

// Hook to fetch reviews for a restaurant
export function useRestaurantReviews(restaurantId: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['restaurant-reviews', restaurantId, page, limit],
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `, { count: 'exact' })
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        reviews: data as Review[],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    },
    enabled: !!restaurantId,
  });
}

// Hook to fetch reviews by a user
export function useUserReviews() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-reviews', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          restaurants:restaurant_id (
            name,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Hook to check if user can review an order
export function useCanReviewOrder(orderId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['can-review', orderId, user?.id],
    queryFn: async () => {
      if (!user || !orderId) return { canReview: false, reason: 'Not authenticated' };

      // Check if order exists and is delivered
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, status, customer_id, restaurant_id')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return { canReview: false, reason: 'Order not found' };
      }

      if (order.customer_id !== user.id) {
        return { canReview: false, reason: 'Not your order' };
      }

      if (order.status !== 'delivered') {
        return { canReview: false, reason: 'Order not delivered yet' };
      }

      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', orderId)
        .eq('user_id', user.id)
        .single();

      if (existingReview) {
        return { canReview: false, reason: 'Already reviewed' };
      }

      return {
        canReview: true,
        reason: null,
        restaurantId: order.restaurant_id,
      };
    },
    enabled: !!user && !!orderId,
  });
}

// Hook to create a review
export function useCreateReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          ...input,
          user_id: user.id,
          images: input.images || [],
          is_anonymous: input.is_anonymous || false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update restaurant rating
      await updateRestaurantRating(input.restaurant_id);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-reviews', data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant', data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ['can-review', data.order_id] });

      toast({
        title: 'Review Submitted',
        description: 'Thank you for your feedback!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Submit Review',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook for restaurant to respond to a review
export function useRespondToReview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, responseText }: { reviewId: string; responseText: string }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          response_text: responseText,
          response_date: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-reviews', data.restaurant_id] });

      toast({
        title: 'Response Posted',
        description: 'Your response has been added to the review',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Post Response',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to mark a review as helpful
export function useMarkReviewHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { data, error } = await supabase.rpc('increment_helpful_count', {
        review_id: reviewId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-reviews'] });
    },
  });
}

// Helper function to update restaurant rating
async function updateRestaurantRating(restaurantId: string) {
  try {
    // Calculate new average rating
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('restaurant_id', restaurantId);

    if (error || !reviews?.length) return;

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const totalReviews = reviews.length;

    // Update restaurant
    await supabase
      .from('restaurants')
      .update({
        rating: Math.round(avgRating * 10) / 10,
        total_reviews: totalReviews,
      })
      .eq('id', restaurantId);
  } catch (error) {
    console.error('Error updating restaurant rating:', error);
  }
}

// Hook to get rating distribution
export function useRatingDistribution(restaurantId: string) {
  return useQuery({
    queryKey: ['rating-distribution', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      const distribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      data?.forEach((review) => {
        const rating = Math.round(review.rating);
        if (rating >= 1 && rating <= 5) {
          distribution[rating as keyof typeof distribution]++;
        }
      });

      const total = data?.length || 0;

      return {
        distribution,
        total,
        percentages: {
          1: total ? (distribution[1] / total) * 100 : 0,
          2: total ? (distribution[2] / total) * 100 : 0,
          3: total ? (distribution[3] / total) * 100 : 0,
          4: total ? (distribution[4] / total) * 100 : 0,
          5: total ? (distribution[5] / total) * 100 : 0,
        },
      };
    },
    enabled: !!restaurantId,
  });
}
