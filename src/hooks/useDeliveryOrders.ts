import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useDeliveryOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['delivery-orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(name, street_address, city, phone),
          delivery_address:customer_addresses(street_address, city, state, zip_code),
          customer:profiles!orders_customer_id_fkey(full_name, phone),
          order_items(*, menu_item:menu_items(name, price))
        `)
        .eq('delivery_partner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const timestamp = new Date().toISOString();
      const updates: any = { status };

      if (status === 'picked_up') updates.picked_up_at = timestamp;
      if (status === 'delivered') updates.delivered_at = timestamp;

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      toast({ title: 'Order status updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update order status', variant: 'destructive' });
    },
  });

  return {
    orders: orders || [],
    isLoading,
    updateOrderStatus: updateStatusMutation.mutate,
  };
}
