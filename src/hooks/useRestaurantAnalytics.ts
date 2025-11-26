import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurantProfile } from './useRestaurantData';

interface DailyStats {
  date: string;
  orders: number;
  revenue: number;
  avgOrderValue: number;
}

interface TopItem {
  id: string;
  name: string;
  totalOrdered: number;
  revenue: number;
}

interface AnalyticsData {
  today: {
    orders: number;
    revenue: number;
    avgOrderValue: number;
    completedOrders: number;
    cancelledOrders: number;
  };
  thisWeek: {
    orders: number;
    revenue: number;
    avgOrderValue: number;
    growth: number;
  };
  thisMonth: {
    orders: number;
    revenue: number;
    avgOrderValue: number;
    growth: number;
  };
  dailyStats: DailyStats[];
  topItems: TopItem[];
  ordersByStatus: Record<string, number>;
  peakHours: { hour: number; orders: number }[];
  customerRetention: {
    newCustomers: number;
    returningCustomers: number;
    retentionRate: number;
  };
}

export function useRestaurantAnalytics(timeRange: '7d' | '30d' | '90d' = '30d') {
  const { data: restaurant } = useRestaurantProfile();

  return useQuery({
    queryKey: ['restaurant-analytics', restaurant?.id, timeRange],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!restaurant?.id) throw new Error('Restaurant not found');

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      const startOfMonth = new Date(startOfToday);
      startOfMonth.setDate(startOfMonth.getDate() - 30);

      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[timeRange];
      const startDate = new Date(startOfToday);
      startDate.setDate(startDate.getDate() - days);

      // Fetch orders for the time range
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          subtotal,
          total,
          customer_id,
          order_items (
            id,
            menu_item_id,
            quantity,
            subtotal,
            menu_items (
              id,
              name
            )
          )
        `)
        .eq('restaurant_id', restaurant.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate today's stats
      const todayOrders = orders?.filter(o =>
        new Date(o.created_at) >= startOfToday
      ) || [];

      const todayRevenue = todayOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total || 0), 0);

      // Calculate this week's stats
      const weekOrders = orders?.filter(o =>
        new Date(o.created_at) >= startOfWeek
      ) || [];

      const weekRevenue = weekOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total || 0), 0);

      // Calculate previous week for growth comparison
      const prevWeekStart = new Date(startOfWeek);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);

      const { data: prevWeekOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('restaurant_id', restaurant.id)
        .gte('created_at', prevWeekStart.toISOString())
        .lt('created_at', startOfWeek.toISOString())
        .neq('status', 'cancelled');

      const prevWeekRevenue = prevWeekOrders?.reduce((sum, o) => sum + Number(o.total || 0), 0) || 0;
      const weekGrowth = prevWeekRevenue > 0
        ? ((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100
        : 0;

      // Calculate month stats
      const monthOrders = orders?.filter(o =>
        new Date(o.created_at) >= startOfMonth
      ) || [];

      const monthRevenue = monthOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total || 0), 0);

      // Daily stats for chart
      const dailyStats: DailyStats[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(startOfToday);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayOrders = orders?.filter(o => {
          const orderDate = new Date(o.created_at).toISOString().split('T')[0];
          return orderDate === dateStr && o.status !== 'cancelled';
        }) || [];

        const dayRevenue = dayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

        dailyStats.push({
          date: dateStr,
          orders: dayOrders.length,
          revenue: dayRevenue,
          avgOrderValue: dayOrders.length > 0 ? dayRevenue / dayOrders.length : 0,
        });
      }

      // Top selling items
      const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const itemId = item.menu_item_id;
          const itemName = item.menu_items?.name || 'Unknown';
          if (!itemCounts[itemId]) {
            itemCounts[itemId] = { name: itemName, count: 0, revenue: 0 };
          }
          itemCounts[itemId].count += item.quantity;
          itemCounts[itemId].revenue += Number(item.subtotal || 0);
        });
      });

      const topItems: TopItem[] = Object.entries(itemCounts)
        .map(([id, data]) => ({
          id,
          name: data.name,
          totalOrdered: data.count,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.totalOrdered - a.totalOrdered)
        .slice(0, 10);

      // Orders by status
      const ordersByStatus: Record<string, number> = {};
      orders?.forEach(order => {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
      });

      // Peak hours analysis
      const hourCounts: Record<number, number> = {};
      orders?.forEach(order => {
        const hour = new Date(order.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const peakHours = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        orders: hourCounts[hour] || 0,
      }));

      // Customer retention
      const uniqueCustomers = new Set(orders?.map(o => o.customer_id));
      const customerOrderCounts: Record<string, number> = {};
      orders?.forEach(order => {
        customerOrderCounts[order.customer_id] = (customerOrderCounts[order.customer_id] || 0) + 1;
      });

      const returningCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
      const newCustomers = uniqueCustomers.size - returningCustomers;

      return {
        today: {
          orders: todayOrders.length,
          revenue: todayRevenue,
          avgOrderValue: todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0,
          completedOrders: todayOrders.filter(o => o.status === 'delivered').length,
          cancelledOrders: todayOrders.filter(o => o.status === 'cancelled').length,
        },
        thisWeek: {
          orders: weekOrders.length,
          revenue: weekRevenue,
          avgOrderValue: weekOrders.length > 0 ? weekRevenue / weekOrders.length : 0,
          growth: weekGrowth,
        },
        thisMonth: {
          orders: monthOrders.length,
          revenue: monthRevenue,
          avgOrderValue: monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0,
          growth: 0, // Would need previous month data
        },
        dailyStats,
        topItems,
        ordersByStatus,
        peakHours,
        customerRetention: {
          newCustomers,
          returningCustomers,
          retentionRate: uniqueCustomers.size > 0
            ? (returningCustomers / uniqueCustomers.size) * 100
            : 0,
        },
      };
    },
    enabled: !!restaurant?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for real-time order count
export function useRealtimeOrderCount() {
  const { data: restaurant } = useRestaurantProfile();

  return useQuery({
    queryKey: ['realtime-order-count', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return { pending: 0, preparing: 0, ready: 0 };

      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('restaurant_id', restaurant.id)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready_for_pickup']);

      if (error) throw error;

      return {
        pending: data?.filter(o => o.status === 'pending').length || 0,
        preparing: data?.filter(o => ['confirmed', 'preparing'].includes(o.status)).length || 0,
        ready: data?.filter(o => o.status === 'ready_for_pickup').length || 0,
      };
    },
    enabled: !!restaurant?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
