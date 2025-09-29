import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Customer App
import CustomerHome from "./pages/customer/CustomerHome";
import RestaurantList from "./pages/customer/RestaurantList";
import RestaurantDetail from "./pages/customer/RestaurantDetail";
import Cart from "./pages/customer/Cart";

// Restaurant Portal
import RestaurantDashboard from "./pages/restaurant/RestaurantDashboard";
import RestaurantOrders from "./pages/restaurant/RestaurantOrders";
import RestaurantMenu from "./pages/restaurant/RestaurantMenu";

// Delivery Partner Portal
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import DeliveryOrders from "./pages/delivery/DeliveryOrders";
import DeliveryEarnings from "./pages/delivery/DeliveryEarnings";
import { DeliveryLayout } from "./components/delivery/DeliveryLayout";

// Admin Portal
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminDeliveryPartners from "./pages/admin/AdminDeliveryPartners";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminMarketing from "./pages/admin/AdminMarketing";
import { AdminLayout } from "./components/admin/AdminLayout";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Home Page */}
              <Route path="/" element={<Index />} />
              
              {/* Auth Routes */}
              <Route path="/auth" element={<Auth />} />

              {/* Customer App Routes */}
              <Route path="/customer" element={<CustomerHome />} />
            <Route path="/restaurants" element={<RestaurantList />} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            <Route path="/cart" element={<Cart />} />

            {/* Restaurant Portal Routes */}
            <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
            <Route path="/restaurant/orders" element={<RestaurantOrders />} />
            <Route path="/restaurant/menu" element={<RestaurantMenu />} />

            {/* Delivery Partner Portal Routes */}
            <Route element={<DeliveryLayout />}>
              <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
              <Route path="/delivery/orders" element={<DeliveryOrders />} />
              <Route path="/delivery/earnings" element={<DeliveryEarnings />} />
            </Route>

            {/* Admin Portal Routes */}
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/restaurants" element={<AdminRestaurants />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/delivery-partners" element={<AdminDeliveryPartners />} />
              <Route path="/admin/revenue" element={<AdminRevenue />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/marketing" element={<AdminMarketing />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
</QueryClientProvider>
);

export default App;