import { MapPin, DollarSign, Clock, TrendingUp, Package, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/shared/Navbar";
import deliveryHero from "@/assets/delivery-partner-hero.jpg";

const DeliveryDashboard = () => {
  // Mock data
  const stats = {
    todayEarnings: 127.50,
    totalDeliveries: 8,
    avgRating: 4.8,
    totalRating: 450,
    onlineTime: "6h 23m",
    avgDeliveryTime: 22
  };

  const availableOrders = [
    {
      id: "#D12345",
      restaurant: "Burger Palace",
      customer: "John D.",
      distance: "1.2 mi",
      estimatedTime: "25 min",
      payout: 12.50,
      items: 3,
      address: "123 Main St",
      customerRating: 4.5
    },
    {
      id: "#D12346", 
      restaurant: "Sushi Express",
      customer: "Sarah M.",
      distance: "0.8 mi",
      estimatedTime: "18 min",
      payout: 15.25,
      items: 2,
      address: "456 Oak Ave",
      customerRating: 4.8
    },
    {
      id: "#D12347",
      restaurant: "Pizza Corner", 
      customer: "Mike R.",
      distance: "2.1 mi",
      estimatedTime: "35 min",
      payout: 18.75,
      items: 4,
      address: "789 Pine St",
      customerRating: 4.3
    }
  ];

  const currentDelivery = {
    id: "#D12344",
    restaurant: "Healthy Bowls",
    customer: "Lisa J.",
    address: "321 Elm St, Apt 2B",
    phone: "+1 (555) 321-9876",
    items: 2,
    payout: 14.25,
    status: "picked_up",
    estimatedTime: "12 min",
    instructions: "Leave at door, ring bell"
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar type="delivery" />
      
      {/* Hero Section */}
      <section className="relative h-48 bg-gradient-hero overflow-hidden">
        <img 
          src={deliveryHero} 
          alt="Delivery partner" 
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Delivery Dashboard</h1>
            <p className="text-xl text-white/90">Track your deliveries and earnings</p>
          </div>
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <Switch id="online-mode" defaultChecked />
            <Label htmlFor="online-mode" className="text-white font-medium">
              Go Online
            </Label>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Earnings</p>
                  <p className="text-2xl font-bold">${stats.todayEarnings}</p>
                </div>
                <DollarSign className="h-8 w-8 uber-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Deliveries</p>
                  <p className="text-2xl font-bold">{stats.totalDeliveries}</p>
                </div>
                <Package className="h-8 w-8 uber-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-2xl font-bold">{stats.avgRating}</p>
                </div>
                <Star className="h-8 w-8 uber-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Online Time</p>
                  <p className="text-2xl font-bold">{stats.onlineTime}</p>
                </div>
                <Clock className="h-8 w-8 uber-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Time</p>
                  <p className="text-2xl font-bold">{stats.avgDeliveryTime}m</p>
                </div>
                <TrendingUp className="h-8 w-8 uber-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reviews</p>
                  <p className="text-2xl font-bold">{stats.totalRating}</p>
                </div>
                <Star className="h-8 w-8 uber-green" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Delivery */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Current Delivery
                <Badge className="bg-uber-green hover:bg-uber-green-hover">
                  In Progress
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-uber-green-light">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold">{currentDelivery.id}</span>
                      <Badge variant="secondary">{currentDelivery.status === "picked_up" ? "Picked Up" : "En Route"}</Badge>
                    </div>
                    <p className="font-medium">{currentDelivery.restaurant} → {currentDelivery.customer}</p>
                    <p className="text-sm text-muted-foreground mb-2">{currentDelivery.address}</p>
                    <p className="text-sm text-muted-foreground">{currentDelivery.items} items • Est. {currentDelivery.estimatedTime}</p>
                    {currentDelivery.instructions && (
                      <p className="text-sm italic mt-2">"{currentDelivery.instructions}"</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg uber-green">${currentDelivery.payout}</p>
                    <Button 
                      size="sm" 
                      className="mt-2 bg-uber-green hover:bg-uber-green-hover"
                    >
                      Complete Delivery
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <MapPin className="h-4 w-4 mr-2" />
                    Navigate
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Call Customer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Orders */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Available Orders
                <Badge variant="secondary">
                  {availableOrders.length} nearby
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-smooth">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium">{order.id}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                          <span className="text-xs">{order.customerRating}</span>
                        </div>
                      </div>
                      <p className="font-medium text-sm">{order.restaurant} → {order.customer}</p>
                      <p className="text-sm text-muted-foreground mb-2">{order.address}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {order.distance}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {order.estimatedTime}
                        </span>
                        <span>{order.items} items</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold uber-green">${order.payout}</p>
                      <Button 
                        size="sm" 
                        className="mt-2 bg-uber-green hover:bg-uber-green-hover"
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8 shadow-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                <MapPin className="h-6 w-6" />
                <span>Update Location</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                <Clock className="h-6 w-6" />
                <span>Break Time</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                <DollarSign className="h-6 w-6" />
                <span>View Earnings</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                <Package className="h-6 w-6" />
                <span>Delivery History</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeliveryDashboard;