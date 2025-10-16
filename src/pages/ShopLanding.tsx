import { Link } from "react-router-dom";
import { LandingHeader } from "@/components/shared/LandingHeader";
import { Footer } from "@/components/shared/Footer";
import { PricingCard } from "@/components/shared/PricingCard";
import { FeeCalculator } from "@/components/shared/FeeCalculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, TrendingUp, Users, BarChart, Clock, Package } from "lucide-react";
import heroImage from "@/assets/shop-hero.jpg";

const ShopLanding = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader activePortal="shop" />

      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">Bring Your Shop Online</h1>
          <p className="text-xl mb-8">Sell groceries, household items, and more to thousands of local customers. Free to join, easy to manage, transparent pricing.</p>
          <Link to="/auth?role=shop">
            <Button size="lg" className="text-lg px-8">
              Start Selling Online
            </Button>
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why List Your Shop on Ekhasi Online?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="hover-scale">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Grow Your Business</h3>
                <p className="text-sm text-muted-foreground">Reach more customers in your community</p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardContent className="pt-6 text-center">
                <Users className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Local Customer Base</h3>
                <p className="text-sm text-muted-foreground">Connect with your neighborhood</p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardContent className="pt-6 text-center">
                <Package className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Easy Inventory</h3>
                <p className="text-sm text-muted-foreground">Simple product management</p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardContent className="pt-6 text-center">
                <Clock className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Pickup & Delivery</h3>
                <p className="text-sm text-muted-foreground">Offer both options to customers</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What You Can Sell */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">What Can You Sell?</h2>
          <p className="text-center text-muted-foreground mb-12">List a wide range of products on Ekhasi Online</p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <Store className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Groceries</h3>
                <p className="text-muted-foreground text-sm">Fresh produce, dairy, meat, pantry essentials</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Package className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Household Items</h3>
                <p className="text-muted-foreground text-sm">Cleaning supplies, toiletries, home goods</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Store className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Snacks & Drinks</h3>
                <p className="text-muted-foreground text-sm">Beverages, chips, candy, cold drinks</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-muted/30">
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
                title: "Example: R150 Order",
                calculation: [
                  { label: "Order Subtotal", value: "R150.00" },
                  { label: "Platform Commission (15%)", value: "- R22.50" },
                  { label: "Settlement Fee (4.5%)", value: "- R6.75" }
                ],
                result: { label: "Your Payout", value: "R120.75" }
              }}
            />

            <FeeCalculator type="restaurant" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Sign Up Free</h3>
                    <p className="text-muted-foreground">Create your shop account in just 5 minutes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">List Your Products</h3>
                    <p className="text-muted-foreground">Add items with photos, prices, and descriptions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Receive Orders</h3>
                    <p className="text-muted-foreground">Get instant notifications for delivery or pickup orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
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
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Go Digital?</h2>
          <p className="text-muted-foreground mb-8">Join hundreds of successful local shops on Ekhasi Online</p>
          <Link to="/auth?role=shop">
            <Button size="lg">Sign Up Now - It's Free</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ShopLanding;
