import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useRestaurantProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['restaurant-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useRestaurantOrders() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['restaurant-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // First get the restaurant
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!restaurant) return [];

      // Then get orders
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:profiles!orders_customer_id_fkey(full_name),
          order_items(
            *,
            menu_item:menu_items(name, price)
          )
        `)
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useRestaurantMenuItems() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['restaurant-menu-items', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!restaurant) return [];

      const { data, error } = await supabase
        .from('menu_items')
        .select('*, category:menu_categories(name)')
        .eq('restaurant_id', restaurant.id)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}
