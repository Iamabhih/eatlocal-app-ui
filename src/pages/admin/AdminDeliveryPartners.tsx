import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDeliveryPartners() {
  const { data: deliveryPartners, isLoading } = useQuery({
    queryKey: ['admin-delivery-partners'],
    queryFn: async () => {
      // Get all users with delivery role
      const { data: deliveryRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'delivery_partner');

      if (!deliveryRoles || deliveryRoles.length === 0) return [];

      const deliveryUserIds = deliveryRoles.map(r => r.user_id);

      // Get profiles for these users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', deliveryUserIds);

      // Get earnings for each partner
      const partnersWithEarnings = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: earnings } = await supabase
            .from('delivery_earnings')
            .select('total_earnings, platform_fee_amount, net_payout, paid_out')
            .eq('delivery_partner_id', profile.id);

          const { data: orders } = await supabase
            .from('orders')
            .select('id, status')
            .eq('delivery_partner_id', profile.id);

          const totalEarnings = earnings?.reduce((sum, e) => 
            sum + Number(e.total_earnings || 0), 0) || 0;

          const totalFees = earnings?.reduce((sum, e) => 
            sum + Number(e.platform_fee_amount || 0), 0) || 0;

          const netPayout = earnings?.reduce((sum, e) => 
            sum + Number(e.net_payout || 0), 0) || 0;

          const unpaidEarnings = earnings?.filter(e => !e.paid_out)
            .reduce((sum, e) => sum + Number(e.net_payout || 0), 0) || 0;

          const completedDeliveries = orders?.filter(o => o.status === 'delivered').length || 0;
          const activeDeliveries = orders?.filter(o => 
            ['accepted', 'ready', 'picked_up'].includes(o.status)
          ).length || 0;

          return {
            ...profile,
            totalEarnings,
            totalFees,
            netPayout,
            unpaidEarnings,
            completedDeliveries,
            activeDeliveries,
          };
        })
      );

      return partnersWithEarnings;
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
            <h1 className="text-3xl font-bold mb-6">Delivery Partners</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{deliveryPartners?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R{deliveryPartners?.reduce((sum, p) => sum + p.totalEarnings, 0).toFixed(2) || '0.00'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R{deliveryPartners?.reduce((sum, p) => sum + p.totalFees, 0).toFixed(2) || '0.00'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Unpaid Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R{deliveryPartners?.reduce((sum, p) => sum + p.unpaidEarnings, 0).toFixed(2) || '0.00'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Partners Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Delivery Partners</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading delivery partners...</p>
                ) : deliveryPartners && deliveryPartners.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Deliveries</TableHead>
                        <TableHead>Total Earnings</TableHead>
                        <TableHead>Platform Fees</TableHead>
                        <TableHead>Net Payout</TableHead>
                        <TableHead>Unpaid</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveryPartners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell className="font-medium">{partner.full_name}</TableCell>
                          <TableCell>{partner.phone || 'N/A'}</TableCell>
                          <TableCell>
                            {partner.completedDeliveries} completed
                            {partner.activeDeliveries > 0 && (
                              <Badge variant="outline" className="ml-2">
                                {partner.activeDeliveries} active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>R{partner.totalEarnings.toFixed(2)}</TableCell>
                          <TableCell>R{partner.totalFees.toFixed(2)}</TableCell>
                          <TableCell>R{partner.netPayout.toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">
                            R{partner.unpaidEarnings.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {partner.activeDeliveries > 0 ? (
                              <Badge>Active</Badge>
                            ) : (
                              <Badge variant="secondary">Idle</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No delivery partners found
                  </p>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
