/**
 * Smart Search Hook
 * Full-text search on restaurants and menu items using tsvector
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SearchResult {
  type: 'restaurant' | 'menu_item';
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  restaurant_id?: string;
  restaurant_name?: string;
  price?: number;
  rating?: number;
  cuisine_type?: string;
}

/**
 * Full-text search across restaurants and menu items
 */
export function useSmartSearch(query: string) {
  return useQuery({
    queryKey: ['smart-search', query],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query || query.length < 2) return [];

      const searchTerms = query.trim().split(/\s+/).join(' & ');

      // Search restaurants
      const { data: restaurants } = await (supabase as any)
        .from('restaurants')
        .select('id, name, description, image_url, rating, cuisine_type')
        .eq('is_active', true)
        .textSearch('search_vector', searchTerms, { type: 'websearch' })
        .limit(5);

      // Search menu items
      const { data: menuItems } = await (supabase as any)
        .from('menu_items')
        .select('id, name, description, image_url, price, restaurant_id, restaurants(name)')
        .eq('is_available', true)
        .textSearch('search_vector', searchTerms, { type: 'websearch' })
        .limit(10);

      const results: SearchResult[] = [];

      // Add restaurant results
      (restaurants || []).forEach((r: any) => {
        results.push({
          type: 'restaurant',
          id: r.id,
          name: r.name,
          description: r.description,
          image_url: r.image_url,
          rating: r.rating,
          cuisine_type: r.cuisine_type,
        });
      });

      // Add menu item results
      (menuItems || []).forEach((m: any) => {
        results.push({
          type: 'menu_item',
          id: m.id,
          name: m.name,
          description: m.description,
          image_url: m.image_url,
          price: m.price,
          restaurant_id: m.restaurant_id,
          restaurant_name: m.restaurants?.name,
        });
      });

      return results;
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });
}

/**
 * Recently viewed restaurants (stored in localStorage)
 */
export function useRecentlyViewed() {
  const getRecent = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem('recently_viewed_restaurants') || '[]');
    } catch {
      return [];
    }
  };

  const addRecent = (restaurantId: string) => {
    const recent = getRecent().filter(id => id !== restaurantId);
    recent.unshift(restaurantId);
    localStorage.setItem('recently_viewed_restaurants', JSON.stringify(recent.slice(0, 10)));
  };

  const recentIds = getRecent();

  const { data: restaurants } = useQuery({
    queryKey: ['recently-viewed', recentIds.join(',')],
    queryFn: async () => {
      if (recentIds.length === 0) return [];
      const { data } = await supabase
        .from('restaurants')
        .select('id, name, image_url, rating, cuisine_type, estimated_delivery_time, delivery_fee')
        .in('id', recentIds)
        .eq('is_active', true);
      
      // Sort by recent order
      return (data || []).sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
    },
    enabled: recentIds.length > 0,
  });

  return { restaurants: restaurants || [], addRecent };
}

/**
 * Reorder from previous orders
 */
export function useReorder() {
  const { user } = useAuth();

  const { data: previousOrders } = useQuery({
    queryKey: ['reorder-history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data } = await supabase
        .from('orders')
        .select(`
          id, order_number, total, created_at,
          restaurants(id, name, image_url),
          order_items(id, quantity, unit_price, menu_items(id, name, price, is_available))
        `)
        .eq('customer_id', user.id)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(5);

      return data || [];
    },
    enabled: !!user,
  });

  return { previousOrders: previousOrders || [] };
}
