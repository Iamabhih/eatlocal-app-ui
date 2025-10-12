import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, Package, Truck, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function AdminRevenue() {
  const { toast } = useToast();
  const [showTransactions, setShowTransactions] = useState(false);

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

  const { data: transactions } = useQuery({
    queryKey: ['revenue-transactions'],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          platform_commission,
          status,
          restaurants(name)
        `)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(100);

      return orders;
    },
    enabled: showTransactions,
  });

  const exportToCSV = () => {
    if (!transactions) return;

    const headers = ['Order Number', 'Date', 'Restaurant', 'Commission', 'Status'];
    const rows = transactions.map((t: any) => [
      t.order_number,
      new Date(t.created_at).toLocaleDateString(),
      t.restaurants?.name || 'N/A',
      `$${Number(t.platform_commission || 0).toFixed(2)}`,
      t.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast({ title: 'Report exported successfully' });
  };

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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Restaurant Commission Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {restaurantCommissions?.slice(0, 10).map((restaurant) => (
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

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Recent Transactions</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowTransactions(!showTransactions)}
                        >
                          {showTransactions ? 'Hide' : 'Show'} Details
                        </Button>
                        {showTransactions && (
                          <Button 
                            size="sm" 
                            onClick={exportToCSV}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {showTransactions && transactions ? (
                        <div className="max-h-[500px] overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Order #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Restaurant</TableHead>
                                <TableHead>Commission</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transactions.map((transaction: any) => (
                                <TableRow key={transaction.id}>
                                  <TableCell className="font-mono text-sm">
                                    {transaction.order_number}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {new Date(transaction.created_at).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>{transaction.restaurants?.name}</TableCell>
                                  <TableCell className="font-semibold">
                                    ${Number(transaction.platform_commission || 0).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          Click "Show Details" to view transaction history
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
