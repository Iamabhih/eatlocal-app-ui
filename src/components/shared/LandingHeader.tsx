import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface LandingHeaderProps {
  activePortal?: "customer" | "restaurant" | "delivery" | "shop";
}

export const LandingHeader = ({ activePortal }: LandingHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <span className="font-bold text-xl text-foreground">Smash Local</span>
            <p className="text-xs text-muted-foreground">Your Local Everything, Delivered</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            to="/customer-info"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              activePortal === "customer" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Order Food
          </Link>
          <Link
            to="/restaurant-info"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              activePortal === "restaurant" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            For Restaurants
          </Link>
          <Link
            to="/shop-info"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              activePortal === "shop" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            For Shops
          </Link>
          <Link
            to="/delivery-info"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              activePortal === "delivery" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Deliver with Us
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Link to="/auth">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
