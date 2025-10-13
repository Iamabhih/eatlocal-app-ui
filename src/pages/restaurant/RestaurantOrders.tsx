import { Clock, CheckCircle, XCircle, Eye, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RestaurantLayout } from "@/components/restaurant/RestaurantLayout";
import { useRestaurantProfile } from "@/hooks/useRestaurantData";
import { useRestaurantOrders } from "@/hooks/useRestaurantOrders";

const RestaurantOrders = () => {
  const { data: restaurant } = useRestaurantProfile();
  const { orders, updateOrderStatus, isLoading } = useRestaurantOrders(restaurant?.id);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-blue-500",
      confirmed: "bg-orange-500",
      preparing: "bg-yellow-500",
      ready_for_pickup: "bg-uber-green",
      picked_up: "bg-purple-500",
      delivered: "bg-gray-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const filterOrdersByStatus = (status: string) => {
    if (status === "active") {
      return orders.filter(order => 
        ["pending", "confirmed", "preparing", "ready_for_pickup"].includes(order.status)
      );
    }
    if (status === "new") {
      return orders.filter(order => order.status === "pending");
    }
    if (status === "completed") {
      return orders.filter(order => ["delivered", "cancelled"].includes(order.status));
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
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-xl">${Number(order.total).toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Customer:</span>
            <span>{order.customer?.full_name || 'Customer'}</span>
            {order.customer?.phone && (
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
            )}
          </div>
          {order.delivery_address && (
            <div>
              <span className="font-medium">Address:</span>
              <span className="ml-2 text-sm">
                {order.delivery_address.street_address}, {order.delivery_address.city}
              </span>
            </div>
          )}
          {order.special_instructions && (
            <div>
              <span className="font-medium">Instructions:</span>
              <span className="ml-2 text-sm italic">{order.special_instructions}</span>
            </div>
          )}
        </div>

        <div className="border-t pt-4 mb-4">
          <h4 className="font-medium mb-3">Order Items</h4>
          <div className="space-y-2">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span className="font-medium">
                    {item.quantity}x {item.menu_item?.name || 'Item'}
                  </span>
                  {item.special_instructions && (
                    <p className="text-muted-foreground text-xs ml-4">
                      {item.special_instructions}
                    </p>
                  )}
                </div>
                <span>R{Number(item.subtotal).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Total</span>
              <span>R{Number(order.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Platform Commission (15%)</span>
              <span>- R{Number(order.platform_commission || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Settlement Fee (4.5%)</span>
              <span>- R{Number(order.settlement_fee || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-primary pt-2 border-t">
              <span>Your Payout</span>
              <span>R{Number(order.net_restaurant_payout || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{order.order_items?.length || 0} items</span>
          </div>
          
          <div className="flex gap-2">
            {order.status === "pending" && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateOrderStatus({ orderId: order.id, status: "cancelled" })}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button 
                  size="sm"
                  onClick={() => updateOrderStatus({ orderId: order.id, status: "confirmed" })}
                  className="bg-uber-green hover:bg-uber-green-hover"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept
                </Button>
              </>
            )}
            
            {(order.status === "confirmed" || order.status === "preparing") && (
              <Button 
                size="sm"
                onClick={() => updateOrderStatus({ orderId: order.id, status: "ready_for_pickup" })}
                className="bg-uber-green hover:bg-uber-green-hover"
              >
                Mark Ready for Pickup
              </Button>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Order Details - #{order.order_number}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Customer Information</h4>
                    <p>{order.customer?.full_name || 'Customer'}</p>
                    <p className="text-sm text-muted-foreground">{order.customer?.phone}</p>
                    {order.delivery_address && (
                      <p className="text-sm text-muted-foreground">
                        {order.delivery_address.street_address}, {order.delivery_address.city}
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Order Items</h4>
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="border-b pb-2 mb-2 last:border-b-0">
                        <div className="flex justify-between">
                          <span>{item.quantity}x {item.menu_item?.name}</span>
                          <span>${Number(item.subtotal).toFixed(2)}</span>
                        </div>
                        {item.special_instructions && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.special_instructions}
                          </p>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>${Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <RestaurantLayout>
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </RestaurantLayout>
    );
  }

  return (
    <RestaurantLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <div className="flex items-center gap-4">
          <Badge variant="secondary">
            {filterOrdersByStatus("active").length} Active Orders
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active ({filterOrdersByStatus("active").length})</TabsTrigger>
          <TabsTrigger value="new">New ({filterOrdersByStatus("new").length})</TabsTrigger>
          <TabsTrigger value="preparing">Preparing ({filterOrdersByStatus("preparing").length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filterOrdersByStatus("completed").length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-6">
          {filterOrdersByStatus("active").length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">No active orders</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterOrdersByStatus("active").map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="new" className="mt-6">
          {filterOrdersByStatus("new").length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">No new orders</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterOrdersByStatus("new").map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="preparing" className="mt-6">
          {filterOrdersByStatus("preparing").length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">No preparing orders</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterOrdersByStatus("preparing").map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          {filterOrdersByStatus("completed").length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">No completed orders</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterOrdersByStatus("completed").map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </RestaurantLayout>
  );
};

export default RestaurantOrders;