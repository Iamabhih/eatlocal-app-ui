import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LandingHeaderProps {
  activePortal?: "customer" | "restaurant" | "delivery" | "shop";
}

const navLinks = [
  { label: "Order Food", path: "/customer-info", portal: "customer" as const },
  { label: "For Restaurants", path: "/restaurant-info", portal: "restaurant" as const },
  { label: "For Shops", path: "/shop-info", portal: "shop" as const },
  { label: "Deliver with Us", path: "/delivery-info", portal: "delivery" as const },
];

export const LandingHeader = ({ activePortal }: LandingHeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

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

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                activePortal === link.portal ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/auth">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 border-t",
          mobileOpen ? "max-h-[400px]" : "max-h-0 border-t-0"
        )}
      >
        <div className="container px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                activePortal === link.portal
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2 border-t mt-2">
            <Link to="/auth" className="flex-1" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full">Sign In</Button>
            </Link>
            <Link to="/auth" className="flex-1" onClick={() => setMobileOpen(false)}>
              <Button className="w-full">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
