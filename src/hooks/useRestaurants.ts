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
