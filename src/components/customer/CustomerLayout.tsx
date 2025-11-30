import { Outlet, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, Heart, User, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

export function CustomerLayout() {
  const location = useLocation();
  const { items } = useCart();
  const { user } = useAuth();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Dynamic bottom nav based on auth state
  const bottomNavItems = user ? [
    { path: "/customer", icon: Home, label: "Home" },
    { path: "/restaurants", icon: Search, label: "Browse" },
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/cart", icon: ShoppingBag, label: "Cart", showBadge: true },
    { path: "/profile", icon: User, label: "Profile" },
  ] : [
    { path: "/customer", icon: Home, label: "Home" },
    { path: "/restaurants", icon: Search, label: "Browse" },
    { path: "/cart", icon: ShoppingBag, label: "Cart", showBadge: true },
    { path: "/favorites", icon: Heart, label: "Favorites" },
    { path: "/auth", icon: User, label: "Sign In" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar - Desktop */}
      <Navbar type="customer" />

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Footer - Desktop Only */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path === "/restaurants" && location.pathname.startsWith("/restaurant/")) ||
              (item.path === "/cart" && location.pathname === "/checkout");

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                  {item.showBadge && cartCount > 0 && (
                    <Badge
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-primary text-primary-foreground"
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default CustomerLayout;
