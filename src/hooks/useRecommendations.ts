import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Recommendation {
  menu_item_id: string;
  restaurant_id: string;
  name: string;
  price: number;
  image_url: string | null;
  restaurant_name: string;
  match_score: number;
  recommendation_reason: string;
}

export interface TrendingItem {
  id: string;
  menu_item_id: string;
  restaurant_id: string;
  trend_score: number;
  order_count_24h: number;
  order_count_7d: number;
  growth_rate: number;
  rank_position: number;
  menu_item?: {
    name: string;
    price: number;
    image_url: string | null;
  };
  restaurant?: {
    name: string;
  };
}

export interface TasteProfile {
  id: string;
  user_id: string;
  cuisine_preferences: Record<string, number>;
  dietary_restrictions: string[];
  spice_tolerance: number;
  price_preference: 'budget' | 'moderate' | 'premium' | 'any';
  favorite_ingredients: string[];
  disliked_ingredients: string[];
  meal_time_preferences: Record<string, string[]>;
  last_updated: string;
}

/**
 * Get personalized recommendations for the current user
 */
export function usePersonalizedRecommendations(limit: number = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations', 'personalized', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_personalized_recommendations', {
        p_user_id: user.id,
        p_limit: limit,
      });

      if (error) {
        // Return empty array if function doesn't exist yet
        if (error.code === '42883') return [];
        throw error;
      }

      return data as Recommendation[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get trending items in the user's area
 */
export function useTrendingItems(region: string = 'all', limit: number = 10) {
  return useQuery({
    queryKey: ['recommendations', 'trending', region, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trending_items')
        .select(`
          *,
          menu_item:menu_items(name, price, image_url),
          restaurant:restaurants(name)
        `)
        .eq('region', region)
        .order('rank_position', { ascending: true })
        .limit(limit);

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as TrendingItem[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get items frequently ordered together
 */
export function useFrequentlyBoughtTogether(menuItemId: string) {
  return useQuery({
    queryKey: ['recommendations', 'bought-together', menuItemId],
    queryFn: async () => {
      // Find items commonly ordered with this item
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          order:orders!inner(id),
          menu_item:menu_items!inner(
            id,
            name,
            price,
            image_url,
            restaurant:restaurants(name)
          )
        `)
        .neq('menu_item_id', menuItemId)
        .limit(50);

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      // Group by menu item and count occurrences
      const itemCounts = new Map<string, { item: any; count: number }>();
      data?.forEach((row: any) => {
        const itemId = row.menu_item?.id;
        if (itemId) {
          const existing = itemCounts.get(itemId);
          if (existing) {
            existing.count++;
          } else {
            itemCounts.set(itemId, { item: row.menu_item, count: 1 });
          }
        }
      });

      // Sort by count and return top 5
      return Array.from(itemCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(({ item }) => item);
    },
    enabled: !!menuItemId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Get user's recent orders for "Order Again" feature
 */
export function useReorderSuggestions(limit: number = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations', 'reorder', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total,
          restaurant:restaurants(id, name, image_url),
          order_items(
            id,
            quantity,
            menu_item:menu_items(id, name, price, image_url)
          )
        `)
        .eq('customer_id', user.id)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    },
    enabled: !!user,
  });
}

/**
 * Get user's taste profile
 */
export function useTasteProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['taste-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_taste_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') return null;
        throw error;
      }

      return data as TasteProfile;
    },
    enabled: !!user,
  });
}

/**
 * Update user's taste profile
 */
export function useUpdateTasteProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<TasteProfile, 'id' | 'user_id' | 'last_updated'>>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_taste_profiles')
        .upsert({
          user_id: user.id,
          ...updates,
          last_updated: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taste-profile'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
}

/**
 * Get similar restaurants
 */
export function useSimilarRestaurants(restaurantId: string, limit: number = 5) {
  return useQuery({
    queryKey: ['recommendations', 'similar-restaurants', restaurantId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_similarities')
        .select(`
          similar_restaurant_id,
          similarity_score,
          similarity_factors,
          restaurant:restaurants!restaurant_similarities_similar_restaurant_id_fkey(
            id,
            name,
            image_url,
            cuisine_type,
            average_rating,
            delivery_time_minutes
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('similarity_score', { ascending: false })
        .limit(limit);

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data?.map(row => ({
        ...row.restaurant,
        similarity_score: row.similarity_score,
        similarity_factors: row.similarity_factors,
      })) || [];
    },
    enabled: !!restaurantId,
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Track recommendation impression/click
 */
export function useTrackRecommendation() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      recommendationType,
      recommendedItems,
      eventType,
      context,
    }: {
      recommendationType: 'personalized' | 'trending' | 'similar' | 'reorder';
      recommendedItems: string[];
      eventType: 'impression' | 'click' | 'conversion' | 'order';
      context?: Record<string, any>;
    }) => {
      if (!user) return;

      // Find or create recommendation event
      const { data: existing } = await supabase
        .from('recommendation_events')
        .select('id, impressions, clicks, conversions, orders')
        .eq('user_id', user.id)
        .eq('recommendation_type', recommendationType)
        .contains('recommended_items', recommendedItems)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Within last hour
        .single();

      if (existing) {
        const updates: Record<string, number> = {};
        if (eventType === 'impression') updates.impressions = existing.impressions + 1;
        if (eventType === 'click') updates.clicks = existing.clicks + 1;
        if (eventType === 'conversion') updates.conversions = existing.conversions + 1;
        if (eventType === 'order') updates.orders = existing.orders + 1;

        await supabase
          .from('recommendation_events')
          .update(updates)
          .eq('id', existing.id);
      } else {
        await supabase.from('recommendation_events').insert({
          user_id: user.id,
          recommendation_type: recommendationType,
          recommended_items: recommendedItems,
          context: context || {},
          impressions: eventType === 'impression' ? 1 : 0,
          clicks: eventType === 'click' ? 1 : 0,
          conversions: eventType === 'conversion' ? 1 : 0,
          orders: eventType === 'order' ? 1 : 0,
        });
      }
    },
  });
}

/**
 * Get cuisine categories with user preferences
 */
export function useCuisineCategories() {
  const { data: profile } = useTasteProfile();

  const cuisines = [
    { id: 'south-african', name: 'South African', icon: '🇿🇦' },
    { id: 'indian', name: 'Indian', icon: '🍛' },
    { id: 'italian', name: 'Italian', icon: '🍕' },
    { id: 'chinese', name: 'Chinese', icon: '🥡' },
    { id: 'japanese', name: 'Japanese', icon: '🍣' },
    { id: 'thai', name: 'Thai', icon: '🍜' },
    { id: 'mexican', name: 'Mexican', icon: '🌮' },
    { id: 'american', name: 'American', icon: '🍔' },
    { id: 'mediterranean', name: 'Mediterranean', icon: '🥙' },
    { id: 'african', name: 'African', icon: '🍲' },
    { id: 'portuguese', name: 'Portuguese', icon: '🐔' },
    { id: 'seafood', name: 'Seafood', icon: '🦐' },
  ];

  return cuisines.map(cuisine => ({
    ...cuisine,
    preference: profile?.cuisine_preferences?.[cuisine.id] || 0,
  }));
}

export const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'dairy-free', label: 'Dairy-Free' },
  { value: 'nut-free', label: 'Nut-Free' },
  { value: 'pescatarian', label: 'Pescatarian' },
];

export const PRICE_PREFERENCES = [
  { value: 'budget', label: 'Budget-Friendly', description: 'Under R100 per order' },
  { value: 'moderate', label: 'Moderate', description: 'R100 - R250 per order' },
  { value: 'premium', label: 'Premium', description: 'R250+ per order' },
  { value: 'any', label: 'No Preference', description: 'Show me everything' },
];
