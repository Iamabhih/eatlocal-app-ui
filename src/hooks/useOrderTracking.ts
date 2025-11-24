import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

export function useOrderTracking(orderId: string) {
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(name, phone, street_address, city),
          delivery_address:customer_addresses(street_address, city, state, zip_code),
          order_items(
            *,
            menu_item:menu_items(name, price)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const { data: deliveryLocation } = useQuery({
    queryKey: ['delivery-location', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_partner_locations')
        .select('*')
        .eq('order_id', orderId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: order?.status === 'picked_up',
    refetchInterval: 3000, // Refetch every 3 seconds when delivery is active
  });

  // Real-time subscription for order updates
  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          logger.debug('Order status updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['order-tracking', orderId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);

  // Real-time subscription for delivery location updates
  useEffect(() => {
    if (order?.status !== 'picked_up') return;

    const channel = supabase
      .channel(`delivery-location-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_partner_locations',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          logger.debug('Delivery location updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['delivery-location', orderId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, order?.status, queryClient]);

  return {
    order,
    deliveryLocation,
    isLoading,
  };
}
