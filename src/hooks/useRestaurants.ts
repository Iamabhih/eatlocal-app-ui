import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  cuisine_type: string | null;
  image_url: string | null;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string | null;
  rating: number;
  total_reviews: number;
  delivery_fee: number;
  minimum_order: number;
  estimated_delivery_time: number;
  is_active: boolean;
  is_open: boolean;
  dietary_options?: string[];
  latitude?: number;
  longitude?: number;
  delivery_radius_km?: number;
  opening_time?: string;
  closing_time?: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
  dietary_info?: string[];
}

export function useRestaurants() {
  return useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      return data as Restaurant[];
    },
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Restaurant;
    },
    enabled: !!id,
  });
}

// Enhanced hook that also fetches menu items for search
export function useRestaurantsWithMenu() {
  const restaurantsQuery = useQuery({
    queryKey: ['restaurants-with-menu'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      return data as Restaurant[];
    },
  });

  const menuItemsQuery = useQuery({
    queryKey: ['all-menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, restaurant_id, name, description, price, image_url, category, is_available')
        .eq('is_available', true);

      if (error) throw error;
      return data as MenuItem[];
    },
  });

  return {
    data: restaurantsQuery.data || [],
    menuItems: menuItemsQuery.data || [],
    isLoading: restaurantsQuery.isLoading || menuItemsQuery.isLoading,
    error: restaurantsQuery.error || menuItemsQuery.error,
  };
}

// Hook to search restaurants and menu items
export function useRestaurantSearch(searchQuery: string) {
  return useQuery({
    queryKey: ['restaurant-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { restaurants: [], menuMatches: [] };

      // Search restaurants
      const { data: restaurants, error: restError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,cuisine_type.ilike.%${searchQuery}%`);

      if (restError) throw restError;

      // Search menu items
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select(`
          id,
          restaurant_id,
          name,
          description,
          price,
          restaurants!inner (
            id,
            name,
            is_active
          )
        `)
        .eq('is_available', true)
        .eq('restaurants.is_active', true)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);

      if (menuError) throw menuError;

      return {
        restaurants: restaurants as Restaurant[],
        menuMatches: menuItems || [],
      };
    },
    enabled: searchQuery.length > 0,
  });
}
