import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Users, Store, Package, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState('30');

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

  const { data: orderTrends } = useQuery({
    queryKey: ['order-trends', timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      const { data: orders } = await supabase
        .from('orders')
        .select('created_at, total, status')
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: true });

      const dailyData: Record<string, { date: string; orders: number; revenue: number }> = {};
      
      orders?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString();
        if (!dailyData[date]) {
          dailyData[date] = { date, orders: 0, revenue: 0 };
        }
        dailyData[date].orders++;
        if (order.status === 'delivered') {
          dailyData[date].revenue += Number(order.total || 0);
        }
      });

      return Object.values(dailyData);
    },
  });

  const { data: orderStatusData } = useQuery({
    queryKey: ['order-status-distribution'],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('status');

      const statusCounts: Record<string, number> = {};
      orders?.forEach(order => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });

      return Object.entries(statusCounts).map(([status, count]) => ({
        name: status.replace('_', ' '),
        value: count,
      }));
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
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Time Range:</span>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={orderTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" name="Orders" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={orderTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue ($)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Order Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={orderStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {orderStatusData?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>This Month Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Orders</p>
                          <p className="text-3xl font-bold">{analytics?.monthlyOrders}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Revenue</p>
                          <p className="text-3xl font-bold">
                            ${analytics?.monthlyRevenue.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Avg Order Value</p>
                          <p className="text-3xl font-bold">
                            ${analytics?.monthlyOrders > 0 ? (analytics.monthlyRevenue / analytics.monthlyOrders).toFixed(2) : '0.00'}
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
