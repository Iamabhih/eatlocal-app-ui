import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Users, Store, Package, DollarSign, Clock, MapPin, UserCheck, UserX, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState('30');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics-enhanced', timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
      const prevStart = new Date(daysAgo);
      prevStart.setDate(prevStart.getDate() - parseInt(timeRange));

      // Current period orders
      const { data: orders } = await supabase
        .from('orders')
        .select('created_at, total, status, customer_id, restaurant_id, delivery_fee, platform_commission')
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Previous period orders for comparison
      const { data: prevOrders } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', prevStart.toISOString())
        .lt('created_at', daysAgo.toISOString());

      // Users
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: totalRestaurants } = await supabase.from('restaurants').select('*', { count: 'exact', head: true });
      const { count: activeRestaurants } = await supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('is_active', true);
      const { count: totalDrivers } = await supabase.from('delivery_partner_status').select('*', { count: 'exact', head: true });
      const { count: onlineDrivers } = await supabase.from('delivery_partner_status').select('*', { count: 'exact', head: true }).eq('is_online', true);

      const completedOrders = orders?.filter(o => o.status === 'delivered') || [];
      const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const platformCommission = completedOrders.reduce((sum, o) => sum + Number(o.platform_commission || 0), 0);
      const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

      const prevCompleted = prevOrders?.filter(o => o.status === 'delivered') || [];
      const prevRevenue = prevCompleted.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      const orderGrowth = prevCompleted.length > 0 ? ((completedOrders.length - prevCompleted.length) / prevCompleted.length) * 100 : 0;

      // Daily trends
      const dailyData: Record<string, { date: string; orders: number; revenue: number; newUsers: number }> = {};
      orders?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
        if (!dailyData[date]) dailyData[date] = { date, orders: 0, revenue: 0, newUsers: 0 };
        dailyData[date].orders++;
        if (order.status === 'delivered') dailyData[date].revenue += Number(order.total || 0);
      });

      // Order status distribution
      const statusCounts: Record<string, number> = {};
      orders?.forEach(order => { statusCounts[order.status] = (statusCounts[order.status] || 0) + 1; });

      // Customer segmentation
      const customerOrders: Record<string, number> = {};
      orders?.forEach(o => { customerOrders[o.customer_id] = (customerOrders[o.customer_id] || 0) + 1; });
      const uniqueCustomers = Object.keys(customerOrders).length;
      const oneTimeCustomers = Object.values(customerOrders).filter(c => c === 1).length;
      const repeatCustomers = uniqueCustomers - oneTimeCustomers;
      const loyalCustomers = Object.values(customerOrders).filter(c => c >= 5).length;

      // Peak hours
      const hourCounts: Record<number, number> = {};
      orders?.forEach(o => { const h = new Date(o.created_at).getHours(); hourCounts[h] = (hourCounts[h] || 0) + 1; });
      const peakHours = Array.from({ length: 24 }, (_, h) => ({
        hour: `${h.toString().padStart(2, '0')}:00`,
        orders: hourCounts[h] || 0,
      }));

      // Top restaurants by order volume
      const restaurantCounts: Record<string, number> = {};
      orders?.forEach(o => { restaurantCounts[o.restaurant_id] = (restaurantCounts[o.restaurant_id] || 0) + 1; });
      const topRestIds = Object.entries(restaurantCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
      const { data: topRests } = await supabase.from('restaurants').select('id, name, city, rating').in('id', topRestIds.length ? topRestIds : ['none']);
      const topRestaurants = (topRests || []).map(r => ({
        ...r,
        orders: restaurantCounts[r.id] || 0,
      })).sort((a, b) => b.orders - a.orders);

      // Geographic distribution (by city)
      const { data: cityData } = await supabase.from('restaurants').select('city').eq('is_active', true);
      const cityCounts: Record<string, number> = {};
      cityData?.forEach(r => { cityCounts[r.city] = (cityCounts[r.city] || 0) + 1; });
      const geographicData = Object.entries(cityCounts).map(([city, count]) => ({ city, restaurants: count })).sort((a, b) => b.restaurants - a.restaurants).slice(0, 8);

      return {
        totalUsers, totalRestaurants, activeRestaurants, totalDrivers, onlineDrivers,
        totalOrders: orders?.length || 0,
        completedOrders: completedOrders.length,
        totalRevenue, platformCommission, avgOrderValue,
        revenueGrowth, orderGrowth,
        dailyTrends: Object.values(dailyData),
        statusDistribution: Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })),
        customerSegmentation: { uniqueCustomers, oneTimeCustomers, repeatCustomers, loyalCustomers },
        peakHours,
        topRestaurants,
        geographicData,
      };
    },
  });

  const GrowthBadge = ({ value }: { value: number }) => (
    <div className={`flex items-center gap-1 text-xs font-medium ${value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
      {value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </div>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6 bg-muted/30 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Platform performance overview</p>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="customers">Customers</TabsTrigger>
                  <TabsTrigger value="operations">Operations</TabsTrigger>
                  <TabsTrigger value="geographic">Geographic</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">R{analytics?.totalRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
                        <GrowthBadge value={analytics?.revenueGrowth || 0} />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium">Platform Earnings</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">R{analytics?.platformCommission.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Commission earned</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium">Orders</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics?.completedOrders}</div>
                        <GrowthBadge value={analytics?.orderGrowth || 0} />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium">Avg Order</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">R{analytics?.avgOrderValue.toFixed(2)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium">Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics?.totalUsers}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium">Drivers Online</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics?.onlineDrivers || 0}</div>
                        <p className="text-xs text-muted-foreground">of {analytics?.totalDrivers || 0} total</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue & Orders Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={analytics?.dailyTrends}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} name="Revenue (R)" />
                            <Line yAxisId="right" type="monotone" dataKey="orders" stroke="hsl(var(--chart-2))" name="Orders" />
                          </AreaChart>
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
                            <Pie data={analytics?.statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                              {analytics?.statusDistribution?.map((_: any, i: number) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Restaurants */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Restaurants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics?.topRestaurants?.map((r: any, i: number) => (
                          <div key={r.id} className="flex items-center gap-4 p-3 rounded-lg border">
                            <span className="text-2xl font-bold text-muted-foreground w-8">#{i + 1}</span>
                            <div className="flex-1">
                              <p className="font-semibold">{r.name}</p>
                              <p className="text-sm text-muted-foreground">{r.city} • ⭐ {r.rating}</p>
                            </div>
                            <Badge variant="secondary">{r.orders} orders</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* CUSTOMERS TAB */}
                <TabsContent value="customers" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Unique Customers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{analytics?.customerSegmentation.uniqueCustomers}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">One-Time Buyers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{analytics?.customerSegmentation.oneTimeCustomers}</div>
                        <p className="text-xs text-muted-foreground">Opportunity to convert</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Repeat Customers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-primary">{analytics?.customerSegmentation.repeatCustomers}</div>
                        <p className="text-xs text-muted-foreground">2+ orders</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Loyal Customers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{analytics?.customerSegmentation.loyalCustomers}</div>
                        <p className="text-xs text-muted-foreground">5+ orders</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Retention Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { label: 'One-Time', value: analytics?.customerSegmentation.oneTimeCustomers || 0, total: analytics?.customerSegmentation.uniqueCustomers || 1, color: 'bg-muted-foreground' },
                          { label: 'Repeat (2-4 orders)', value: (analytics?.customerSegmentation.repeatCustomers || 0) - (analytics?.customerSegmentation.loyalCustomers || 0), total: analytics?.customerSegmentation.uniqueCustomers || 1, color: 'bg-primary' },
                          { label: 'Loyal (5+ orders)', value: analytics?.customerSegmentation.loyalCustomers || 0, total: analytics?.customerSegmentation.uniqueCustomers || 1, color: 'bg-chart-2' },
                        ].map(seg => (
                          <div key={seg.label} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{seg.label}</span>
                              <span className="font-medium">{seg.value} ({((seg.value / seg.total) * 100).toFixed(1)}%)</span>
                            </div>
                            <Progress value={(seg.value / seg.total) * 100} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* OPERATIONS TAB */}
                <TabsContent value="operations" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Peak Ordering Hours</CardTitle>
                      <CardDescription>Order volume by hour of day</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics?.peakHours}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="hour" className="text-xs" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Orders" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Active Restaurants</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{analytics?.activeRestaurants}</div>
                        <p className="text-xs text-muted-foreground">of {analytics?.totalRestaurants} total</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Delivery Partners</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{analytics?.totalDrivers || 0}</div>
                        <p className="text-xs text-muted-foreground">{analytics?.onlineDrivers || 0} online now</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Completion Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {analytics?.totalOrders ? ((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(1) : 0}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* GEOGRAPHIC TAB */}
                <TabsContent value="geographic" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Restaurant Distribution by City</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics?.geographicData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" />
                          <YAxis dataKey="city" type="category" width={120} className="text-xs" />
                          <Tooltip />
                          <Bar dataKey="restaurants" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Restaurants" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analytics?.geographicData?.map((city: any) => (
                      <Card key={city.city}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-semibold">{city.city}</p>
                              <p className="text-sm text-muted-foreground">{city.restaurants} restaurant{city.restaurants !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
