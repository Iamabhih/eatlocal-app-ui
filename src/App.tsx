import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/logging/ErrorBoundary";
import { NavigationLogger } from "@/components/logging/NavigationLogger";
import { loggingService } from "@/services/loggingService";
import { RestaurantChangeModal } from "@/components/customer/RestaurantChangeModal";
import { QUERY_CACHE } from "@/lib/constants";
import { logger } from "@/lib/logger";

import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Landing Pages
import CustomerLanding from "./pages/CustomerLanding";
import RestaurantLanding from "./pages/RestaurantLanding";
import DeliveryLanding from "./pages/DeliveryLanding";
import ShopLanding from "./pages/ShopLanding";

// Customer App
import CustomerHome from "./pages/customer/CustomerHome";
import RestaurantList from "./pages/customer/RestaurantList";
import RestaurantDetail from "./pages/customer/RestaurantDetail";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import OrderTracking from "./pages/customer/OrderTracking";

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
import AdminLogs from "./pages/admin/AdminLogs";
import { AdminLayout } from "./components/admin/AdminLayout";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: QUERY_CACHE.STALE_TIME, // 5 minutes
      gcTime: QUERY_CACHE.GC_TIME, // 10 minutes (renamed from cacheTime in React Query v5)
    },
    mutations: {
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Log to console
        logger.error("Mutation error:", error);

        // Log to service
        loggingService.logApiCall({
          endpoint: "Mutation",
          method: "POST",
          duration_ms: 0,
          success: false,
          error_message: errorMessage,
        });
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <NavigationLogger />
        <AuthProvider>
          <CartProvider>
            <RestaurantChangeModal />
            <Routes>
              {/* Home Page */}
              <Route path="/" element={<Index />} />

              {/* Landing Pages */}
              <Route path="/customer-info" element={<CustomerLanding />} />
              <Route path="/restaurant-info" element={<RestaurantLanding />} />
              <Route path="/shop-info" element={<ShopLanding />} />
              <Route path="/delivery-info" element={<DeliveryLanding />} />

              {/* Auth Routes */}
              <Route path="/auth" element={<Auth />} />

              {/* Customer App Routes */}
              <Route path="/customer" element={<CustomerHome />} />
              <Route path="/restaurants" element={<RestaurantList />} />
              <Route path="/restaurant/:id" element={<RestaurantDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders/:orderId" element={<OrderTracking />} />

              {/* Restaurant Portal Routes */}
              <Route
                path="/restaurant/dashboard"
                element={
                  <ProtectedRoute requiredRole="restaurant">
                    <RestaurantDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/restaurant/orders"
                element={
                  <ProtectedRoute requiredRole="restaurant">
                    <RestaurantOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/restaurant/menu"
                element={
                  <ProtectedRoute requiredRole="restaurant">
                    <RestaurantMenu />
                  </ProtectedRoute>
                }
              />

              {/* Delivery Partner Portal Routes */}
              <Route element={<DeliveryLayout />}>
                <Route
                  path="/delivery/dashboard"
                  element={
                    <ProtectedRoute requiredRole="delivery_partner">
                      <DeliveryDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/delivery/orders"
                  element={
                    <ProtectedRoute requiredRole="delivery_partner">
                      <DeliveryOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/delivery/earnings"
                  element={
                    <ProtectedRoute requiredRole="delivery_partner">
                      <DeliveryEarnings />
                    </ProtectedRoute>
                  }
                />
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
                <Route path="/admin/logs" element={<AdminLogs />} />
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
