import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Users, Store, Package, DollarSign } from 'lucide-react';

export default function AdminAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      // Get order trends
      const { data: orders } = await supabase
        .from('orders')
        .select('created_at, total, status')
        .order('created_at', { ascending: false });

      // Get user stats
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get restaurant stats
      const { count: totalRestaurants } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true });

      const { count: activeRestaurants } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Calculate order metrics
      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter(o => o.status === 'delivered').length || 0;
      const totalRevenue = orders?.filter(o => o.status === 'delivered')
        .reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;

      // Calculate average order value
      const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

      // Get monthly trends
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const monthlyOrders = orders?.filter(o => 
        new Date(o.created_at) >= thisMonth
      ).length || 0;

      const monthlyRevenue = orders?.filter(o => 
        new Date(o.created_at) >= thisMonth && o.status === 'delivered'
      ).reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;

      return {
        totalUsers,
        totalRestaurants,
        activeRestaurants,
        totalOrders,
        completedOrders,
        totalRevenue,
        avgOrderValue,
        monthlyOrders,
        monthlyRevenue,
      };
    },
  });

  const { data: topRestaurants } = useQuery({
    queryKey: ['top-restaurants-analytics'],
    queryFn: async () => {
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id, name, rating');

      const restaurantData = await Promise.all(
        (restaurants || []).map(async (restaurant) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('total')
            .eq('restaurant_id', restaurant.id)
            .eq('status', 'delivered');

          const revenue = orders?.reduce((sum, order) => 
            sum + Number(order.total || 0), 0) || 0;

          return {
            ...restaurant,
            revenue,
            orderCount: orders?.length || 0,
          };
        })
      );

      return restaurantData
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    },
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6 bg-muted/30">
            <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

            {isLoading ? (
              <p>Loading analytics...</p>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.totalUsers}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
                      <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.activeRestaurants}</div>
                      <p className="text-xs text-muted-foreground">
                        of {analytics?.totalRestaurants} total
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.completedOrders}</div>
                      <p className="text-xs text-muted-foreground">
                        of {analytics?.totalOrders} completed
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${analytics?.totalRevenue.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${analytics?.avgOrderValue.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Performance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Orders</p>
                          <p className="text-2xl font-bold">{analytics?.monthlyOrders}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Revenue</p>
                          <p className="text-2xl font-bold">
                            ${analytics?.monthlyRevenue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Restaurants */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Restaurants by Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topRestaurants?.map((restaurant, index) => (
                        <div 
                          key={restaurant.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold text-muted-foreground">
                              #{index + 1}
                            </span>
                            <div>
                              <p className="font-semibold">{restaurant.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {restaurant.orderCount} orders • ⭐ {restaurant.rating}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              ${restaurant.revenue.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
