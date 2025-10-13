import { Link } from "react-router-dom";
import { LandingHeader } from "@/components/shared/LandingHeader";
import { Footer } from "@/components/shared/Footer";
import { PricingCard } from "@/components/shared/PricingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, MapPin, Clock, Shield } from "lucide-react";
import heroImage from "@/assets/hero-delivery.jpg";

const CustomerLanding = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader activePortal="customer" />

      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">Your Favorite Food, Delivered Fast</h1>
          <p className="text-xl mb-8">Order from the best restaurants in your area with transparent pricing and real-time tracking</p>
          <Link to="/customer">
            <Button size="lg" className="text-lg px-8">
              Browse Restaurants
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Browse</h3>
                <p className="text-sm text-muted-foreground">Explore restaurants and menus in your area</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Order</h3>
                <p className="text-sm text-muted-foreground">Select your favorite dishes and checkout</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Track</h3>
                <p className="text-sm text-muted-foreground">Watch your order in real-time on the map</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Enjoy</h3>
                <p className="text-sm text-muted-foreground">Receive your food fresh at your doorstep</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">Transparent Pricing</h2>
          <p className="text-center text-muted-foreground mb-12">No hidden fees. Know exactly what you're paying for.</p>
          
          <PricingCard
            title="What You Pay"
            description="Simple, straightforward pricing on every order"
            fees={[
              { label: "Sign Up", value: "FREE", description: "Create your account at no cost" },
              { label: "Delivery Fee", value: "R15-R35", description: "Set by restaurant, typically R20-R30" },
              { label: "Service Fee", value: "4.5%", description: "Covers secure payment processing" },
              { label: "Sales Tax", value: "15%", description: "Standard VAT on food orders" }
            ]}
            example={{
              title: "Example Order",
              calculation: [
                { label: "Food Subtotal", value: "R150.00" },
                { label: "Delivery Fee", value: "R25.00" },
                { label: "Service Fee (4.5%)", value: "R7.88" },
                { label: "VAT (15%)", value: "R22.50" }
              ],
              result: { label: "Total", value: "R205.38" }
            }}
          />
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Order With Us?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <Clock className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
                <p className="text-muted-foreground">Average delivery time of 30-45 minutes</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Shield className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Safe & Secure</h3>
                <p className="text-muted-foreground">Contactless delivery and secure payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <MapPin className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Real-Time Tracking</h3>
                <p className="text-muted-foreground">Track your order from kitchen to doorstep</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Order?</h2>
          <p className="text-muted-foreground mb-8">Join thousands of satisfied customers</p>
          <Link to="/customer">
            <Button size="lg">Start Ordering Now</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CustomerLanding;
