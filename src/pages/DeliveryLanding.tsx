import { Link } from "react-router-dom";
import { LandingHeader } from "@/components/shared/LandingHeader";
import { Footer } from "@/components/shared/Footer";
import { PricingCard } from "@/components/shared/PricingCard";
import { FeeCalculator } from "@/components/shared/FeeCalculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Calendar, MapPin, Smartphone } from "lucide-react";
import heroImage from "@/assets/delivery-partner-hero.jpg";

const DeliveryLanding = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader activePortal="delivery" />

      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">Earn Money on Your Schedule</h1>
          <p className="text-xl mb-8">Be your own boss. Deliver when you want. Get paid instantly. Keep 80.5% of delivery fees plus 100% of tips.</p>
          <Link to="/auth?role=delivery">
            <Button size="lg" className="text-lg px-8">
              Start Delivering
            </Button>
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Deliver With Us?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <Calendar className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Flexible Hours</h3>
                <p className="text-sm text-muted-foreground">Work whenever you want, no schedules</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <DollarSign className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Great Earnings</h3>
                <p className="text-sm text-muted-foreground">Competitive rates plus tips</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <MapPin className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Easy Navigation</h3>
                <p className="text-sm text-muted-foreground">Built-in GPS and route optimization</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Smartphone className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Simple App</h3>
                <p className="text-sm text-muted-foreground">Track earnings and deliveries in real-time</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Earnings Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Transparent Earnings</h2>
          <p className="text-center text-muted-foreground mb-12">Know exactly what you'll earn on every delivery</p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <PricingCard
              title="How You Get Paid"
              description="Clear breakdown of your earnings per delivery"
              fees={[
                { label: "Sign Up", value: "FREE", description: "Join at no cost" },
                { label: "Base Delivery Fee", value: "R20-R50", description: "Depends on distance" },
                { label: "Customer Tips", value: "100%", description: "You keep all tips!" },
                { label: "Platform Fee", value: "-15%", description: "Of delivery fee only" },
                { label: "Settlement Fee", value: "-4.5%", description: "Card processing costs" },
                { label: "You Keep", value: "80.5%", description: "Of base fee + 100% tips" }
              ]}
              example={{
                title: "Example: R35 Delivery + R10 Tip",
                calculation: [
                  { label: "Base Delivery Fee", value: "R35.00" },
                  { label: "Platform Fee (15%)", value: "- R5.25" },
                  { label: "Settlement Fee (4.5%)", value: "- R1.58" },
                  { label: "Customer Tip", value: "+ R10.00" }
                ],
                result: { label: "Your Earnings", value: "R38.17" }
              }}
            />

            <FeeCalculator type="delivery" />
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Requirements</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">What You Need</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Valid driver's license</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Reliable vehicle (car, scooter, or bicycle)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Smartphone with GPS</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Bank account for payments</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>18 years or older</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">How to Get Started</h3>
                <ol className="space-y-2 text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-primary mr-2 font-semibold">1.</span>
                    <span>Sign up online in 5 minutes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2 font-semibold">2.</span>
                    <span>Complete background check</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2 font-semibold">3.</span>
                    <span>Download the delivery app</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2 font-semibold">4.</span>
                    <span>Go online and start earning!</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-muted-foreground mb-8">Join thousands of delivery partners</p>
          <Link to="/auth?role=delivery">
            <Button size="lg">Sign Up Now - It's Free</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DeliveryLanding;
