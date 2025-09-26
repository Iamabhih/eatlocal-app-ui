import { Clock, CheckCircle, XCircle, Eye, Phone } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navbar from "@/components/shared/Navbar";

const RestaurantOrders = () => {
  const [orders, setOrders] = useState([
    {
      id: "#12345",
      customer: "John Doe",
      phone: "+1 (555) 123-4567",
      time: "2 mins ago",
      estimatedTime: 20,
      items: [
        { name: "Classic Cheeseburger", quantity: 2, price: 12.99, customizations: ["No onions"] },
        { name: "Truffle Fries", quantity: 1, price: 8.99, customizations: [] }
      ],
      total: 34.97,
      status: "new",
      paymentMethod: "Card ending in 4532",
      address: "123 Main St, Apt 4B"
    },
    {
      id: "#12344",
      customer: "Sarah Miller",
      phone: "+1 (555) 987-6543",
      time: "5 mins ago",
      estimatedTime: 15,
      items: [
        { name: "BBQ Bacon Burger", quantity: 1, price: 16.99, customizations: ["Extra bacon"] },
        { name: "Onion Rings", quantity: 1, price: 6.99, customizations: [] }
      ],
      total: 23.98,
      status: "preparing",
      paymentMethod: "Card ending in 1234",
      address: "456 Oak Ave"
    },
    {
      id: "#12343",
      customer: "Mike Rodriguez",
      phone: "+1 (555) 456-7890", 
      time: "8 mins ago",
      estimatedTime: 10,
      items: [
        { name: "Mushroom Swiss Burger", quantity: 1, price: 14.99, customizations: [] },
        { name: "Truffle Fries", quantity: 1, price: 8.99, customizations: [] }
      ],
      total: 23.98,
      status: "ready",
      paymentMethod: "Cash",
      address: "789 Pine St"
    },
    {
      id: "#12342",
      customer: "Lisa Johnson",
      phone: "+1 (555) 321-9876",
      time: "15 mins ago",
      estimatedTime: 5,
      items: [
        { name: "Spicy Jalapeño Burger", quantity: 2, price: 15.99, customizations: ["Extra spicy"] }
      ],
      total: 31.98,
      status: "completed",
      paymentMethod: "Card ending in 7890",
      address: "321 Elm St"
    }
  ]);

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-500";
      case "preparing": return "bg-yellow-500";
      case "ready": return "bg-uber-green";
      case "completed": return "bg-gray-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "New Order";
      case "preparing": return "Preparing";
      case "ready": return "Ready";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      default: return "Unknown";
    }
  };

  const filterOrdersByStatus = (status: string) => {
    if (status === "active") {
      return orders.filter(order => ["new", "preparing", "ready"].includes(order.status));
    }
    return orders.filter(order => order.status === status);
  };

  const OrderCard = ({ order }: { order: any }) => (
    <Card className="shadow-card">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-lg">{order.id}</h3>
              <Badge className={`${getStatusColor(order.status)} text-white`}>
                {getStatusText(order.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{order.time}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-xl">${order.total}</p>
            <p className="text-sm text-muted-foreground">{order.paymentMethod}</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Customer:</span>
            <span>{order.customer}</span>
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <span className="font-medium">Address:</span>
            <span className="ml-2 text-sm">{order.address}</span>
          </div>
        </div>

        <div className="border-t pt-4 mb-4">
          <h4 className="font-medium mb-3">Order Items</h4>
          <div className="space-y-2">
            {order.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <div>
                  <span className="font-medium">{item.quantity}x {item.name}</span>
                  {item.customizations.length > 0 && (
                    <p className="text-muted-foreground text-xs ml-4">
                      {item.customizations.join(", ")}
                    </p>
                  )}
                </div>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Est. {order.estimatedTime} mins</span>
          </div>
          
          <div className="flex gap-2">
            {order.status === "new" && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, "cancelled")}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button 
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, "preparing")}
                  className="bg-uber-green hover:bg-uber-green-hover"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept
                </Button>
              </>
            )}
            
            {order.status === "preparing" && (
              <Button 
                size="sm"
                onClick={() => updateOrderStatus(order.id, "ready")}
                className="bg-uber-green hover:bg-uber-green-hover"
              >
                Mark Ready
              </Button>
            )}
            
            {order.status === "ready" && (
              <Button 
                size="sm"
                onClick={() => updateOrderStatus(order.id, "completed")}
                className="bg-uber-green hover:bg-uber-green-hover"
              >
                Complete
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
                  <DialogTitle>Order Details - {order.id}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Customer Information</h4>
                    <p>{order.customer}</p>
                    <p className="text-sm text-muted-foreground">{order.phone}</p>
                    <p className="text-sm text-muted-foreground">{order.address}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Order Items</h4>
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="border-b pb-2 mb-2 last:border-b-0">
                        <div className="flex justify-between">
                          <span>{item.quantity}x {item.name}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        {item.customizations.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.customizations.join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>${order.total}</span>
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar type="restaurant" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Order Management</h1>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              {filterOrdersByStatus("active").length} Active Orders
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="active">Active ({filterOrdersByStatus("active").length})</TabsTrigger>
            <TabsTrigger value="new">New ({filterOrdersByStatus("new").length})</TabsTrigger>
            <TabsTrigger value="preparing">Preparing ({filterOrdersByStatus("preparing").length})</TabsTrigger>
            <TabsTrigger value="ready">Ready ({filterOrdersByStatus("ready").length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({filterOrdersByStatus("completed").length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterOrdersByStatus("active").map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="new" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterOrdersByStatus("new").map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="preparing" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterOrdersByStatus("preparing").map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="ready" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterOrdersByStatus("ready").map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterOrdersByStatus("completed").map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RestaurantOrders;