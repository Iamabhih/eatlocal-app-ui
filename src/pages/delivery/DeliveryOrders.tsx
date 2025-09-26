import { MapPin, Clock, Phone, CheckCircle, Navigation } from "lucide-react"; 
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navbar from "@/components/shared/Navbar";

const DeliveryOrders = () => {
  const [orders, setOrders] = useState([
    {
      id: "#D12345",
      restaurant: "Burger Palace",
      restaurantAddress: "123 Restaurant St",
      customer: "John Doe", 
      customerAddress: "456 Main St, Apt 4B",
      customerPhone: "+1 (555) 123-4567",
      distance: "1.2 mi",
      estimatedTime: "25 min",
      payout: 12.50,
      items: [
        { name: "Classic Cheeseburger", quantity: 2 },
        { name: "Truffle Fries", quantity: 1 }
      ],
      status: "available",
      instructions: "Ring doorbell, leave at door",
      orderTime: "2:45 PM"
    },
    {
      id: "#D12346",
      restaurant: "Sushi Express", 
      restaurantAddress: "789 Sushi Ave",
      customer: "Sarah Miller",
      customerAddress: "321 Oak Ave, Unit 12",
      customerPhone: "+1 (555) 987-6543",
      distance: "0.8 mi",
      estimatedTime: "18 min",
      payout: 15.25,
      items: [
        { name: "California Roll", quantity: 2 },
        { name: "Miso Soup", quantity: 1 }
      ],
      status: "accepted",
      instructions: "Call when arriving",
      orderTime: "2:30 PM"
    },
    {
      id: "#D12347",
      restaurant: "Pizza Corner",
      restaurantAddress: "555 Pizza Blvd", 
      customer: "Mike Rodriguez",
      customerAddress: "999 Pine St, House",
      customerPhone: "+1 (555) 456-7890",
      distance: "2.1 mi",
      estimatedTime: "35 min",
      payout: 18.75,
      items: [
        { name: "Pepperoni Pizza", quantity: 1 },
        { name: "Garlic Bread", quantity: 2 },
        { name: "Coke", quantity: 2 }
      ],
      status: "picked_up",
      instructions: "Apartment buzzer #23",
      orderTime: "2:15 PM"
    },
    {
      id: "#D12348",
      restaurant: "Healthy Bowls",
      restaurantAddress: "246 Health St",
      customer: "Lisa Johnson", 
      customerAddress: "135 Elm St, Apt 5A",
      customerPhone: "+1 (555) 321-9876",
      distance: "1.5 mi",
      estimatedTime: "22 min",
      payout: 14.25,
      items: [
        { name: "Buddha Bowl", quantity: 1 },
        { name: "Green Smoothie", quantity: 1 }
      ],
      status: "completed",
      instructions: "Leave with concierge",
      orderTime: "1:45 PM"
    }
  ]);

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-blue-500";
      case "accepted": return "bg-orange-500";
      case "picked_up": return "bg-uber-green";
      case "completed": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available": return "Available";
      case "accepted": return "Accepted";
      case "picked_up": return "Picked Up";
      case "completed": return "Completed";
      default: return "Unknown";
    }
  };

  const filterOrdersByStatus = (status: string) => {
    if (status === "active") {
      return orders.filter(order => ["accepted", "picked_up"].includes(order.status));
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
            <p className="text-muted-foreground text-sm">{order.orderTime}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-2xl uber-green">${order.payout}</p>
            <p className="text-sm text-muted-foreground">{order.distance} • {order.estimatedTime}</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {/* Restaurant Info */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 bg-uber-green rounded-full flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <div className="flex-1">
              <p className="font-medium">{order.restaurant}</p>
              <p className="text-sm text-muted-foreground">{order.restaurantAddress}</p>
            </div>
            {(order.status === "accepted" || order.status === "picked_up") && (
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
              <p className="font-medium">{order.customer}</p>
              <p className="text-sm text-muted-foreground">{order.customerAddress}</p>
              {order.instructions && (
                <p className="text-sm italic mt-1">"{order.instructions}"</p>
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
            {order.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {order.status === "available" && (
            <>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => updateOrderStatus(order.id, "declined")}
              >
                Decline
              </Button>
              <Button 
                className="flex-1 bg-uber-green hover:bg-uber-green-hover"
                onClick={() => updateOrderStatus(order.id, "accepted")}
              >
                Accept Order
              </Button>
            </>
          )}
          
          {order.status === "accepted" && (
            <Button 
              className="w-full bg-uber-green hover:bg-uber-green-hover"
              onClick={() => updateOrderStatus(order.id, "picked_up")}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Pickup
            </Button>
          )}
          
          {order.status === "picked_up" && (
            <Button 
              className="w-full bg-uber-green hover:bg-uber-green-hover"
              onClick={() => updateOrderStatus(order.id, "completed")}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Delivery
            </Button>
          )}

          {order.status === "completed" && (
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
            <Badge className="bg-uber-green hover:bg-uber-green-hover">
              Online
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="available">
              Available ({filterOrdersByStatus("available").length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({filterOrdersByStatus("active").length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted ({filterOrdersByStatus("accepted").length})
            </TabsTrigger>
            <TabsTrigger value="picked_up">
              Picked Up ({filterOrdersByStatus("picked_up").length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({filterOrdersByStatus("completed").length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterOrdersByStatus("available").map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
            {filterOrdersByStatus("available").length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold mb-2">No available orders</h3>
                <p className="text-muted-foreground">
                  Check back soon for new delivery opportunities.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterOrdersByStatus("active").map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="accepted" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterOrdersByStatus("accepted").map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="picked_up" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterOrdersByStatus("picked_up").map((order) => (
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

export default DeliveryOrders;