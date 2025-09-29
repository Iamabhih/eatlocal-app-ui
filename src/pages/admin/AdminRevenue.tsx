import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, Package, Truck } from 'lucide-react';

export default function AdminRevenue() {
  const { data: revenueStats, isLoading } = useQuery({
    queryKey: ['admin-revenue-stats'],
    queryFn: async () => {
      // Get total platform commission from orders
      const { data: orderCommissions } = await supabase
        .from('orders')
        .select('platform_commission, created_at')
        .eq('status', 'delivered');

      // Get total delivery fees from earnings
      const { data: deliveryFees } = await supabase
        .from('delivery_earnings')
        .select('platform_fee_amount, created_at');

      const totalOrderCommission = orderCommissions?.reduce((sum, order) => 
        sum + Number(order.platform_commission || 0), 0) || 0;

      const totalDeliveryFees = deliveryFees?.reduce((sum, earning) => 
        sum + Number(earning.platform_fee_amount || 0), 0) || 0;

      const totalRevenue = totalOrderCommission + totalDeliveryFees;

      // Calculate this month's revenue
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const monthlyOrderCommission = orderCommissions?.filter(o => 
        new Date(o.created_at) >= thisMonth
      ).reduce((sum, order) => sum + Number(order.platform_commission || 0), 0) || 0;

      const monthlyDeliveryFees = deliveryFees?.filter(d => 
        new Date(d.created_at) >= thisMonth
      ).reduce((sum, earning) => sum + Number(earning.platform_fee_amount || 0), 0) || 0;

      const monthlyRevenue = monthlyOrderCommission + monthlyDeliveryFees;

      return {
        totalRevenue,
        totalOrderCommission,
        totalDeliveryFees,
        monthlyRevenue,
        monthlyOrderCommission,
        monthlyDeliveryFees,
      };
    },
  });

  const { data: restaurantCommissions } = useQuery({
    queryKey: ['restaurant-commissions'],
    queryFn: async () => {
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id, name, commission_rate, custom_commission');

      const restaurantData = await Promise.all(
        (restaurants || []).map(async (restaurant) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('platform_commission')
            .eq('restaurant_id', restaurant.id)
            .eq('status', 'delivered');

          const totalCommission = orders?.reduce((sum, order) => 
            sum + Number(order.platform_commission || 0), 0) || 0;

          return {
            ...restaurant,
            totalCommission,
            orderCount: orders?.length || 0,
          };
        })
      );

      return restaurantData.sort((a, b) => b.totalCommission - a.totalCommission);
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
            <h1 className="text-3xl font-bold mb-6">Platform Revenue</h1>

            {isLoading ? (
              <p>Loading revenue data...</p>
            ) : (
              <>
                {/* Revenue Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${revenueStats?.totalRevenue.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">This Month</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${revenueStats?.monthlyRevenue.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Order Commissions</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${revenueStats?.totalOrderCommission.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Delivery Fees</CardTitle>
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${revenueStats?.totalDeliveryFees.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Restaurant Commissions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Restaurant Commission Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {restaurantCommissions?.map((restaurant) => (
                        <div 
                          key={restaurant.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-semibold">{restaurant.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {restaurant.orderCount} orders • {restaurant.commission_rate}% commission
                              {restaurant.custom_commission && ' (Custom)'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              ${restaurant.totalCommission.toFixed(2)}
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
