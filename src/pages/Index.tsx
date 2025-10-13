import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Utensils, Truck, ShoppingBag, ChefHat, MapPin, Clock } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto space-y-6 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Food delivery, your way
          </h1>
          <p className="text-xl text-muted-foreground">
            Order from your favorite restaurants, deliver with flexibility, or grow your business
          </p>
        </div>
      </section>

      {/* Portal Cards */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Customer Portal */}
          <Card className="hover-scale border-primary/20 hover:border-primary/40 transition-all">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <ShoppingBag className="w-10 h-10 text-primary" />
                </div>
              </div>
              <CardTitle>Order Food</CardTitle>
              <CardDescription>
                Browse restaurants and order your favorite meals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-primary" />
                  <span>1000+ restaurants</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Fast delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Track your order</span>
                </div>
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/customer')} 
                  className="w-full"
                >
                  Browse Restaurants
                </Button>
                <Button 
                  onClick={() => navigate('/customer-info')} 
                  variant="outline"
                  className="w-full"
                >
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Restaurant Portal */}
          <Card className="hover-scale border-primary/20 hover:border-primary/40 transition-all">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Utensils className="w-10 h-10 text-primary" />
                </div>
              </div>
              <CardTitle>Restaurant Portal</CardTitle>
              <CardDescription>
                Manage your restaurant and grow your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-primary" />
                  <span>Manage menu items</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Real-time orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Track earnings</span>
                </div>
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/auth?role=restaurant')} 
                  className="w-full"
                >
                  Get Started
                </Button>
                <Button 
                  onClick={() => navigate('/restaurant-info')} 
                  variant="outline"
                  className="w-full"
                >
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Partner Portal */}
          <Card className="hover-scale border-primary/20 hover:border-primary/40 transition-all">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Truck className="w-10 h-10 text-primary" />
                </div>
              </div>
              <CardTitle>Delivery Partner</CardTitle>
              <CardDescription>
                Earn money delivering food on your schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Flexible hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Choose your area</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-primary" />
                  <span>Weekly payouts</span>
                </div>
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/auth?role=delivery_partner')} 
                  className="w-full"
                >
                  Get Started
                </Button>
                <Button 
                  onClick={() => navigate('/delivery-info')} 
                  variant="outline"
                  className="w-full"
                >
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <h2 className="text-4xl font-bold">Why choose us?</h2>
            <p className="text-lg text-muted-foreground">
              The complete food delivery platform for everyone
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Fast Delivery</h3>
              <p className="text-muted-foreground">
                Get your food delivered hot and fresh in minutes
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <ChefHat className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Quality Food</h3>
              <p className="text-muted-foreground">
                Partner with the best restaurants in your area
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Track Orders</h3>
              <p className="text-muted-foreground">
                Real-time tracking from kitchen to your door
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
