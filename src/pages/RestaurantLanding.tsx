import { Link } from "react-router-dom";
import { LandingHeader } from "@/components/shared/LandingHeader";
import { Footer } from "@/components/shared/Footer";
import { PricingCard } from "@/components/shared/PricingCard";
import { FeeCalculator } from "@/components/shared/FeeCalculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, BarChart, Clock } from "lucide-react";
import heroImage from "@/assets/restaurant-hero.jpg";

const RestaurantLanding = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader activePortal="restaurant" />

      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">Grow Your Restaurant Business</h1>
          <p className="text-xl mb-8">Reach thousands of new customers with our platform. Free to join, transparent pricing, and powerful tools to manage your orders.</p>
          <Link to="/auth?role=restaurant">
            <Button size="lg" className="text-lg px-8">
              Become a Partner
            </Button>
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Partner With Us?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Increase Revenue</h3>
                <p className="text-sm text-muted-foreground">Reach new customers and boost sales</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">More Customers</h3>
                <p className="text-sm text-muted-foreground">Access our large customer base</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <BarChart className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Analytics</h3>
                <p className="text-sm text-muted-foreground">Track performance with insights</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Easy Management</h3>
                <p className="text-sm text-muted-foreground">Simple dashboard for all orders</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-muted-foreground mb-12">No monthly fees. You only pay when you get orders.</p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <PricingCard
              title="Partnership Fees"
              description="Clear breakdown of what you pay per order"
              fees={[
                { label: "Account Creation", value: "FREE", description: "Join our platform at no cost" },
                { label: "Monthly Fee", value: "FREE", description: "No subscription required" },
                { label: "Platform Commission", value: "15%", description: "On order subtotal only" },
                { label: "Settlement Fee", value: "4.5%", description: "Covers card processing costs" },
                { label: "You Keep", value: "80.5%", description: "Of every order value" }
              ]}
              example={{
                title: "Example: R200 Order",
                calculation: [
                  { label: "Order Subtotal", value: "R200.00" },
                  { label: "Platform Commission (15%)", value: "- R30.00" },
                  { label: "Settlement Fee (4.5%)", value: "- R9.00" }
                ],
                result: { label: "Your Payout", value: "R161.00" }
              }}
            />

            <FeeCalculator type="restaurant" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Sign Up</h3>
                    <p className="text-muted-foreground">Create your free restaurant account in minutes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Set Up Your Menu</h3>
                    <p className="text-muted-foreground">Add your dishes, prices, and photos through our easy dashboard</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Receive Orders</h3>
                    <p className="text-muted-foreground">Get instant notifications when customers place orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Get Paid</h3>
                    <p className="text-muted-foreground">Receive payments directly to your bank account</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Business?</h2>
          <p className="text-muted-foreground mb-8">Join hundreds of successful restaurant partners</p>
          <Link to="/auth?role=restaurant">
            <Button size="lg">Sign Up Now - It's Free</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RestaurantLanding;
