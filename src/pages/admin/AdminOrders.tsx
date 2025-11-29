import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Search,
  CalendarIcon,
  Filter,
  Eye,
  RefreshCw,
  Ban,
  Truck,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Store,
  Package,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import { ExportReportButton } from '@/components/admin/ExportReportButton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-800', icon: Package },
  ready_for_pickup: { label: 'Ready', color: 'bg-indigo-100 text-indigo-800', icon: Store },
  picked_up: { label: 'Picked Up', color: 'bg-cyan-100 text-cyan-800', icon: Truck },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: RefreshCw },
};

export default function AdminOrders() {
  const { toast } = useToast();
  const { orders, ordersLoading, updateOrder, refetchOrders } = useAdminData();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Selected order
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderSheet, setShowOrderSheet] = useState(false);

  // Modals
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          order.order_number?.toLowerCase().includes(search) ||
          order.restaurant?.name?.toLowerCase().includes(search) ||
          order.customer?.email?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;

      // Fulfillment filter
      if (fulfillmentFilter !== 'all' && order.fulfillment_type !== fulfillmentFilter) return false;

      // Date filter
      if (dateRange.from) {
        const orderDate = new Date(order.created_at);
        if (orderDate < dateRange.from) return false;
      }
      if (dateRange.to) {
        const orderDate = new Date(order.created_at);
        if (orderDate > dateRange.to) return false;
      }

      return true;
    });
  }, [orders, searchTerm, statusFilter, fulfillmentFilter, dateRange]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.created_at) >= today);

    return {
      total: orders.length,
      today: todayOrders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      inProgress: orders.filter(o => ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'out_for_delivery'].includes(o.status)).length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      todayRevenue: todayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    };
  }, [orders]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrder({ orderId, status: newStatus });
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: cancelReason,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({
        title: 'Order Cancelled',
        description: `Order ${selectedOrder.order_number} has been cancelled.`,
      });

      refetchOrders();
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefundOrder = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);

    try {
      // Create refund record
      const { error: refundError } = await supabase
        .from('order_refunds')
        .insert({
          order_id: selectedOrder.id,
          amount: refundAmount,
          reason: refundReason,
          status: 'processed',
          processed_at: new Date().toISOString(),
        });

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'refunded',
          refund_amount: refundAmount,
        })
        .eq('id', selectedOrder.id);

      if (refundError || orderError) throw refundError || orderError;

      toast({
        title: 'Refund Processed',
        description: `R${refundAmount.toFixed(2)} refunded for order ${selectedOrder.order_number}.`,
      });

      refetchOrders();
      setShowRefundDialog(false);
      setRefundAmount(0);
      setRefundReason('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setShowOrderSheet(true);
  };

  const StatusBadge = ({ status }: { status: OrderStatus }) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={cn('gap-1', config.color)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6 bg-muted/30 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Order Management</h1>
                <p className="text-muted-foreground">Monitor and manage all platform orders</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => refetchOrders()} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <ExportReportButton
                  reportType="orders"
                  data={filteredOrders.map(o => ({
                    ...o,
                    customer_name: o.customer?.email || 'N/A',
                    restaurant_name: o.restaurant?.name || 'N/A',
                  }))}
                  dateRange={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Delivered</p>
                  <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4">
                  <p className="text-xs text-green-700">Today's Revenue</p>
                  <p className="text-2xl font-bold text-green-700">R{stats.todayRevenue.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by order #, restaurant, or customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={fulfillmentFilter} onValueChange={setFulfillmentFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="pickup">Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')}
                            </>
                          ) : (
                            format(dateRange.from, 'MMM dd, yyyy')
                          )
                        ) : (
                          'Date Range'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="range"
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range: any) => setDateRange(range || { from: undefined, to: undefined })}
                        numberOfMonths={2}
                      />
                      {(dateRange.from || dateRange.to) && (
                        <div className="p-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDateRange({ from: undefined, to: undefined })}
                            className="w-full"
                          >
                            Clear dates
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
              <CardHeader>
                <CardTitle>Orders ({filteredOrders.length})</CardTitle>
                <CardDescription>
                  Click on any order to view details and manage it
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No orders found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Restaurant</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => viewOrderDetails(order)}
                        >
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{order.customer?.email?.split('@')[0] || 'N/A'}</TableCell>
                          <TableCell>{order.restaurant?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {order.fulfillment_type === 'delivery' ? (
                                <><Truck className="h-3 w-3 mr-1" /> Delivery</>
                              ) : (
                                <><Store className="h-3 w-3 mr-1" /> Pickup</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.order_items?.length || 0}</TableCell>
                          <TableCell className="text-right font-medium">
                            R{Number(order.total).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('en-ZA', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewOrderDetails(order);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* Order Details Sheet */}
      <Sheet open={showOrderSheet} onOpenChange={setShowOrderSheet}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Order {selectedOrder?.order_number}
              {selectedOrder && <StatusBadge status={selectedOrder.status} />}
            </SheetTitle>
            <SheetDescription>
              Created on {selectedOrder && new Date(selectedOrder.created_at).toLocaleString('en-ZA')}
            </SheetDescription>
          </SheetHeader>

          {selectedOrder && (
            <Tabs defaultValue="details" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 mt-4">
                {/* Customer Info */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <User className="h-4 w-4" /> Customer
                  </h4>
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedOrder.customer?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedOrder.customer?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Restaurant Info */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Store className="h-4 w-4" /> Restaurant
                  </h4>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="font-medium">{selectedOrder.restaurant?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.restaurant?.street_address}, {selectedOrder.restaurant?.city}
                    </p>
                  </div>
                </div>

                {/* Delivery Info */}
                {selectedOrder.fulfillment_type === 'delivery' && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4" /> Delivery Address
                    </h4>
                    <div className="bg-muted rounded-lg p-4">
                      <p>{selectedOrder.delivery_address?.street_address}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.delivery_address?.city}, {selectedOrder.delivery_address?.state}
                      </p>
                    </div>
                  </div>
                )}

                {/* Pickup Code */}
                {selectedOrder.fulfillment_type === 'pickup' && selectedOrder.pickup_code && (
                  <div>
                    <h4 className="font-medium mb-3">Pickup Code</h4>
                    <div className="bg-primary/10 border-2 border-primary rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold tracking-wider">{selectedOrder.pickup_code}</p>
                    </div>
                  </div>
                )}

                {/* Delivery Partner */}
                {selectedOrder.delivery_partner_id && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-3">
                      <Truck className="h-4 w-4" /> Delivery Partner
                    </h4>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="font-medium">
                        {selectedOrder.delivery_partner?.name || 'Assigned'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.delivery_partner?.phone || 'Contact info pending'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Summary */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4" /> Payment
                  </h4>
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>R{Number(selectedOrder.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>R{Number(selectedOrder.delivery_fee || 0).toFixed(2)}</span>
                    </div>
                    {selectedOrder.wallet_amount_used > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Wallet Credit</span>
                        <span>-R{Number(selectedOrder.wallet_amount_used).toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>R{Number(selectedOrder.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="items" className="mt-4">
                <div className="space-y-3">
                  {selectedOrder.order_items?.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-muted rounded-lg p-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.menu_item?.name || 'Item'}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity}x @ R{Number(item.unit_price).toFixed(2)}
                        </p>
                        {item.special_instructions && (
                          <p className="text-sm text-muted-foreground mt-1 italic">
                            Note: {item.special_instructions}
                          </p>
                        )}
                      </div>
                      <p className="font-medium">R{Number(item.subtotal).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="actions" className="mt-4 space-y-4">
                {/* Status Update */}
                <div>
                  <Label>Update Status</Label>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value: any) => {
                      handleStatusChange(selectedOrder.id, value);
                      setSelectedOrder({ ...selectedOrder, status: value });
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-2">
                  {!['cancelled', 'refunded'].includes(selectedOrder.status) && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setShowCancelDialog(true)}
                      >
                        <Ban className="h-4 w-4" />
                        Cancel Order
                      </Button>

                      {selectedOrder.status === 'delivered' && (
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={() => {
                            setRefundAmount(selectedOrder.total);
                            setShowRefundDialog(true);
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Process Refund
                        </Button>
                      )}
                    </>
                  )}

                  {selectedOrder.fulfillment_type === 'delivery' && !selectedOrder.delivery_partner_id && (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => setShowAssignDialog(true)}
                    >
                      <Truck className="h-4 w-4" />
                      Assign Delivery Partner
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order {selectedOrder?.order_number}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cancellation Reason</Label>
              <Textarea
                placeholder="Enter reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={isProcessing || !cancelReason}
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process a refund for order {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Refund Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R</span>
                <Input
                  type="number"
                  className="pl-8"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  max={selectedOrder?.total}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum: R{selectedOrder?.total?.toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Reason for Refund</Label>
              <Textarea
                placeholder="Enter reason for refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRefundOrder}
              disabled={isProcessing || !refundReason || refundAmount <= 0}
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
