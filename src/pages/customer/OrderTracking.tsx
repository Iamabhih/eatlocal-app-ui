import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Phone, MessageSquare, Package, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/shared/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  estimated_delivery_time: string | null;
  created_at: string;
  restaurant_id: string;
  delivery_partner_id: string | null;
}

interface Restaurant {
  name: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
}

interface DeliveryLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth?role=customer');
      return;
    }

    fetchOrderDetails();
    subscribeToOrderUpdates();
  }, [user, orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('customer_id', user?.id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('name, phone, street_address, city, state')
        .eq('id', orderData.restaurant_id)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Fetch delivery partner location if assigned
      if (orderData.delivery_partner_id) {
        const { data: locationData } = await supabase
          .from('delivery_partner_locations')
          .select('latitude, longitude, updated_at')
          .eq('order_id', orderId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (locationData) {
          setDeliveryLocation(locationData);
        }
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const subscribeToOrderUpdates = () => {
    if (!orderId) return;

    // Subscribe to order status changes
    const orderChannel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log('Order updated:', payload);
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    // Subscribe to delivery partner location updates
    const locationChannel = supabase
      .channel(`location-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_partner_locations',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log('Location updated:', payload);
          if (payload.new) {
            setDeliveryLocation(payload.new as DeliveryLocation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(locationChannel);
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'confirmed':
      case 'preparing':
        return <Package className="h-5 w-5" />;
      case 'ready':
      case 'picked_up':
      case 'delivering':
        return <MapPin className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
      case 'preparing':
        return 'bg-blue-500';
      case 'ready':
      case 'picked_up':
      case 'delivering':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar type="customer" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading order details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order || !restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar type="customer" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
            <Button onClick={() => navigate('/customer')}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar type="customer" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">Order #{order.order_number}</p>
        </div>

        {/* Status Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(order.status)}
              Order Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Badge className={`${getStatusColor(order.status)} text-white`}>
                {getStatusText(order.status)}
              </Badge>
              {order.estimated_delivery_time && (
                <span className="text-sm text-muted-foreground">
                  Estimated: {new Date(order.estimated_delivery_time).toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${order.status === 'pending' ? 'bg-primary' : 'bg-muted'}`} />
                <div className="flex-1">
                  <p className="font-medium">Order Placed</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${['confirmed', 'preparing', 'ready', 'picked_up', 'delivering', 'delivered'].includes(order.status) ? 'bg-primary' : 'bg-muted'}`} />
                <div className="flex-1">
                  <p className="font-medium">Restaurant Preparing</p>
                  <p className="text-sm text-muted-foreground">
                    Your order is being prepared
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${['picked_up', 'delivering', 'delivered'].includes(order.status) ? 'bg-primary' : 'bg-muted'}`} />
                <div className="flex-1">
                  <p className="font-medium">Out for Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    {deliveryLocation 
                      ? `Last updated: ${new Date(deliveryLocation.updated_at).toLocaleTimeString()}`
                      : 'Waiting for driver'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${order.status === 'delivered' ? 'bg-primary' : 'bg-muted'}`} />
                <div className="flex-1">
                  <p className="font-medium">Delivered</p>
                  <p className="text-sm text-muted-foreground">
                    Your order has arrived
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Restaurant Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="font-semibold">{restaurant.name}</p>
                <p className="text-sm text-muted-foreground">
                  {restaurant.street_address}, {restaurant.city}, {restaurant.state}
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Phone className="h-4 w-4" />
                Call Restaurant
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Partner Info */}
        {order.delivery_partner_id && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Delivery Partner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 flex-1">
                  <Phone className="h-4 w-4" />
                  Call Driver
                </Button>
                <Button variant="outline" size="sm" className="gap-2 flex-1">
                  <MessageSquare className="h-4 w-4" />
                  Message
                </Button>
              </div>
              {deliveryLocation && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    📍 Driver location updated {new Date(deliveryLocation.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>${order.delivery_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderTracking;
