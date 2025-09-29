import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDeliveryEarnings() {
  const { data: earnings, isLoading } = useQuery({
    queryKey: ['delivery-earnings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('delivery_earnings')
        .select(`
          *,
          order:orders(
            order_number,
            restaurant:restaurants(name),
            delivery_address:customer_addresses(street_address, city),
            created_at,
            delivered_at
          )
        `)
        .eq('delivery_partner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const todayEarnings = earnings?.filter(e => {
    const today = new Date().setHours(0, 0, 0, 0);
    const earningDate = new Date(e.created_at).setHours(0, 0, 0, 0);
    return earningDate === today;
  }) || [];

  const totalToday = todayEarnings.reduce((sum, e) => 
    sum + Number(e.total_earnings), 0
  );

  const totalTips = todayEarnings.reduce((sum, e) => 
    sum + Number(e.tip || 0), 0
  );

  return {
    earnings: earnings || [],
    todayEarnings,
    totalToday,
    totalTips,
    deliveriesToday: todayEarnings.length,
    isLoading,
  };
}
