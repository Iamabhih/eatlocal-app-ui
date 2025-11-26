import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import {
  Utensils,
  Truck,
  ShoppingBag,
  ChefHat,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Heart
} from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section with Mesh Gradient Background */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-mesh">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="decorative-blob w-[600px] h-[600px] -top-48 -left-48 bg-primary/20" />
          <div className="decorative-blob w-[500px] h-[500px] -bottom-32 -right-32 bg-accent/20" />
          <div className="decorative-blob w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary/10" />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] animate-float" style={{ animationDelay: '0s' }}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center">
              <Utensils className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="absolute top-32 right-[15%] animate-float" style={{ animationDelay: '1s' }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-secondary shadow-glow-accent flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="absolute bottom-32 left-[20%] animate-float" style={{ animationDelay: '2s' }}>
            <div className="w-12 h-12 rounded-xl bg-gradient-accent shadow-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="absolute bottom-48 right-[10%] animate-float" style={{ animationDelay: '0.5s' }}>
            <div className="w-10 h-10 rounded-lg bg-primary/20 backdrop-blur-sm flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-5xl mx-auto space-y-8 animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Your Local Everything, Delivered</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-foreground leading-tight">
              Discover{' '}
              <span className="text-gradient-primary">Delicious</span>
              <br />
              Near You
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Order from the best restaurants and shops in your neighborhood with transparent pricing and real-time tracking.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                onClick={() => navigate('/restaurants')}
                size="xl"
                variant="premium"
                className="group"
              >
                Start Ordering
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                onClick={() => navigate('/customer-info')}
                variant="outline"
                size="xl"
              >
                Learn More
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-background flex items-center justify-center">
                      <span className="text-xs font-medium">{i}</span>
                    </div>
                  ))}
                </div>
                <span className="text-sm">10k+ Happy Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium">4.9</span>
                <span className="text-sm text-muted-foreground">(2,500+ reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-subtle">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1">
            <div className="w-1.5 h-3 rounded-full bg-muted-foreground/30 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Portal Cards Section */}
      <section className="section bg-background relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 decorative-grid opacity-30" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              One Platform, <span className="text-gradient-primary">Endless Possibilities</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Whether you're hungry, running a restaurant, or looking to deliver - we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Customer Portal */}
            <Card variant="interactive" className="group">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-button group-hover:shadow-glow transition-shadow">
                      <ShoppingBag className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
                <CardTitle className="text-xl">Order Food</CardTitle>
                <CardDescription>
                  Browse restaurants and order your favorite meals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ChefHat className="w-4 h-4 text-primary" />
                    </div>
                    <span>1000+ restaurants</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <span>30-45 min delivery</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <span>Real-time tracking</span>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Button
                    onClick={() => navigate('/restaurants')}
                    className="w-full"
                  >
                    Browse Restaurants
                  </Button>
                  <Button
                    onClick={() => navigate('/customer-info')}
                    variant="ghost"
                    className="w-full"
                  >
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Restaurant Portal */}
            <Card variant="interactive" className="group">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-secondary flex items-center justify-center shadow-lg group-hover:shadow-glow-accent transition-shadow">
                      <Utensils className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                <CardTitle className="text-xl">Restaurant Portal</CardTitle>
                <CardDescription>
                  Manage your restaurant and grow your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <ChefHat className="w-4 h-4 text-accent" />
                    </div>
                    <span>Easy menu management</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-accent" />
                    </div>
                    <span>Real-time orders</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-accent" />
                    </div>
                    <span>Analytics dashboard</span>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Button
                    onClick={() => navigate('/auth?role=restaurant')}
                    className="w-full bg-gradient-secondary hover:opacity-90"
                  >
                    Get Started
                  </Button>
                  <Button
                    onClick={() => navigate('/restaurant-info')}
                    variant="ghost"
                    className="w-full"
                  >
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Shop Portal */}
            <Card variant="interactive" className="group">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-lg group-hover:shadow-lg transition-shadow">
                      <ShoppingBag className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-primary text-[10px] font-bold text-white">
                      NEW
                    </div>
                  </div>
                </div>
                <CardTitle className="text-xl">Shop & Groceries</CardTitle>
                <CardDescription>
                  List your shop and reach local customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-4 h-4 text-orange-500" />
                    </div>
                    <span>Sell anything online</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-orange-500" />
                    </div>
                    <span>Inventory management</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-orange-500" />
                    </div>
                    <span>Delivery & pickup</span>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Button
                    onClick={() => navigate('/auth?role=shop')}
                    className="w-full bg-gradient-accent hover:opacity-90"
                  >
                    Get Started
                  </Button>
                  <Button
                    onClick={() => navigate('/shop-info')}
                    variant="ghost"
                    className="w-full"
                  >
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Partner Portal */}
            <Card variant="interactive" className="group">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-dark flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <Truck className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                <CardTitle className="text-xl">Delivery Partner</CardTitle>
                <CardDescription>
                  Earn money delivering on your schedule
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-foreground" />
                    </div>
                    <span>Flexible hours</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-foreground" />
                    </div>
                    <span>Choose your area</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-foreground" />
                    </div>
                    <span>Weekly payouts</span>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Button
                    onClick={() => navigate('/auth?role=delivery_partner')}
                    variant="secondary"
                    className="w-full"
                  >
                    Get Started
                  </Button>
                  <Button
                    onClick={() => navigate('/delivery-info')}
                    variant="ghost"
                    className="w-full"
                  >
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-lg bg-gradient-mesh relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Why Choose Us
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Built for the <span className="text-gradient-hero">Modern</span> Foodie
            </h2>
            <p className="text-lg text-muted-foreground">
              Experience food delivery reimagined with cutting-edge technology and exceptional service.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card variant="glass" className="text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary mx-auto mb-6 flex items-center justify-center shadow-glow">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Average delivery time of 30-45 minutes. Hot food, delivered hot.
              </p>
            </Card>

            <Card variant="glass" className="text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-secondary mx-auto mb-6 flex items-center justify-center shadow-glow-accent">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Safe & Secure</h3>
              <p className="text-muted-foreground">
                Contactless delivery and secure payments for peace of mind.
              </p>
            </Card>

            <Card variant="glass" className="text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-accent mx-auto mb-6 flex items-center justify-center shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Local Love</h3>
              <p className="text-muted-foreground">
                Support local businesses and strengthen your community.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
              Ready to Experience the <span className="text-gradient-primary">Difference</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who have made Smash their go-to food delivery app.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => navigate('/restaurants')}
                size="xl"
                variant="premium"
                className="group"
              >
                Order Now
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                onClick={() => navigate('/auth')}
                variant="outline"
                size="xl"
              >
                Sign Up Free
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-2xl font-display font-bold text-gradient-primary">
              Smash
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Smash. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
