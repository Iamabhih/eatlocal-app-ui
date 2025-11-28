import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Heart,
  Hotel,
  Building2,
  Car,
  Map,
  Siren,
  Users,
  Gift,
} from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  const services = [
    {
      icon: Utensils,
      title: 'Food Delivery',
      description: 'Order from 1000+ restaurants',
      path: '/restaurants',
      color: 'from-orange-500 to-red-500',
      badge: null,
    },
    {
      icon: Hotel,
      title: 'Hotels & Stays',
      description: 'Book accommodations nationwide',
      path: '/hotels',
      color: 'from-blue-500 to-indigo-500',
      badge: null,
    },
    {
      icon: Building2,
      title: 'Venues & Events',
      description: 'Find the perfect venue',
      path: '/venues',
      color: 'from-purple-500 to-pink-500',
      badge: null,
    },
    {
      icon: Sparkles,
      title: 'Experiences',
      description: 'Discover unique activities',
      path: '/experiences',
      color: 'from-pink-500 to-rose-500',
      badge: 'NEW',
    },
    {
      icon: Car,
      title: 'Rides',
      description: 'Book a ride anywhere',
      path: '/rides/book',
      color: 'from-green-500 to-teal-500',
      badge: null,
    },
    {
      icon: Map,
      title: 'Explore Map',
      description: 'Discover places near you',
      path: '/map',
      color: 'from-teal-500 to-cyan-500',
      badge: null,
    },
  ];

  const partnerOptions = [
    {
      icon: Utensils,
      title: 'Restaurant Partner',
      description: 'List your restaurant and reach more customers',
      path: '/partner/restaurant',
      color: 'bg-gradient-to-br from-orange-500 to-red-500',
    },
    {
      icon: Hotel,
      title: 'Hotel Partner',
      description: 'List your property on our platform',
      path: '/partner/hotel',
      color: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    },
    {
      icon: Building2,
      title: 'Venue Partner',
      description: 'Showcase your event space',
      path: '/partner/venue',
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    },
    {
      icon: Truck,
      title: 'Delivery Partner',
      description: 'Earn money on your schedule',
      path: '/partner/delivery',
      color: 'bg-gradient-to-br from-green-500 to-teal-500',
    },
    {
      icon: Shield,
      title: 'Security Partner',
      description: 'Join our emergency response network',
      path: '/partner/security',
      color: 'bg-gradient-to-br from-slate-700 to-slate-900',
    },
  ];

  const provinces = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
    'Free State', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West',
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-glow flex items-center justify-center">
              <Utensils className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="absolute top-32 right-[15%] animate-float" style={{ animationDelay: '1s' }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-glow-accent flex items-center justify-center">
              <Hotel className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="absolute bottom-32 left-[20%] animate-float" style={{ animationDelay: '2s' }}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 shadow-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="absolute bottom-48 right-[10%] animate-float" style={{ animationDelay: '0.5s' }}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 backdrop-blur-sm flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
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
              <span className="text-gradient-primary">Smash Local</span>
              <br />
              <span className="text-3xl md:text-4xl lg:text-5xl font-normal text-muted-foreground">
                Food. Hotels. Venues. Rides.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              One app for everything local across all 9 provinces of South Africa.
              Order food, book hotels, find venues, and get rides.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                onClick={() => navigate('/restaurants')}
                size="xl"
                variant="premium"
                className="group"
              >
                Start Exploring
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

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-muted-foreground">
              <Badge variant="outline" className="py-2 px-4">
                <MapPin className="w-4 h-4 mr-2 text-primary" />
                All 9 Provinces
              </Badge>
              <Badge variant="outline" className="py-2 px-4">
                <Star className="w-4 h-4 mr-2 text-yellow-500" />
                4.9 Rating
              </Badge>
              <Badge variant="outline" className="py-2 px-4">
                <Users className="w-4 h-4 mr-2 text-green-500" />
                50k+ Users
              </Badge>
              <Badge variant="outline" className="py-2 px-4">
                <Shield className="w-4 h-4 mr-2 text-blue-500" />
                Panic Alert
              </Badge>
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

      {/* Services Grid Section */}
      <section className="section bg-background relative">
        <div className="absolute inset-0 decorative-grid opacity-30" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Everything You Need, <span className="text-gradient-primary">One App</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover all the services Smash Local has to offer
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {services.map((service) => (
              <Card
                key={service.title}
                variant="interactive"
                className="group cursor-pointer"
                onClick={() => navigate(service.path)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <service.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{service.title}</h3>
                        {service.badge && (
                          <Badge className="bg-primary text-primary-foreground text-[10px]">
                            {service.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Feature Section */}
      <section className="py-16 bg-gradient-to-br from-red-500/5 to-orange-500/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden border-red-200 dark:border-red-900">
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <Badge className="w-fit mb-4 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    Safety Feature
                  </Badge>
                  <h2 className="text-3xl font-bold mb-4">
                    Panic Button for Your Safety
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    In an emergency, press the panic button to instantly alert local security
                    providers and emergency services. Your location is shared automatically
                    for faster response times.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <Siren className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="text-sm">One-tap emergency alert</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="text-sm">Automatic location sharing</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="text-sm">Connected to local security providers</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available across all 9 provinces. Direct dial to SAPS (10111) and Ambulance (10177).
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-orange-500 p-8 md:p-12 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                      <div className="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center">
                        <Siren className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-white rounded-full">
                      <span className="text-sm font-bold text-red-600">PANIC</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Province Coverage */}
      <section className="section bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Nationwide Coverage
            </h2>
            <p className="text-lg text-muted-foreground">
              Smash Local is available across all 9 provinces of South Africa
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {provinces.map((province) => (
              <Badge
                key={province}
                variant="secondary"
                className="py-2 px-4 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => navigate(`/map?province=${encodeURIComponent(province)}`)}
              >
                <MapPin className="w-3 h-3 mr-1" />
                {province}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Partner Section */}
      <section className="section-lg bg-background relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Partner With Us
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Grow Your Business with <span className="text-gradient-primary">Smash Local</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Join our network of partners and reach millions of customers across South Africa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {partnerOptions.map((partner) => (
              <Card
                key={partner.title}
                variant="interactive"
                className="group cursor-pointer"
                onClick={() => navigate(partner.path)}
              >
                <CardHeader className="pb-4">
                  <div className={`w-14 h-14 rounded-2xl ${partner.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mb-4`}>
                    <partner.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{partner.title}</CardTitle>
                  <CardDescription>{partner.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full group-hover:bg-primary">
                    Apply Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
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
              Built for <span className="text-gradient-hero">South Africa</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Experience a platform designed specifically for the South African market.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <Card variant="glass" className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary mx-auto mb-4 flex items-center justify-center shadow-glow">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Quick delivery and instant bookings
              </p>
            </Card>

            <Card variant="glass" className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-secondary mx-auto mb-4 flex items-center justify-center shadow-glow-accent">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-2">Safe & Secure</h3>
              <p className="text-sm text-muted-foreground">
                Secure payments and panic button
              </p>
            </Card>

            <Card variant="glass" className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-accent mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-2">Local Love</h3>
              <p className="text-sm text-muted-foreground">
                Support local businesses nationwide
              </p>
            </Card>

            <Card variant="glass" className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-2">Smash Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Earn points on every purchase
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
              Ready to Experience <span className="text-gradient-primary">Smash Local</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of South Africans who have made Smash Local their go-to app for everything local.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => navigate('/restaurants')}
                size="xl"
                variant="premium"
                className="group"
              >
                Get Started
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
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-display font-bold text-gradient-primary mb-4">
                Smash Local
              </div>
              <p className="text-sm text-muted-foreground">
                Your local everything, delivered across all 9 provinces of South Africa.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/restaurants" className="hover:text-primary">Food Delivery</a></li>
                <li><a href="/hotels" className="hover:text-primary">Hotels & Stays</a></li>
                <li><a href="/venues" className="hover:text-primary">Venues & Events</a></li>
                <li><a href="/experiences" className="hover:text-primary">Experiences</a></li>
                <li><a href="/rides/book" className="hover:text-primary">Rides</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Partners</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/partner/restaurant" className="hover:text-primary">Restaurant Partner</a></li>
                <li><a href="/partner/hotel" className="hover:text-primary">Hotel Partner</a></li>
                <li><a href="/partner/venue" className="hover:text-primary">Venue Partner</a></li>
                <li><a href="/partner/delivery" className="hover:text-primary">Delivery Partner</a></li>
                <li><a href="/partner/security" className="hover:text-primary">Security Partner</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Emergency</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Siren className="w-4 h-4 text-red-500" />
                  <span>SAPS: 10111</span>
                </li>
                <li className="flex items-center gap-2">
                  <Siren className="w-4 h-4 text-red-500" />
                  <span>Ambulance: 10177</span>
                </li>
                <li className="flex items-center gap-2">
                  <Siren className="w-4 h-4 text-red-500" />
                  <span>Emergency: 112</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Smash Local. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="/terms" className="hover:text-primary">Terms</a>
              <a href="/privacy" className="hover:text-primary">Privacy</a>
              <a href="/help" className="hover:text-primary">Help</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
