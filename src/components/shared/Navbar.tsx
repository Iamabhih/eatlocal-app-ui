import { ShoppingCart, User, MapPin, Menu, X, Search, Bell } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  type?: "customer" | "restaurant" | "delivery";
}

const Navbar = ({ type = "customer" }: NavbarProps) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (type === "restaurant") {
    return (
      <nav className="sticky top-0 z-50 glass-subtle border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/restaurant/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-secondary flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-display font-bold text-foreground hidden sm:block">
                EatLocal <span className="text-accent font-normal text-sm">Restaurant</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/restaurant/dashboard">
                <Button
                  variant={location.pathname === "/restaurant/dashboard" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-xl"
                >
                  Dashboard
                </Button>
              </Link>
              <Link to="/restaurant/orders">
                <Button
                  variant={location.pathname === "/restaurant/orders" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-xl"
                >
                  Orders
                </Button>
              </Link>
              <Link to="/restaurant/menu">
                <Button
                  variant={location.pathname === "/restaurant/menu" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-xl"
                >
                  Menu
                </Button>
              </Link>
              <Button variant="outline" size="icon" className="rounded-xl ml-2">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" className="rounded-xl">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (type === "delivery") {
    return (
      <nav className="sticky top-0 z-50 glass-subtle border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/delivery/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-dark flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-display font-bold text-foreground hidden sm:block">
                EatLocal <span className="text-muted-foreground font-normal text-sm">Driver</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/delivery/dashboard">
                <Button
                  variant={location.pathname === "/delivery/dashboard" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-xl"
                >
                  Dashboard
                </Button>
              </Link>
              <Link to="/delivery/orders">
                <Button
                  variant={location.pathname === "/delivery/orders" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-xl"
                >
                  Deliveries
                </Button>
              </Link>
              <Link to="/delivery/earnings">
                <Button
                  variant={location.pathname === "/delivery/earnings" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-xl"
                >
                  Earnings
                </Button>
              </Link>
              <Button variant="outline" size="icon" className="rounded-xl ml-2">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" className="rounded-xl">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Customer navbar - Premium design
  return (
    <nav className="sticky top-0 z-50 glass-subtle border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-button">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-display font-bold text-gradient-primary hidden sm:block">
              EatLocal
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
              </div>
              <Input
                placeholder="Enter delivery address"
                className="pl-10 pr-12 h-11 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
              />
              <Button
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right Section - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/restaurants">
              <Button variant="ghost" className="rounded-xl">
                Browse
              </Button>
            </Link>
            <Link to="/cart">
              <Button variant="outline" size="icon" className="relative rounded-xl">
                <ShoppingCart className="h-4 w-4" />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-2 border-background">
                  2
                </Badge>
              </Button>
            </Link>
            <Button variant="secondary" size="icon" className="rounded-xl">
              <User className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link to="/cart">
              <Button variant="outline" size="icon" className="relative rounded-xl">
                <ShoppingCart className="h-4 w-4" />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-2 border-background">
                  2
                </Badge>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            mobileMenuOpen ? "max-h-96 pb-4" : "max-h-0"
          )}
        >
          <div className="space-y-3 pt-3">
            {/* Mobile Search */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
              </div>
              <Input
                placeholder="Enter delivery address"
                className="pl-10 h-11 rounded-xl"
              />
            </div>

            {/* Mobile Nav Links */}
            <div className="flex flex-col gap-2">
              <Link to="/restaurants" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start rounded-xl">
                  Browse Restaurants
                </Button>
              </Link>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start rounded-xl">
                  Sign In / Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
