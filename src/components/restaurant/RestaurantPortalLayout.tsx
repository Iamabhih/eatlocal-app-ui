import { useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantProfile } from "@/hooks/useRestaurantData";
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Store,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { path: "/restaurant/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/restaurant/orders", icon: ClipboardList, label: "Orders", showBadge: true },
  { path: "/restaurant/menu", icon: UtensilsCrossed, label: "Menu" },
  { path: "/restaurant/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/restaurant/settings", icon: Settings, label: "Settings" },
];

export function RestaurantPortalLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: restaurant } = useRestaurantProfile();

  // Check role
  const { data: hasRole, isLoading: roleLoading } = useQuery({
    queryKey: ["user-restaurant-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "restaurant")
        .single();
      return !!data;
    },
    enabled: !!user?.id,
  });

  // Get pending orders count
  const { data: pendingCount } = useQuery({
    queryKey: ["pending-orders-count", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return 0;
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", restaurant.id)
        .in("status", ["pending", "confirmed"]);
      return count || 0;
    },
    enabled: !!restaurant?.id,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/auth?role=restaurant");
      } else if (hasRole === false) {
        navigate("/");
      }
    }
  }, [user, authLoading, hasRole, roleLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading restaurant portal...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-background border-r">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b">
          <div className="w-10 h-10 rounded-xl bg-gradient-secondary flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <span className="font-display font-bold text-lg">Smash</span>
            <span className="text-accent text-xs ml-1">Restaurant</span>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={restaurant?.image_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {restaurant?.name?.charAt(0) || "R"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{restaurant?.name || "Your Restaurant"}</p>
              <Badge
                variant={restaurant?.is_active ? "success" : "secondary"}
                className="text-xs"
              >
                {restaurant?.is_active ? "Open" : "Closed"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-button"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
                {item.showBadge && pendingCount > 0 && (
                  <Badge
                    variant={isActive ? "secondary" : "default"}
                    className="ml-auto"
                  >
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-background transform transition-transform duration-300 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-secondary flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="font-display font-bold">Smash Restaurant</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
                {item.showBadge && pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-background border-b flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold">
                {navItems.find((item) => item.path === location.pathname)?.label || "Dashboard"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="relative rounded-xl">
              <Bell className="h-4 w-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </Button>
            <Avatar className="h-9 w-9 lg:hidden">
              <AvatarImage src={restaurant?.image_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {restaurant?.name?.charAt(0) || "R"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default RestaurantPortalLayout;
