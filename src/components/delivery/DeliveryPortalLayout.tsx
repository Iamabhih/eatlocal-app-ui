import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeliveryEarnings } from "@/hooks/useDeliveryEarnings";
import {
  LayoutDashboard,
  Package,
  Wallet,
  MapPin,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/delivery/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/delivery/orders", icon: Package, label: "Deliveries", showBadge: true },
  { path: "/delivery/earnings", icon: Wallet, label: "Earnings" },
  { path: "/delivery/profile", icon: User, label: "Profile" },
];

const bottomNavItems = [
  { path: "/delivery/dashboard", icon: LayoutDashboard, label: "Home" },
  { path: "/delivery/orders", icon: Package, label: "Deliveries" },
  { path: "/delivery/map", icon: MapPin, label: "Map" },
  { path: "/delivery/earnings", icon: Wallet, label: "Earnings" },
  { path: "/delivery/profile", icon: User, label: "Profile" },
];

export function DeliveryPortalLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { totalToday, deliveriesToday } = useDeliveryEarnings();

  // Check role
  const { data: hasRole, isLoading: roleLoading } = useQuery({
    queryKey: ["user-delivery-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "delivery_partner")
        .single();
      return !!data;
    },
    enabled: !!user?.id,
  });

  // Get profile
  const { data: profile } = useQuery({
    queryKey: ["delivery-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Get available orders count
  const { data: availableCount } = useQuery({
    queryKey: ["available-deliveries-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "ready_for_pickup")
        .is("delivery_partner_id", null);
      return count || 0;
    },
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/auth?role=delivery_partner");
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
          <p className="text-muted-foreground">Loading driver portal...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header with Online Status */}
      <header className={cn(
        "sticky top-0 z-40 transition-colors",
        isOnline ? "bg-primary text-primary-foreground" : "bg-background border-b"
      )}>
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "lg:hidden",
                isOnline && "text-primary-foreground hover:bg-primary-foreground/10"
              )}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden lg:flex items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isOnline ? "bg-primary-foreground/20" : "bg-gradient-dark"
              )}>
                <span className={cn(
                  "font-bold text-lg",
                  isOnline ? "text-primary-foreground" : "text-white"
                )}>S</span>
              </div>
              <div>
                <span className="font-display font-bold">Smash</span>
                <span className={cn(
                  "text-xs ml-1",
                  isOnline ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>Driver</span>
              </div>
            </div>
          </div>

          {/* Online Toggle & Earnings */}
          <div className="flex items-center gap-4">
            {/* Today's Earnings Badge */}
            <div className={cn(
              "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg",
              isOnline ? "bg-primary-foreground/20" : "bg-muted"
            )}>
              <Wallet className="h-4 w-4" />
              <span className="font-semibold">R{totalToday?.toFixed(2) || "0.00"}</span>
              <span className={cn(
                "text-xs",
                isOnline ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>today</span>
            </div>

            {/* Online Toggle */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl",
              isOnline ? "bg-primary-foreground/20" : "bg-muted"
            )}>
              <Zap className={cn("h-4 w-4", isOnline && "text-yellow-300")} />
              <span className="text-sm font-medium hidden sm:inline">
                {isOnline ? "Online" : "Offline"}
              </span>
              <Switch
                checked={isOnline}
                onCheckedChange={setIsOnline}
                className="data-[state=checked]:bg-green-500"
              />
            </div>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative rounded-xl",
                isOnline && "text-primary-foreground hover:bg-primary-foreground/10"
              )}
            >
              <Bell className="h-5 w-5" />
              {availableCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center">
                  {availableCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="flex flex-1">
        <aside className="hidden lg:flex w-64 flex-col bg-background border-r">
          {/* Driver Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {profile?.full_name?.charAt(0) || "D"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{profile?.full_name || "Driver"}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Package className="h-3 w-3" />
                  <span>{deliveriesToday} deliveries today</span>
                </div>
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
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.showBadge && availableCount > 0 && (
                    <Badge variant={isActive ? "secondary" : "default"} className="ml-auto">
                      {availableCount}
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
              <div className="w-8 h-8 rounded-lg bg-gradient-dark flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-display font-bold">Smash Driver</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Driver Info Mobile */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {profile?.full_name?.charAt(0) || "D"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{profile?.full_name || "Driver"}</p>
                <p className="text-sm text-muted-foreground">R{totalToday?.toFixed(2)} today</p>
              </div>
            </div>
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
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
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
        <main className="flex-1 pb-20 lg:pb-0 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-lg border-t safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all relative",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-foreground" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default DeliveryPortalLayout;
