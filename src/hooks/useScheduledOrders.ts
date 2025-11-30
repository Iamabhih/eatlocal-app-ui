import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ScheduledOrder {
  id: string;
  order_number: string;
  restaurant_id: string;
  customer_id: string;
  status: string;
  total: number;
  is_scheduled: boolean;
  scheduled_for: string;
  created_at: string;
  restaurant?: {
    name: string;
    image_url: string;
  };
  order_items?: Array<{
    id: string;
    quantity: number;
    menu_item: {
      name: string;
      price: number;
    };
  }>;
}

/**
 * Get user's scheduled orders
 */
export function useScheduledOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['scheduled-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          restaurant_id,
          customer_id,
          status,
          total,
          is_scheduled,
          scheduled_for,
          created_at,
          restaurant:restaurants(name, image_url),
          order_items(
            id,
            quantity,
            menu_item:menu_items(name, price)
          )
        `)
        .eq('customer_id', user.id)
        .eq('is_scheduled', true)
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data as ScheduledOrder[];
    },
    enabled: !!user,
  });
}

/**
 * Get upcoming scheduled orders (next 24 hours)
 */
export function useUpcomingScheduledOrders() {
  const { data: scheduledOrders } = useScheduledOrders();

  const tomorrow = new Date();
  tomorrow.setHours(tomorrow.getHours() + 24);

  return scheduledOrders?.filter(order => {
    const scheduledDate = new Date(order.scheduled_for);
    return scheduledDate <= tomorrow;
  }) || [];
}

/**
 * Create a scheduled order
 */
export function useCreateScheduledOrder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      restaurantId,
      items,
      scheduledFor,
      deliveryAddressId,
      specialInstructions,
      paymentMethod = 'card',
    }: {
      restaurantId: string;
      items: Array<{ menuItemId: string; quantity: number; specialInstructions?: string }>;
      scheduledFor: Date;
      deliveryAddressId: string;
      specialInstructions?: string;
      paymentMethod?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Validate scheduled time (minimum 1 hour from now)
      const minScheduleTime = new Date();
      minScheduleTime.setHours(minScheduleTime.getHours() + 1);

      if (scheduledFor < minScheduleTime) {
        throw new Error('Scheduled time must be at least 1 hour from now');
      }

      // Get menu items with prices
      const menuItemIds = items.map(i => i.menuItemId);
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, name, price')
        .in('id', menuItemIds);

      if (menuError) throw menuError;

      // Calculate totals
      const menuItemMap = new Map(menuItems.map(mi => [mi.id, mi]));
      let subtotal = 0;
      const orderItems = items.map(item => {
        const menuItem = menuItemMap.get(item.menuItemId);
        if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`);
        const itemTotal = menuItem.price * item.quantity;
        subtotal += itemTotal;
        return {
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          price: menuItem.price,
          total: itemTotal,
          special_instructions: item.specialInstructions,
        };
      });

      const serviceFee = subtotal * 0.045; // 4.5%
      const deliveryFee = 25; // Fixed for now
      const total = subtotal + serviceFee + deliveryFee;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          restaurant_id: restaurantId,
          status: 'scheduled',
          subtotal,
          service_fee: serviceFee,
          delivery_fee: deliveryFee,
          total,
          is_scheduled: true,
          scheduled_for: scheduledFor.toISOString(),
          delivery_address_id: deliveryAddressId,
          special_instructions: specialInstructions,
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const itemsWithOrderId = orderItems.map(item => ({
        ...item,
        order_id: order.id,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsWithOrderId);

      if (itemsError) throw itemsError;

      // Schedule reminders
      const reminders = [
        { type: '24h_before', time: new Date(scheduledFor.getTime() - 24 * 60 * 60 * 1000) },
        { type: '1h_before', time: new Date(scheduledFor.getTime() - 60 * 60 * 1000) },
        { type: '15min_before', time: new Date(scheduledFor.getTime() - 15 * 60 * 1000) },
      ].filter(r => r.time > new Date()); // Only future reminders

      if (reminders.length > 0) {
        await supabase.from('scheduled_order_reminders').insert(
          reminders.map(r => ({
            order_id: order.id,
            reminder_type: r.type,
            scheduled_for: r.time.toISOString(),
          }))
        );
      }

      return order;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      const scheduledDate = new Date(data.scheduled_for);
      toast({
        title: 'Order Scheduled! 📅',
        description: `Your order is scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Schedule Order',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Cancel a scheduled order
 */
export function useCancelScheduledOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      // Check if can still cancel (minimum 30 minutes before scheduled time)
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('scheduled_for')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      const scheduledDate = new Date(order.scheduled_for);
      const minCancelTime = new Date(scheduledDate.getTime() - 30 * 60 * 1000);

      if (new Date() > minCancelTime) {
        throw new Error('Cannot cancel within 30 minutes of scheduled time');
      }

      // Cancel order
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      // Cancel reminders
      await supabase
        .from('scheduled_order_reminders')
        .update({ status: 'cancelled' })
        .eq('order_id', orderId);

      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Order Cancelled',
        description: 'Your scheduled order has been cancelled.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Cancel',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Reschedule an order
 */
export function useRescheduleOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, newScheduledFor }: { orderId: string; newScheduledFor: Date }) => {
      // Validate new time
      const minScheduleTime = new Date();
      minScheduleTime.setHours(minScheduleTime.getHours() + 1);

      if (newScheduledFor < minScheduleTime) {
        throw new Error('New time must be at least 1 hour from now');
      }

      // Update order
      const { error } = await supabase
        .from('orders')
        .update({ scheduled_for: newScheduledFor.toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      // Update reminders
      await supabase
        .from('scheduled_order_reminders')
        .delete()
        .eq('order_id', orderId);

      const reminders = [
        { type: '24h_before', time: new Date(newScheduledFor.getTime() - 24 * 60 * 60 * 1000) },
        { type: '1h_before', time: new Date(newScheduledFor.getTime() - 60 * 60 * 1000) },
        { type: '15min_before', time: new Date(newScheduledFor.getTime() - 15 * 60 * 1000) },
      ].filter(r => r.time > new Date());

      if (reminders.length > 0) {
        await supabase.from('scheduled_order_reminders').insert(
          reminders.map(r => ({
            order_id: orderId,
            reminder_type: r.type,
            scheduled_for: r.time.toISOString(),
          }))
        );
      }

      return { orderId, newScheduledFor };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-orders'] });
      toast({
        title: 'Order Rescheduled',
        description: `New time: ${data.newScheduledFor.toLocaleDateString()} at ${data.newScheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Reschedule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get available time slots for scheduling
 */
export function useAvailableTimeSlots(restaurantId: string, date: Date) {
  return useQuery({
    queryKey: ['time-slots', restaurantId, date.toDateString()],
    queryFn: async () => {
      // Get restaurant operating hours
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('operating_hours')
        .eq('id', restaurantId)
        .single();

      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const hours = restaurant?.operating_hours?.[dayOfWeek];

      if (!hours || hours.closed) {
        return [];
      }

      // Generate 30-minute time slots
      const slots: Date[] = [];
      const [openHour, openMin] = hours.open.split(':').map(Number);
      const [closeHour, closeMin] = hours.close.split(':').map(Number);

      const startTime = new Date(date);
      startTime.setHours(openHour, openMin, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(closeHour, closeMin, 0, 0);

      // Minimum 1 hour from now
      const minTime = new Date();
      minTime.setHours(minTime.getHours() + 1);

      let currentSlot = new Date(startTime);
      while (currentSlot < endTime) {
        if (currentSlot > minTime) {
          slots.push(new Date(currentSlot));
        }
        currentSlot.setMinutes(currentSlot.getMinutes() + 30);
      }

      return slots;
    },
    enabled: !!restaurantId,
  });
}
