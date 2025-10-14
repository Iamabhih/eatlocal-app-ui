import { MapPin, DollarSign, Clock, TrendingUp, Package, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/shared/Navbar";
import deliveryHero from "@/assets/delivery-partner-hero.jpg";
import { useDeliveryOrders } from "@/hooks/useDeliveryOrders";
import { useDeliveryEarnings } from "@/hooks/useDeliveryEarnings";

const DeliveryDashboard = () => {
  const { orders } = useDeliveryOrders();
  const { totalToday, deliveriesToday } = useDeliveryEarnings();

  const activeOrders = orders.filter(o => 
    ['ready_for_pickup', 'picked_up'].includes(o.status)
  );
  
  const currentDelivery = activeOrders[0];
  const availableOrders = orders.filter(o => o.status === 'pending');

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
                  <p className="text-2xl font-bold">R{totalToday.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Net after fees</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Deliveries</p>
                  <p className="text-2xl font-bold">{deliveriesToday}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Orders</p>
                  <p className="text-2xl font-bold">{activeOrders.length}</p>
                </div>
                <Star className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold">{availableOrders.length}</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
                </div>
                <Star className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Delivery */}
          {currentDelivery ? (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Current Delivery
                  <Badge className="bg-primary hover:bg-primary/90">
                    {currentDelivery.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/10">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold">#{currentDelivery.order_number}</span>
                        <Badge variant="secondary">{currentDelivery.status}</Badge>
                      </div>
                      <p className="font-medium">{currentDelivery.restaurant?.name}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {currentDelivery.delivery_address?.street_address}, {currentDelivery.delivery_address?.city}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currentDelivery.order_items?.length || 0} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">${Number(currentDelivery.total).toFixed(2)}</p>
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
          ) : (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Current Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">No active delivery</p>
              </CardContent>
            </Card>
          )}

          {/* Available Orders */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Available Orders
                <Badge variant="secondary">
                  {availableOrders.length} available
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No available orders</p>
              ) : (
                <div className="space-y-4">
                  {availableOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-smooth">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium">#{order.order_number}</span>
                        </div>
                        <p className="font-medium text-sm">{order.restaurant?.name}</p>
                        <p className="text-sm text-muted-foreground mb-2">{order.restaurant?.city}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{order.order_items?.length || 0} items</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">${Number(order.delivery_fee).toFixed(2)}</p>
                        <Button 
                          size="sm" 
                          className="mt-2 bg-primary hover:bg-primary/90"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Earnings Breakdown */}
        <Card className="mt-8 shadow-card bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Your Earnings Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Platform Fee</p>
                <p className="text-2xl font-bold">15%</p>
                <p className="text-xs text-muted-foreground">Of delivery fee</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Settlement Fee</p>
                <p className="text-2xl font-bold">4.5%</p>
                <p className="text-xs text-muted-foreground">Card processing</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">You Keep</p>
                <p className="text-2xl font-bold text-primary">80.5%</p>
                <p className="text-xs text-muted-foreground">+ 100% tips!</p>
              </div>
            </div>
            <Button variant="link" className="mt-4 px-0" asChild>
              <a href="/delivery-info" target="_blank">View Full Earnings Breakdown →</a>
            </Button>
          </CardContent>
        </Card>

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