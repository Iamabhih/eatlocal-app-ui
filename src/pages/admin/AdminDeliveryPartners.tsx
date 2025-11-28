import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Truck,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  Clock,
  Phone,
  Calendar,
  Wallet,
  ShieldCheck,
  ShieldX,
  CreditCard,
} from 'lucide-react';

export default function AdminDeliveryPartners() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);

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

  // Filter partners
  const filteredPartners = (deliveryPartners || []).filter((partner) => {
    const matchesSearch =
      partner.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'verified' && partner.is_verified) ||
      (statusFilter === 'unverified' && !partner.is_verified) ||
      (statusFilter === 'suspended' && partner.is_suspended) ||
      (statusFilter === 'active' && partner.activeDeliveries > 0);

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: deliveryPartners?.length || 0,
    verified: deliveryPartners?.filter((p) => p.is_verified).length || 0,
    active: deliveryPartners?.filter((p) => p.activeDeliveries > 0).length || 0,
    totalEarnings: deliveryPartners?.reduce((sum, p) => sum + p.totalEarnings, 0) || 0,
    platformFees: deliveryPartners?.reduce((sum, p) => sum + p.totalFees, 0) || 0,
    unpaidEarnings: deliveryPartners?.reduce((sum, p) => sum + p.unpaidEarnings, 0) || 0,
  };

  // Verify/unverify mutation
  const toggleVerifyMutation = useMutation({
    mutationFn: async ({ userId, verify }: { userId: string; verify: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: verify, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-partners'] });
      toast.success(variables.verify ? 'Partner verified' : 'Partner unverified');
    },
    onError: (error) => {
      toast.error('Failed to update verification: ' + error.message);
    },
  });

  // Suspend/unsuspend mutation
  const toggleSuspendMutation = useMutation({
    mutationFn: async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: suspend, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-partners'] });
      toast.success(variables.suspend ? 'Partner suspended' : 'Partner activated');
      setShowSuspendDialog(false);
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });

  // Process payout mutation
  const processPayoutMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await supabase
        .from('delivery_earnings')
        .update({ paid_out: true, paid_out_at: new Date().toISOString() })
        .eq('delivery_partner_id', partnerId)
        .eq('paid_out', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-partners'] });
      toast.success('Payout processed successfully');
      setShowPayoutDialog(false);
    },
    onError: (error) => {
      toast.error('Failed to process payout: ' + error.message);
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Total</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Verified</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Truck className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Active Now</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Total Earnings</span>
                  </div>
                  <p className="text-2xl font-bold">R{stats.totalEarnings.toFixed(0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Platform Fees</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">R{stats.platformFees.toFixed(0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Wallet className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Unpaid</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">R{stats.unpaidEarnings.toFixed(0)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Partners</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                      <SelectItem value="active">Currently Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Partners Table */}
            <Card>
              <CardHeader>
                <CardTitle>Partners ({filteredPartners.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading delivery partners...</p>
                ) : filteredPartners.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No delivery partners found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Partner</TableHead>
                          <TableHead>Verification</TableHead>
                          <TableHead>Deliveries</TableHead>
                          <TableHead>Earnings</TableHead>
                          <TableHead>Unpaid</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-12">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPartners.map((partner) => (
                          <TableRow key={partner.id} className={partner.is_suspended ? 'opacity-60' : ''}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Truck className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{partner.full_name}</p>
                                  <p className="text-xs text-muted-foreground">{partner.phone || 'No phone'}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {partner.is_verified ? (
                                <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                                  <ShieldCheck className="h-3 w-3" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600">
                                  <Clock className="h-3 w-3" />
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{partner.completedDeliveries}</span>
                                <span className="text-muted-foreground text-sm">completed</span>
                                {partner.activeDeliveries > 0 && (
                                  <Badge className="ml-1">{partner.activeDeliveries} active</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">R{partner.totalEarnings.toFixed(0)}</p>
                                <p className="text-xs text-muted-foreground">Net: R{partner.netPayout.toFixed(0)}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`font-semibold ${partner.unpaidEarnings > 0 ? 'text-orange-600' : ''}`}>
                                R{partner.unpaidEarnings.toFixed(0)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {partner.is_suspended ? (
                                <Badge variant="destructive" className="gap-1">
                                  <Ban className="h-3 w-3" />
                                  Suspended
                                </Badge>
                              ) : partner.activeDeliveries > 0 ? (
                                <Badge className="gap-1 bg-green-600">
                                  <Truck className="h-3 w-3" />
                                  On Delivery
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Idle</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedPartner(partner);
                                      setShowDetailsDialog(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      toggleVerifyMutation.mutate({
                                        userId: partner.id,
                                        verify: !partner.is_verified,
                                      });
                                    }}
                                  >
                                    {partner.is_verified ? (
                                      <>
                                        <ShieldX className="h-4 w-4 mr-2" />
                                        Remove Verification
                                      </>
                                    ) : (
                                      <>
                                        <ShieldCheck className="h-4 w-4 mr-2" />
                                        Verify Partner
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  {partner.unpaidEarnings > 0 && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedPartner(partner);
                                        setShowPayoutDialog(true);
                                      }}
                                    >
                                      <CreditCard className="h-4 w-4 mr-2" />
                                      Process Payout
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedPartner(partner);
                                      setShowSuspendDialog(true);
                                    }}
                                    className={partner.is_suspended ? 'text-green-600' : 'text-destructive'}
                                  >
                                    {partner.is_suspended ? (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Activate Partner
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="h-4 w-4 mr-2" />
                                        Suspend Partner
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* Partner Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Partner Details</DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedPartner.full_name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {selectedPartner.id.slice(0, 8)}...</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedPartner.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {new Date(selectedPartner.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Deliveries</p>
                  <p className="text-2xl font-bold">{selectedPartner.completedDeliveries}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Deliveries</p>
                  <p className="text-2xl font-bold">{selectedPartner.activeDeliveries}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">R{selectedPartner.totalEarnings.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unpaid Amount</p>
                  <p className="text-2xl font-bold text-orange-600">R{selectedPartner.unpaidEarnings.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Badge variant={selectedPartner.is_verified ? 'default' : 'secondary'}>
                  {selectedPartner.is_verified ? 'Verified' : 'Unverified'}
                </Badge>
                <Badge variant={selectedPartner.is_suspended ? 'destructive' : 'outline'}>
                  {selectedPartner.is_suspended ? 'Suspended' : 'Active'}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend/Activate Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPartner?.is_suspended ? 'Activate Partner' : 'Suspend Partner'}
            </DialogTitle>
            <DialogDescription>
              {selectedPartner?.is_suspended
                ? `Are you sure you want to activate ${selectedPartner?.full_name}? They will be able to accept deliveries again.`
                : `Are you sure you want to suspend ${selectedPartner?.full_name}? They will not be able to accept new deliveries.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedPartner?.is_suspended ? 'default' : 'destructive'}
              onClick={() => {
                if (selectedPartner) {
                  toggleSuspendMutation.mutate({
                    userId: selectedPartner.id,
                    suspend: !selectedPartner.is_suspended,
                  });
                }
              }}
              disabled={toggleSuspendMutation.isPending}
            >
              {selectedPartner?.is_suspended ? 'Activate' : 'Suspend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Payout Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogDescription>
              Process payout of R{selectedPartner?.unpaidEarnings?.toFixed(2)} to {selectedPartner?.full_name}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will mark all unpaid earnings as paid. Make sure you have transferred the funds before confirming.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedPartner) {
                  processPayoutMutation.mutate(selectedPartner.id);
                }
              }}
              disabled={processPayoutMutation.isPending}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Confirm Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
