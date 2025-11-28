import { MapPin, Clock, Phone, CheckCircle, Navigation, MapPinned } from "lucide-react"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/shared/Navbar";
import { useDeliveryOrders } from "@/hooks/useDeliveryOrders";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { useState } from "react";

const DeliveryOrders = () => {
  const { orders, updateOrderStatus, isLoading } = useDeliveryOrders();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  
  const { isTracking, lastLocation, startTracking, stopTracking } = useLocationTracking(
    activeOrderId,
    locationEnabled
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-blue-500",
      confirmed: "bg-orange-500",
      preparing: "bg-purple-500",
      ready_for_pickup: "bg-purple-600",
      picked_up: "bg-primary",
      delivered: "bg-gray-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const filterOrdersByStatus = (status: string) => {
    if (status === "active") {
      return orders.filter(order => ["ready_for_pickup", "picked_up"].includes(order.status));
    }
    if (status === "completed") {
      return orders.filter(order => order.status === "delivered");
    }
    if (status === "ready") {
      return orders.filter(order => order.status === "ready_for_pickup");
    }
    return orders.filter(order => order.status === status);
  };

  const OrderCard = ({ order }: { order: typeof orders[0] }) => (
    <Card className="shadow-card">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-lg">#{order.order_number}</h3>
              <Badge className={`${getStatusColor(order.status)} text-white`}>
                {order.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-2xl text-primary">R{Number(order.total).toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {/* Restaurant Info */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
              R
            </div>
            <div className="flex-1">
              <p className="font-medium">{order.restaurant?.name}</p>
              <p className="text-sm text-muted-foreground">
                {order.restaurant?.street_address}, {order.restaurant?.city}
              </p>
            </div>
            {(order.status === "ready_for_pickup" || order.status === "picked_up") && (
              <Button variant="outline" size="sm">
                <Navigation className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Customer Info */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              C
            </div>
            <div className="flex-1">
              <p className="font-medium">Customer</p>
              <p className="text-sm text-muted-foreground">
                {order.delivery_address?.street_address}, {order.delivery_address?.city}
              </p>
              {order.special_instructions && (
                <p className="text-sm italic mt-1">"{order.special_instructions}"</p>
              )}
            </div>
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Order Items */}
        <div className="border-t pt-4 mb-4">
          <h4 className="font-medium mb-2">Order Items</h4>
          <div className="space-y-1">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.menu_item?.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {order.status === "ready_for_pickup" && (
            <>
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => {
                  updateOrderStatus({ orderId: order.id, status: "picked_up" });
                  setActiveOrderId(order.id);
                  setLocationEnabled(true);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Picked Up & Start Tracking
              </Button>
            </>
          )}
          
          {order.status === "picked_up" && (
            <>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-2">
                <div className="flex items-center gap-2">
                  <MapPinned className="h-4 w-4 text-primary" />
                  <Label>Location Tracking</Label>
                </div>
                <Switch 
                  checked={locationEnabled && activeOrderId === order.id}
                  onCheckedChange={(checked) => {
                    setLocationEnabled(checked);
                    if (checked) {
                      setActiveOrderId(order.id);
                    } else {
                      setActiveOrderId(null);
                    }
                  }}
                />
              </div>
              {isTracking && activeOrderId === order.id && lastLocation && (
                <p className="text-xs text-muted-foreground mb-2">
                  📍 Location sharing active (Accuracy: {lastLocation.accuracy?.toFixed(0)}m)
                </p>
              )}
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => {
                  updateOrderStatus({ orderId: order.id, status: "delivered" });
                  setLocationEnabled(false);
                  setActiveOrderId(null);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Delivered
              </Button>
            </>
          )}

          {order.status === "delivered" && (
            <Badge variant="secondary" className="w-full justify-center py-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              Delivered Successfully
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar type="delivery" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Delivery Orders</h1>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              {filterOrdersByStatus("active").length} Active Orders
            </Badge>
            <Badge className="bg-primary hover:bg-primary/90">
              Online
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">
              Active ({filterOrdersByStatus("active").length})
            </TabsTrigger>
            <TabsTrigger value="ready">
              Ready ({filterOrdersByStatus("ready").length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({filterOrdersByStatus("completed").length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-6">
            {isLoading ? (
              <Card><CardContent className="pt-6 text-center text-muted-foreground">Loading...</CardContent></Card>
            ) : filterOrdersByStatus("active").length === 0 ? (
              <Card><CardContent className="pt-6 text-center text-muted-foreground">No active orders</CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filterOrdersByStatus("active").map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="ready" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterOrdersByStatus("ready").length === 0 ? (
                <Card><CardContent className="pt-6 text-center text-muted-foreground">No ready orders</CardContent></Card>
              ) : (
                filterOrdersByStatus("ready").map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterOrdersByStatus("completed").length === 0 ? (
                <Card><CardContent className="pt-6 text-center text-muted-foreground">No completed orders</CardContent></Card>
              ) : (
                filterOrdersByStatus("completed").map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DeliveryOrders;