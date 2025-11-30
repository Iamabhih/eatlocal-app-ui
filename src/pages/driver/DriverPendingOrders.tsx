import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  Clock,
  DollarSign,
  Navigation,
  CheckCircle,
  XCircle,
  Package,
  Store,
  User,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface PendingOrder {
  id: string;
  order_id: string;
  restaurant_name: string;
  restaurant_address: string;
  customer_address: string;
  distance_km: number;
  estimated_earnings: number;
  items_count: number;
  created_at: string;
  expires_at: string;
  order: {
    id: string;
    total: number;
    customer: {
      full_name: string;
      phone: string;
    };
  };
}

export default function DriverPendingOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Fetch pending order offers for this driver
  const { data: pendingOrders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-pending-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get the driver profile
      const { data: driver } = await supabase
        .from('delivery_partners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!driver) return [];

      // Get pending order offers
      const { data, error } = await supabase
        .from('order_offers')
        .select(`
          id,
          order_id,
          estimated_earnings,
          distance_km,
          created_at,
          expires_at,
          order:orders!order_offers_order_id_fkey(
            id,
            total,
            delivery_address,
            special_instructions,
            restaurant:restaurants!orders_restaurant_id_fkey(
              name,
              address
            ),
            order_items(count)
          )
        `)
        .eq('driver_id', driver.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((offer: any) => ({
        id: offer.id,
        order_id: offer.order_id,
        restaurant_name: offer.order?.restaurant?.name || 'Unknown',
        restaurant_address: offer.order?.restaurant?.address || '',
        customer_address: offer.order?.delivery_address || '',
        distance_km: offer.distance_km || 0,
        estimated_earnings: offer.estimated_earnings || 0,
        items_count: offer.order?.order_items?.[0]?.count || 0,
        created_at: offer.created_at,
        expires_at: offer.expires_at,
        order: offer.order,
      })) as PendingOrder[];
    },
    refetchInterval: 10000, // Poll every 10 seconds
    enabled: !!user,
  });

  // Accept order mutation
  const acceptMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from('order_offers')
        .update({ status: 'accepted' })
        .eq('id', offerId);

      if (error) throw error;
    },
    onMutate: (offerId) => {
      setAcceptingId(offerId);
    },
    onSuccess: () => {
      toast({
        title: 'Order Accepted',
        description: 'You have successfully accepted the delivery order.',
      });
      queryClient.invalidateQueries({ queryKey: ['driver-pending-orders'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Accept',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setAcceptingId(null);
    },
  });

  // Reject order mutation
  const rejectMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from('order_offers')
        .update({ status: 'rejected' })
        .eq('id', offerId);

      if (error) throw error;
    },
    onMutate: (offerId) => {
      setRejectingId(offerId);
    },
    onSuccess: () => {
      toast({
        title: 'Order Declined',
        description: 'You have declined the delivery order.',
      });
      queryClient.invalidateQueries({ queryKey: ['driver-pending-orders'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Decline',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setRejectingId(null);
    },
  });

  const getTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pending Orders</h1>
          <p className="text-muted-foreground">
            Accept or decline delivery requests
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {!pendingOrders || pendingOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Pending Orders</h2>
            <p className="text-muted-foreground">
              You don't have any pending delivery requests at the moment.
              New orders will appear here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    {order.restaurant_name}
                  </CardTitle>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getTimeRemaining(order.expires_at)}
                  </Badge>
                </div>
                <CardDescription>
                  {order.items_count} items
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pickup */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Store className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Pickup</p>
                    <p className="font-medium truncate">{order.restaurant_address}</p>
                  </div>
                </div>

                {/* Drop-off */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Delivery</p>
                    <p className="font-medium truncate">{order.customer_address}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {order.distance_km.toFixed(1)} km
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      R{order.estimated_earnings.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => rejectMutation.mutate(order.id)}
                    disabled={rejectingId === order.id || acceptingId === order.id}
                  >
                    {rejectingId === order.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Decline
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => acceptMutation.mutate(order.id)}
                    disabled={acceptingId === order.id || rejectingId === order.id}
                  >
                    {acceptingId === order.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Accept
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
