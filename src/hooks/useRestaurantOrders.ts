import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

type OrderWithCustomer = any; // We'll use any to avoid type complexity with dynamic customer field

export function useRestaurantOrders(restaurantId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery<OrderWithCustomer[]>({
    queryKey: ['restaurant-orders', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_address:customer_addresses(street_address, city, state, zip_code),
          order_items(
            *,
            menu_item:menu_items(name, price)
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch customer profiles separately
      if (data) {
        const customerIds = [...new Set(data.map(o => o.customer_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', customerIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        return data.map(order => ({
          ...order,
          customer: profileMap.get(order.customer_id) || null
        }));
      }
      
      return data || [];
    },
    enabled: !!restaurantId,
  });

  // Real-time subscription for new orders
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel('restaurant-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('Order update:', payload);
          queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurantId] });
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: '🎉 New Order!',
              description: `Order #${payload.new.order_number} received`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient, toast]);

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const timestamp = new Date().toISOString();
      const updates: any = { status };

      if (status === 'confirmed') updates.accepted_at = timestamp;
      if (status === 'preparing') updates.accepted_at = updates.accepted_at || timestamp;
      if (status === 'ready_for_pickup') updates.ready_at = timestamp;
      if (status === 'cancelled') updates.cancelled_at = timestamp;

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurantId] });
      toast({ title: 'Order status updated' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update order', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  return {
    orders: orders || [],
    isLoading,
    updateOrderStatus: updateOrderStatus.mutate,
  };
}
