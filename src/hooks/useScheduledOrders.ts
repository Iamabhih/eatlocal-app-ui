import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ScheduledOrder { id: string; order_number: string; restaurant_id: string; customer_id: string; status: string; total: number; scheduled_for: string; created_at: string; restaurant?: { name: string; image_url: string }; order_items?: Array<{ id: string; quantity: number; menu_item: { name: string; price: number } }>; }

export function useScheduledOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['scheduled-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('orders').select(`id, order_number, restaurant_id, customer_id, status, total, scheduled_for, created_at, restaurant:restaurants(name, image_url), order_items(id, quantity, menu_item:menu_items(name, price))`).eq('customer_id', user.id).not('scheduled_for', 'is', null).gte('scheduled_for', new Date().toISOString()).order('scheduled_for', { ascending: true });
      if (error) throw error;
      return data as ScheduledOrder[];
    },
    enabled: !!user,
  });
}

export function useUpcomingScheduledOrders() {
  const { data: scheduledOrders } = useScheduledOrders();
  const tomorrow = new Date(); tomorrow.setHours(tomorrow.getHours() + 24);
  return scheduledOrders?.filter(order => new Date(order.scheduled_for) <= tomorrow) || [];
}

export function useCreateScheduledOrder() {
  const { user } = useAuth(); const { toast } = useToast(); const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ restaurantId, items, scheduledFor, deliveryAddressId, specialInstructions, paymentMethod = 'card' }: { restaurantId: string; items: Array<{ menuItemId: string; quantity: number; specialInstructions?: string }>; scheduledFor: Date; deliveryAddressId: string; specialInstructions?: string; paymentMethod?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const minScheduleTime = new Date(); minScheduleTime.setHours(minScheduleTime.getHours() + 1);
      if (scheduledFor < minScheduleTime) throw new Error('Scheduled time must be at least 1 hour from now');
      const menuItemIds = items.map(i => i.menuItemId);
      const { data: menuItems, error: menuError } = await supabase.from('menu_items').select('id, name, price').in('id', menuItemIds);
      if (menuError) throw menuError;
      const menuItemMap = new Map(menuItems.map(mi => [mi.id, mi]));
      let subtotal = 0;
      const orderItems = items.map(item => { const menuItem = menuItemMap.get(item.menuItemId); if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`); const itemTotal = menuItem.price * item.quantity; subtotal += itemTotal; return { menu_item_id: item.menuItemId, quantity: item.quantity, unit_price: menuItem.price, subtotal: itemTotal, special_instructions: item.specialInstructions }; });
      const deliveryFee = 25; const tax = subtotal * 0.15; const total = subtotal + deliveryFee + tax;
      const { data: order, error: orderError } = await supabase.from('orders').insert({ customer_id: user.id, restaurant_id: restaurantId, order_number: `ORD-${Date.now()}`, status: 'scheduled', subtotal, delivery_fee: deliveryFee, tax, total, scheduled_for: scheduledFor.toISOString(), delivery_address_id: deliveryAddressId, special_instructions: specialInstructions, payment_method: paymentMethod }).select().single();
      if (orderError) throw orderError;
      const itemsWithOrderId = orderItems.map(item => ({ ...item, order_id: order.id }));
      const { error: itemsError } = await supabase.from('order_items').insert(itemsWithOrderId);
      if (itemsError) throw itemsError;
      return order;
    },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['scheduled-orders'] }); queryClient.invalidateQueries({ queryKey: ['orders'] }); const scheduledDate = new Date(data.scheduled_for); toast({ title: 'Order Scheduled!', description: `Your order is scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` }); },
    onError: (error: Error) => { toast({ title: 'Failed to Schedule Order', description: error.message, variant: 'destructive' }); },
  });
}

export function useCancelScheduledOrder() {
  const { toast } = useToast(); const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data: order, error: fetchError } = await supabase.from('orders').select('scheduled_for').eq('id', orderId).single();
      if (fetchError) throw fetchError;
      const scheduledDate = new Date(order.scheduled_for); const minCancelTime = new Date(scheduledDate.getTime() - 30 * 60 * 1000);
      if (new Date() > minCancelTime) throw new Error('Cannot cancel within 30 minutes of scheduled time');
      const { error } = await supabase.from('orders').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', orderId);
      if (error) throw error;
      return orderId;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scheduled-orders'] }); queryClient.invalidateQueries({ queryKey: ['orders'] }); toast({ title: 'Order Cancelled' }); },
    onError: (error: Error) => { toast({ title: 'Failed to Cancel', description: error.message, variant: 'destructive' }); },
  });
}

export function useRescheduleOrder() {
  const { toast } = useToast(); const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, newScheduledFor }: { orderId: string; newScheduledFor: Date }) => {
      const minScheduleTime = new Date(); minScheduleTime.setHours(minScheduleTime.getHours() + 1);
      if (newScheduledFor < minScheduleTime) throw new Error('New time must be at least 1 hour from now');
      const { error } = await supabase.from('orders').update({ scheduled_for: newScheduledFor.toISOString() }).eq('id', orderId);
      if (error) throw error;
      return { orderId, newScheduledFor };
    },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['scheduled-orders'] }); toast({ title: 'Order Rescheduled', description: `New time: ${data.newScheduledFor.toLocaleDateString()} at ${data.newScheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` }); },
    onError: (error: Error) => { toast({ title: 'Failed to Reschedule', description: error.message, variant: 'destructive' }); },
  });
}

export function useAvailableTimeSlots(restaurantId: string, date: Date) {
  return useQuery({
    queryKey: ['time-slots', restaurantId, date.toDateString()],
    queryFn: async () => {
      const slots: Date[] = [];
      const minTime = new Date(); minTime.setHours(minTime.getHours() + 1);
      const startHour = 8; const endHour = 22;
      for (let hour = startHour; hour < endHour; hour++) {
        for (const min of [0, 30]) {
          const slotTime = new Date(date); slotTime.setHours(hour, min, 0, 0);
          if (slotTime > minTime) slots.push(new Date(slotTime));
        }
      }
      return slots;
    },
    enabled: !!restaurantId,
  });
}
