import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GlobalErrorBoundary } from "@/components/errors/GlobalErrorBoundary";
import { NavigationLogger } from "@/components/logging/NavigationLogger";
import { loggingService } from "@/services/loggingService";
import { RestaurantChangeModal } from "@/components/customer/RestaurantChangeModal";
import { QUERY_CACHE } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { recoverPendingOrders } from "@/lib/orderRecovery";
import { useEffect, lazy, Suspense } from "react";

// Core pages (loaded immediately)
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Landing Pages (loaded immediately - marketing pages)
import CustomerLanding from "./pages/CustomerLanding";
import RestaurantLanding from "./pages/RestaurantLanding";
import DeliveryLanding from "./pages/DeliveryLanding";
import ShopLanding from "./pages/ShopLanding";

// Customer App (loaded immediately - main user flow)
import CustomerHome from "./pages/customer/CustomerHome";
import RestaurantList from "./pages/customer/RestaurantList";
import RestaurantDetail from "./pages/customer/RestaurantDetail";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import OrderTracking from "./pages/customer/OrderTracking";
import NotFound from "./pages/NotFound";

// Lazy-loaded: Ride-Sharing App
const BookRide = lazy(() => import("./pages/rider/BookRide"));
const MyRides = lazy(() => import("./pages/rider/MyRides"));

// Lazy-loaded: Restaurant Portal
const RestaurantDashboard = lazy(() => import("./pages/restaurant/RestaurantDashboard"));
const RestaurantOrders = lazy(() => import("./pages/restaurant/RestaurantOrders"));
const RestaurantMenu = lazy(() => import("./pages/restaurant/RestaurantMenu"));

// Lazy-loaded: Delivery Partner Portal
const DeliveryDashboard = lazy(() => import("./pages/delivery/DeliveryDashboard"));
const DeliveryOrders = lazy(() => import("./pages/delivery/DeliveryOrders"));
const DeliveryEarnings = lazy(() => import("./pages/delivery/DeliveryEarnings"));
const DeliveryLayout = lazy(() => import("./components/delivery/DeliveryLayout").then(m => ({ default: m.DeliveryLayout })));

// Lazy-loaded: Admin Portal
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminRestaurants = lazy(() => import("./pages/admin/AdminRestaurants"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminDeliveryPartners = lazy(() => import("./pages/admin/AdminDeliveryPartners"));
const AdminRevenue = lazy(() => import("./pages/admin/AdminRevenue"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const LaunchChecklist = lazy(() => import("./pages/admin/LaunchChecklist"));
const AdminMarketing = lazy(() => import("./pages/admin/AdminMarketing"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      <p className="mt-4 text-muted-foreground">Loading...</p>
    </div>
  </div>
);

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

function AppContent() {
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    // Recover any pending orders on app load
    recoverPendingOrders().then(recovered => {
      if (recovered.length > 0) {
        logger.log('Recovered pending orders:', recovered);
      }
    });
  }, []);

  return (
    <>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground py-2 px-4 text-center z-50">
          <p className="text-sm font-medium">
            You're offline. Some features may not be available.
          </p>
        </div>
      )}
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

              {/* Ride-Sharing Routes */}
              <Route path="/rides/book" element={
                <Suspense fallback={<PageLoader />}>
                  <BookRide />
                </Suspense>
              } />
              <Route
                path="/rides/my-rides"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute requiredRole="rider">
                      <MyRides />
                    </ProtectedRoute>
                  </Suspense>
                }
              />

              {/* Restaurant Portal Routes */}
              <Route
                path="/restaurant/dashboard"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute requiredRole="restaurant">
                      <RestaurantDashboard />
                    </ProtectedRoute>
                  </Suspense>
                }
              />
              <Route
                path="/restaurant/orders"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute requiredRole="restaurant">
                      <RestaurantOrders />
                    </ProtectedRoute>
                  </Suspense>
                }
              />
              <Route
                path="/restaurant/menu"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute requiredRole="restaurant">
                      <RestaurantMenu />
                    </ProtectedRoute>
                  </Suspense>
                }
              />

              {/* Delivery Partner Portal Routes */}
              <Route element={
                <Suspense fallback={<PageLoader />}>
                  <DeliveryLayout />
                </Suspense>
              }>
                <Route
                  path="/delivery/dashboard"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <ProtectedRoute requiredRole="delivery_partner">
                        <DeliveryDashboard />
                      </ProtectedRoute>
                    </Suspense>
                  }
                />
                <Route
                  path="/delivery/orders"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <ProtectedRoute requiredRole="delivery_partner">
                        <DeliveryOrders />
                      </ProtectedRoute>
                    </Suspense>
                  }
                />
                <Route
                  path="/delivery/earnings"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <ProtectedRoute requiredRole="delivery_partner">
                        <DeliveryEarnings />
                      </ProtectedRoute>
                    </Suspense>
                  }
                />
              </Route>

              {/* Admin Portal Routes - Protected */}
              <Route element={<AdminLayout />}>
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminUsers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/restaurants"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminRestaurants />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/delivery-partners"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDeliveryPartners />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/revenue"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminRevenue />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminAnalytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/marketing"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminMarketing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/logs"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminLogs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/launch-checklist"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <LaunchChecklist />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalErrorBoundary>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <NavigationLogger />
        <AuthProvider>
          <RestaurantChangeModal />
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  </QueryClientProvider>
);

export default App;


