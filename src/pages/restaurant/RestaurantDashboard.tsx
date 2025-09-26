import { TrendingUp, Users, DollarSign, Clock, Star, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/shared/Navbar";
import restaurantHero from "@/assets/restaurant-hero.jpg";

const RestaurantDashboard = () => {
  // Mock data
  const stats = {
    todayOrders: 47,
    todayRevenue: 1284.50,
    avgRating: 4.5,
    totalReviews: 1250,
    pendingOrders: 8,
    preparationTime: 18
  };

  const recentOrders = [
    {
      id: "#12345",
      time: "2 mins ago",
      customer: "John D.",
      items: ["2x Classic Burger", "1x Fries"],
      total: 32.97,
      status: "preparing"
    },
    {
      id: "#12344", 
      time: "5 mins ago",
      customer: "Sarah M.",
      items: ["1x BBQ Burger", "1x Onion Rings"],
      total: 23.98,
      status: "ready"
    },
    {
      id: "#12343",
      time: "8 mins ago", 
      customer: "Mike R.",
      items: ["3x Classic Burger", "2x Fries"],
      total: 48.95,
      status: "delivered"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing": return "bg-yellow-500";
      case "ready": return "bg-uber-green";
      case "delivered": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "preparing": return "Preparing";
      case "ready": return "Ready";
      case "delivered": return "Delivered";
      default: return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar type="restaurant" />
      
      {/* Hero Section */}
      <section className="relative h-48 bg-gradient-hero overflow-hidden">
        <img 
          src={restaurantHero} 
          alt="Restaurant kitchen" 
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Restaurant Dashboard</h1>
            <p className="text-xl text-white/90">Manage your orders and track performance</p>
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
                  <p className="text-sm text-muted-foreground">Today's Orders</p>
                  <p className="text-2xl font-bold">{stats.todayOrders}</p>
                </div>
                <Users className="h-8 w-8 uber-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                  <p className="text-2xl font-bold">${stats.todayRevenue}</p>
                </div>
                <DollarSign className="h-8 w-8 uber-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
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
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold text-orange-500">{stats.pendingOrders}</p>
                </div>
                <Bell className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prep Time</p>
                  <p className="text-2xl font-bold">{stats.preparationTime}m</p>
                </div>
                <Clock className="h-8 w-8 uber-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reviews</p>
                  <p className="text-2xl font-bold">{stats.totalReviews}</p>
                </div>
                <TrendingUp className="h-8 w-8 uber-green" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Orders
                <Button variant="outline" size="sm">View All</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-smooth">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium">{order.id}</span>
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(order.status)} text-white`}
                        >
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {order.customer} • {order.time}
                      </p>
                      <p className="text-sm">{order.items.join(", ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${order.total}</p>
                      {order.status === "preparing" && (
                        <Button size="sm" className="mt-2 bg-uber-green hover:bg-uber-green-hover">
                          Mark Ready
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Chart Placeholder */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Today's Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Orders Completed</span>
                    <span>39/47</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-uber-green h-2 rounded-full" style={{ width: '83%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>On-Time Delivery</span>
                    <span>95%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-uber-green h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Customer Satisfaction</span>
                    <span>4.5/5</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-uber-green h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm">Update Menu</Button>
                    <Button variant="outline" size="sm">Set Hours</Button>
                    <Button variant="outline" size="sm">View Analytics</Button>
                    <Button variant="outline" size="sm">Support</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;