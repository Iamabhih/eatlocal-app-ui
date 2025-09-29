import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAdminData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users with their roles
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles separately
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge roles with profiles
      return profiles?.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id) || []
      })) || [];
    },
  });

  // Fetch all restaurants
  const { data: restaurants, isLoading: restaurantsLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch all orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(name),
          order_items(*, menu_item:menu_items(name))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalRestaurants },
        { count: totalOrders },
        { count: activeOrders },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up']),
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalRestaurants: totalRestaurants || 0,
        totalOrders: totalOrders || 0,
        activeOrders: activeOrders || 0,
      };
    },
  });

  // Update order status
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: any }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({ title: 'Order updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update order', variant: 'destructive' });
    },
  });

  // Update restaurant status
  const updateRestaurantMutation = useMutation({
    mutationFn: async ({ restaurantId, updates }: { restaurantId: string; updates: any }) => {
      const { error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', restaurantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      toast({ title: 'Restaurant updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update restaurant', variant: 'destructive' });
    },
  });

  return {
    users: users || [],
    restaurants: restaurants || [],
    orders: orders || [],
    stats,
    usersLoading,
    restaurantsLoading,
    ordersLoading,
    updateOrder: updateOrderMutation.mutate,
    updateRestaurant: updateRestaurantMutation.mutate,
  };
}
