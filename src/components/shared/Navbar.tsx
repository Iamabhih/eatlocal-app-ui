import { ShoppingCart, User, MapPin, Menu, X, Search, Bell, Heart, Package, LogOut, Building2, Hotel, Sparkles, Car, Map, Utensils, ChevronDown } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { LanguageSelector } from "./LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  type?: "customer" | "restaurant" | "delivery";
}

const Navbar = ({ type = "customer" }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (type === "restaurant") {
    return (
      <nav className="sticky top-0 z-50 glass-subtle border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/restaurant/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-secondary flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-display font-bold text-foreground hidden sm:block">
                Smash Local <span className="text-accent font-normal text-sm">Restaurant</span>
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
              <LanguageSelector />
              <ThemeToggle />
              <Button variant="outline" size="icon" className="rounded-xl ml-2">
                <Bell className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-xl">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('nav.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-display font-bold text-foreground hidden sm:block">
                Smash Local <span className="text-muted-foreground font-normal text-sm">Driver</span>
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
              <LanguageSelector />
              <ThemeToggle />
              <Button variant="outline" size="icon" className="rounded-xl ml-2">
                <Bell className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-xl">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('nav.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-display font-bold text-gradient-primary hidden sm:block">
              Smash Local
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
          <div className="hidden md:flex items-center gap-2">
            {/* Services Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-xl gap-1">
                  Services
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/restaurants")}>
                  <Utensils className="h-4 w-4 mr-2 text-orange-500" />
                  Food Delivery
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/hotels")}>
                  <Hotel className="h-4 w-4 mr-2 text-blue-500" />
                  Hotels & Stays
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/venues")}>
                  <Building2 className="h-4 w-4 mr-2 text-purple-500" />
                  Venues
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/experiences")}>
                  <Sparkles className="h-4 w-4 mr-2 text-pink-500" />
                  Experiences
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/rides/book")}>
                  <Car className="h-4 w-4 mr-2 text-green-500" />
                  Rides
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/map")}>
                  <Map className="h-4 w-4 mr-2 text-teal-500" />
                  Explore Map
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/restaurants">
              <Button variant="ghost" size="sm" className="rounded-xl gap-1">
                <Utensils className="h-4 w-4" />
                Food
              </Button>
            </Link>
            <Link to="/hotels">
              <Button variant="ghost" size="sm" className="rounded-xl gap-1">
                <Hotel className="h-4 w-4" />
                Hotels
              </Button>
            </Link>
            <Link to="/experiences">
              <Button variant="ghost" size="sm" className="rounded-xl gap-1">
                <Sparkles className="h-4 w-4" />
                Experiences
              </Button>
            </Link>
            <Link to="/favorites">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Heart className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/cart">
              <Button variant="outline" size="icon" className="relative rounded-xl">
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-2 border-background">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <LanguageSelector />
            <ThemeToggle />

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-xl">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="h-4 w-4 mr-2" />
                    {t('customer.profile.title')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/orders")}>
                    <Package className="h-4 w-4 mr-2" />
                    {t('customer.orders.title')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/favorites")}>
                    <Heart className="h-4 w-4 mr-2" />
                    {t('customer.favorites.title')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('nav.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth?role=customer">
                <Button variant="secondary" size="sm" className="rounded-xl">
                  {t('nav.signIn')}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link to="/cart">
              <Button variant="outline" size="icon" className="relative rounded-xl">
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-2 border-background">
                    {cartCount}
                  </Badge>
                )}
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
            mobileMenuOpen ? "max-h-[500px] pb-4" : "max-h-0"
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
                  <Utensils className="h-4 w-4 mr-2 text-orange-500" />
                  Food Delivery
                </Button>
              </Link>
              <Link to="/hotels" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start rounded-xl">
                  <Hotel className="h-4 w-4 mr-2 text-blue-500" />
                  Hotels & Stays
                </Button>
              </Link>
              <Link to="/venues" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start rounded-xl">
                  <Building2 className="h-4 w-4 mr-2 text-purple-500" />
                  Venues
                </Button>
              </Link>
              <Link to="/experiences" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start rounded-xl">
                  <Sparkles className="h-4 w-4 mr-2 text-pink-500" />
                  Experiences
                </Button>
              </Link>
              <Link to="/rides/book" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start rounded-xl">
                  <Car className="h-4 w-4 mr-2 text-green-500" />
                  Rides
                </Button>
              </Link>
              <Link to="/map" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start rounded-xl">
                  <Map className="h-4 w-4 mr-2 text-teal-500" />
                  Explore Map
                </Button>
              </Link>
              {user ? (
                <>
                  <Link to="/orders" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start rounded-xl">
                      <Package className="h-4 w-4 mr-2" />
                      My Orders
                    </Button>
                  </Link>
                  <Link to="/favorites" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start rounded-xl">
                      <Heart className="h-4 w-4 mr-2" />
                      Favorites
                    </Button>
                  </Link>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start rounded-xl">
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-xl text-destructive hover:text-destructive"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link to="/auth?role=customer" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start rounded-xl">
                    <User className="h-4 w-4 mr-2" />
                    Sign In / Sign Up
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
