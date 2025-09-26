import { ShoppingCart, User, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NavbarProps {
  type?: "customer" | "restaurant" | "delivery";
}

const Navbar = ({ type = "customer" }: NavbarProps) => {
  const location = useLocation();
  
  if (type === "restaurant") {
    return (
      <nav className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/restaurant-portal" className="text-2xl font-bold uber-green">
              UberEats Restaurant
            </Link>
            <div className="flex items-center gap-4">
              <Link 
                to="/restaurant-portal" 
                className={`px-4 py-2 rounded-lg transition-smooth ${
                  location.pathname === "/restaurant-portal" 
                    ? "bg-uber-green text-white" 
                    : "hover:bg-muted"
                }`}
              >
                Dashboard
              </Link>
              <Link 
                to="/restaurant-portal/orders" 
                className={`px-4 py-2 rounded-lg transition-smooth ${
                  location.pathname === "/restaurant-portal/orders" 
                    ? "bg-uber-green text-white" 
                    : "hover:bg-muted"
                }`}
              >
                Orders
              </Link>
              <Link 
                to="/restaurant-portal/menu" 
                className={`px-4 py-2 rounded-lg transition-smooth ${
                  location.pathname === "/restaurant-portal/menu" 
                    ? "bg-uber-green text-white" 
                    : "hover:bg-muted"
                }`}
              >
                Menu
              </Link>
              <Button variant="outline" size="sm">
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
      <nav className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/delivery-portal" className="text-2xl font-bold uber-green">
              UberEats Delivery
            </Link>
            <div className="flex items-center gap-4">
              <Link 
                to="/delivery-portal" 
                className={`px-4 py-2 rounded-lg transition-smooth ${
                  location.pathname === "/delivery-portal" 
                    ? "bg-uber-green text-white" 
                    : "hover:bg-muted"
                }`}
              >
                Dashboard
              </Link>
              <Link 
                to="/delivery-portal/orders" 
                className={`px-4 py-2 rounded-lg transition-smooth ${
                  location.pathname === "/delivery-portal/orders" 
                    ? "bg-uber-green text-white" 
                    : "hover:bg-muted"
                }`}
              >
                Deliveries
              </Link>
              <Link 
                to="/delivery-portal/earnings" 
                className={`px-4 py-2 rounded-lg transition-smooth ${
                  location.pathname === "/delivery-portal/earnings" 
                    ? "bg-uber-green text-white" 
                    : "hover:bg-muted"
                }`}
              >
                Earnings
              </Link>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Customer navbar
  return (
    <nav className="border-b bg-card shadow-card sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="text-2xl font-bold uber-green">
            UberEats
          </Link>
          
          <div className="flex items-center gap-2 flex-1 max-w-md mx-8">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Enter delivery address" 
              className="border-0 bg-muted focus-visible:ring-1"
            />
          </div>

          <div className="flex items-center gap-4">
            <Link to="/restaurants">
              <Button variant="ghost">Browse</Button>
            </Link>
            <Link to="/cart">
              <Button variant="outline" size="sm" className="relative">
                <ShoppingCart className="h-4 w-4" />
                <span className="absolute -top-2 -right-2 bg-uber-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  2
                </span>
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;