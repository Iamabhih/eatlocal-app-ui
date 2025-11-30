import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface DeliveryOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  delivery_fee: number;
  tip: number | null;
  created_at: string;
  special_instructions: string | null;
  fulfillment_type: string;
  restaurant: {
    id: string;
    name: string;
    street_address: string;
    city: string;
    phone: string;
    latitude: number | null;
    longitude: number | null;
  };
  delivery_address: {
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  customer: {
    full_name: string;
    phone: string | null;
  } | null;
  order_items: Array<{
    id: string;
    quantity: number;
    menu_item: {
      name: string;
      price: number;
    };
  }>;
}

/**
 * Hook for driver's assigned orders
 */
export function useDeliveryOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['delivery-orders', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total,
          subtotal,
          delivery_fee,
          tip,
          created_at,
          special_instructions,
          fulfillment_type,
          restaurant:restaurants(id, name, street_address, city, phone, latitude, longitude),
          delivery_address:customer_addresses(street_address, city, state, zip_code, latitude, longitude),
          customer:profiles!orders_customer_id_fkey(full_name, phone),
          order_items(id, quantity, menu_item:menu_items(name, price))
        `)
        .eq('delivery_partner_id', user.id)
        .in('status', ['ready_for_pickup', 'picked_up', 'delivered'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as DeliveryOrder[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const timestamp = new Date().toISOString();
      const updates: Record<string, any> = { status };

      if (status === 'picked_up') updates.picked_up_at = timestamp;
      if (status === 'delivered') updates.delivered_at = timestamp;

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      queryClient.invalidateQueries({ queryKey: ['available-orders'] });

      const statusMessages: Record<string, string> = {
        picked_up: 'Order picked up! Head to delivery location.',
        delivered: 'Order delivered successfully!',
      };

      toast({
        title: 'Order Updated',
        description: statusMessages[variables.status] || 'Order status updated',
      });
    },
    onError: () => {
      toast({ title: 'Failed to update order status', variant: 'destructive' });
    },
  });

  return {
    orders: orders || [],
    isLoading,
    updateOrderStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
  };
}

/**
 * Hook for available orders (unassigned orders ready for pickup)
 */
export function useAvailableOrders(driverLocation?: { lat: number; lng: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['available-orders', driverLocation?.lat, driverLocation?.lng],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Get orders that are ready for pickup but not assigned to a driver
      // Only get delivery orders (not pickup)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total,
          subtotal,
          delivery_fee,
          tip,
          created_at,
          special_instructions,
          fulfillment_type,
          restaurant:restaurants(id, name, street_address, city, phone, latitude, longitude),
          delivery_address:customer_addresses(street_address, city, state, zip_code, latitude, longitude),
          order_items(id, quantity, menu_item:menu_items(name, price))
        `)
        .is('delivery_partner_id', null)
        .eq('status', 'ready_for_pickup')
        .eq('fulfillment_type', 'delivery')
        .order('created_at', { ascending: true }) // FIFO
        .limit(20);

      if (error) throw error;

      let availableOrders = (data || []) as unknown as DeliveryOrder[];

      // If driver location is provided, calculate distances and sort by distance
      if (driverLocation && availableOrders.length > 0) {
        availableOrders = availableOrders
          .map(order => ({
            ...order,
            distance: order.restaurant?.latitude && order.restaurant?.longitude
              ? calculateDistance(
                  driverLocation.lat,
                  driverLocation.lng,
                  order.restaurant.latitude,
                  order.restaurant.longitude
                )
              : null,
          }))
          .sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
      }

      return availableOrders;
    },
    enabled: !!user,
    refetchInterval: 15000, // Refresh every 15 seconds for available orders
  });

  // Real-time subscription for new orders
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('available-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.ready_for_pickup',
        },
        (payload) => {
          // Refetch when there's a change to ready_for_pickup orders
          refetch();

          if (payload.eventType === 'UPDATE' && payload.new.status === 'ready_for_pickup') {
            toast({
              title: 'New Order Available!',
              description: 'A new delivery order is ready for pickup.',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch, toast]);

  return {
    orders: orders || [],
    isLoading,
    refetch,
  };
}

/**
 * Hook to accept an order
 */
export function useAcceptOrder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Check if order is still available
      const { data: order, error: checkError } = await supabase
        .from('orders')
        .select('id, delivery_partner_id, status')
        .eq('id', orderId)
        .single();

      if (checkError) throw checkError;

      if (order.delivery_partner_id) {
        throw new Error('This order has already been accepted by another driver');
      }

      if (order.status !== 'ready_for_pickup') {
        throw new Error('This order is no longer available');
      }

      // Accept the order
      const { error } = await supabase
        .from('orders')
        .update({
          delivery_partner_id: user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .is('delivery_partner_id', null); // Ensure no race condition

      if (error) throw error;

      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      queryClient.invalidateQueries({ queryKey: ['available-orders'] });
      toast({
        title: 'Order Accepted!',
        description: 'Head to the restaurant for pickup.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Accept Order',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to decline/cancel an order (driver side)
 */
export function useDeclineOrder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Remove driver assignment and add to declined list
      const { error } = await supabase
        .from('orders')
        .update({
          delivery_partner_id: null,
          accepted_at: null,
        })
        .eq('id', orderId)
        .eq('delivery_partner_id', user.id);

      if (error) throw error;

      // Log the decline (for analytics/driver reliability tracking)
      await supabase
        .from('order_events')
        .insert({
          order_id: orderId,
          event_type: 'driver_declined',
          event_data: { driver_id: user.id, reason },
        })
        .single();

      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      queryClient.invalidateQueries({ queryKey: ['available-orders'] });
      toast({
        title: 'Order Released',
        description: 'The order has been released for another driver.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to Release Order',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to get driver earnings
 */
export function useDriverEarnings(period: 'today' | 'week' | 'month' = 'today') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['driver-earnings', user?.id, period],
    queryFn: async () => {
      if (!user) return null;

      let startDate: Date;
      const now = new Date();

      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('id, delivery_fee, tip, delivered_at')
        .eq('delivery_partner_id', user.id)
        .eq('status', 'delivered')
        .gte('delivered_at', startDate.toISOString());

      if (error) throw error;

      const orders = data || [];
      const totalDeliveries = orders.length;
      const totalDeliveryFees = orders.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);
      const totalTips = orders.reduce((sum, o) => sum + (o.tip || 0), 0);
      const totalEarnings = totalDeliveryFees + totalTips;
      const averagePerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

      return {
        totalDeliveries,
        totalDeliveryFees,
        totalTips,
        totalEarnings,
        averagePerDelivery,
        orders,
      };
    },
    enabled: !!user,
  });
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format estimated earnings for an order
 */
export function formatOrderEarnings(order: DeliveryOrder): {
  deliveryFee: number;
  tip: number;
  total: number;
} {
  const deliveryFee = order.delivery_fee || 0;
  const tip = order.tip || 0;
  return {
    deliveryFee,
    tip,
    total: deliveryFee + tip,
  };
}
