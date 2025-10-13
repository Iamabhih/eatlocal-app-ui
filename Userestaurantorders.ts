import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

// Proper TypeScript types
interface CustomerProfile {
  id: string;
  full_name: string;
  phone: string | null;
}

interface DeliveryAddress {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
}

interface MenuItem {
  name: string;
  price: number;
}

interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  special_instructions: string | null;
  menu_item: MenuItem;
}

interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  delivery_address_id: string | null;
  delivery_partner_id: string | null;
  order_number: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  tip: number;
  total: number;
  special_instructions: string | null;
  estimated_delivery_time: string | null;
  accepted_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  customer: CustomerProfile | null;
  delivery_address: DeliveryAddress | null;
  order_items: OrderItem[];
}

interface UpdateOrderStatusParams {
  orderId: string;
  status: string;
}

export function useRestaurantOrders(restaurantId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Optimized query with single database call using joins
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['restaurant-orders', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      logger.log('Fetching orders for restaurant:', restaurantId);
      
      // Single optimized query with all joins
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:profiles!customer_id(id, full_name, phone),
          delivery_address:customer_addresses(street_address, city, state, zip_code),
          order_items(
            *,
            menu_item:menu_items(name, price)
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching orders:', error);
        throw error;
      }
      
      logger.log(`Fetched ${data?.length || 0} orders`);
      return data as Order[];
    },
    enabled: !!restaurantId,
  });

  // Real-time subscription for new orders with proper cleanup
  useEffect(() => {
    if (!restaurantId) return;

    // Clean up previous channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new channel with unique name
    const channel = supabase
      .channel(`restaurant-orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          logger.log('Order update received:', payload);
          
          // Invalidate queries to refetch
          queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurantId] });
          
          // Show toast for new orders
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            toast({
              title: '🎉 New Order!',
              description: `Order #${newOrder.order_number} received`,
            });
          }
        }
      )
      .subscribe((status) => {
        logger.log('Subscription status:', status);
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      logger.log('Cleaning up order subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [restaurantId, queryClient, toast]);

  // Mutation for updating order status
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: UpdateOrderStatusParams) => {
      const timestamp = new Date().toISOString();
      const updates: Partial<Order> = { status };

      // Set appropriate timestamp based on status
      if (status === 'confirmed') {
        updates.accepted_at = timestamp;
      } else if (status === 'preparing') {
        updates.accepted_at = updates.accepted_at || timestamp;
      } else if (status === 'ready_for_pickup') {
        updates.ready_at = timestamp;
      } else if (status === 'cancelled') {
        updates.cancelled_at = timestamp;
      }

      logger.log(`Updating order ${orderId} to status: ${status}`);

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) {
        logger.error('Error updating order:', error);
        throw error;
      }

      return { orderId, status };
    },
    onSuccess: (data) => {
      logger.log('Order status updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurantId] });
      toast({ title: 'Order status updated' });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update order:', error);
      toast({ 
        title: 'Failed to update order', 
        description: errorMessage,
        variant: 'destructive' 
      });
    },
  });

  return {
    orders: orders || [],
    isLoading,
    updateOrderStatus: updateOrderStatus.mutate,
    isUpdating: updateOrderStatus.isPending,
  };
}
