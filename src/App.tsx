import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GlobalErrorBoundary } from "@/components/errors/GlobalErrorBoundary";
import { RouteErrorBoundary } from "@/components/errors/RouteErrorBoundary";
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

// Lazy-loaded: Customer Account Pages
const OrderHistory = lazy(() => import("./pages/customer/OrderHistory"));
const Profile = lazy(() => import("./pages/customer/Profile"));
const Favorites = lazy(() => import("./pages/customer/Favorites"));

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
              <Route path="/customer" element={
                <RouteErrorBoundary fallbackTitle="Customer Portal Error">
                  <CustomerHome />
                </RouteErrorBoundary>
              } />
              <Route path="/restaurants" element={
                <RouteErrorBoundary fallbackTitle="Restaurant List Error">
                  <RestaurantList />
                </RouteErrorBoundary>
              } />
              <Route path="/restaurant/:id" element={
                <RouteErrorBoundary fallbackTitle="Restaurant Details Error">
                  <RestaurantDetail />
                </RouteErrorBoundary>
              } />
              <Route path="/cart" element={
                <RouteErrorBoundary fallbackTitle="Cart Error">
                  <Cart />
                </RouteErrorBoundary>
              } />
              <Route path="/checkout" element={
                <RouteErrorBoundary fallbackTitle="Checkout Error">
                  <Checkout />
                </RouteErrorBoundary>
              } />
              <Route path="/orders/:orderId" element={
                <RouteErrorBoundary fallbackTitle="Order Tracking Error">
                  <OrderTracking />
                </RouteErrorBoundary>
              } />
              <Route path="/orders" element={
                <RouteErrorBoundary fallbackTitle="Order History Error">
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute requiredRole="customer">
                      <OrderHistory />
                    </ProtectedRoute>
                  </Suspense>
                </RouteErrorBoundary>
              } />
              <Route path="/profile" element={
                <RouteErrorBoundary fallbackTitle="Profile Error">
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute requiredRole="customer">
                      <Profile />
                    </ProtectedRoute>
                  </Suspense>
                </RouteErrorBoundary>
              } />
              <Route path="/favorites" element={
                <RouteErrorBoundary fallbackTitle="Favorites Error">
                  <Suspense fallback={<PageLoader />}>
                    <Favorites />
                  </Suspense>
                </RouteErrorBoundary>
              } />

              {/* Ride-Sharing Routes */}
              <Route path="/rides/book" element={
                <RouteErrorBoundary fallbackTitle="Ride Booking Error">
                  <Suspense fallback={<PageLoader />}>
                    <BookRide />
                  </Suspense>
                </RouteErrorBoundary>
              } />
              <Route
                path="/rides/my-rides"
                element={
                  <RouteErrorBoundary fallbackTitle="My Rides Error">
                    <Suspense fallback={<PageLoader />}>
                      <ProtectedRoute requiredRole="rider">
                        <MyRides />
                      </ProtectedRoute>
                    </Suspense>
                  </RouteErrorBoundary>
                }
              />

              {/* Restaurant Portal Routes */}
              <Route
                path="/restaurant/dashboard"
                element={
                  <RouteErrorBoundary fallbackTitle="Restaurant Dashboard Error">
                    <Suspense fallback={<PageLoader />}>
                      <ProtectedRoute requiredRole="restaurant">
                        <RestaurantDashboard />
                      </ProtectedRoute>
                    </Suspense>
                  </RouteErrorBoundary>
                }
              />
              <Route
                path="/restaurant/orders"
                element={
                  <RouteErrorBoundary fallbackTitle="Restaurant Orders Error">
                    <Suspense fallback={<PageLoader />}>
                      <ProtectedRoute requiredRole="restaurant">
                        <RestaurantOrders />
                      </ProtectedRoute>
                    </Suspense>
                  </RouteErrorBoundary>
                }
              />
              <Route
                path="/restaurant/menu"
                element={
                  <RouteErrorBoundary fallbackTitle="Restaurant Menu Error">
                    <Suspense fallback={<PageLoader />}>
                      <ProtectedRoute requiredRole="restaurant">
                        <RestaurantMenu />
                      </ProtectedRoute>
                    </Suspense>
                  </RouteErrorBoundary>
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
                    <RouteErrorBoundary fallbackTitle="Delivery Dashboard Error">
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedRoute requiredRole="delivery_partner">
                          <DeliveryDashboard />
                        </ProtectedRoute>
                      </Suspense>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/delivery/orders"
                  element={
                    <RouteErrorBoundary fallbackTitle="Delivery Orders Error">
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedRoute requiredRole="delivery_partner">
                          <DeliveryOrders />
                        </ProtectedRoute>
                      </Suspense>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/delivery/earnings"
                  element={
                    <RouteErrorBoundary fallbackTitle="Delivery Earnings Error">
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedRoute requiredRole="delivery_partner">
                          <DeliveryEarnings />
                        </ProtectedRoute>
                      </Suspense>
                    </RouteErrorBoundary>
                  }
                />
              </Route>

              {/* Admin Portal Routes - Protected */}
              <Route element={<AdminLayout />}>
                <Route
                  path="/admin/dashboard"
                  element={
                    <RouteErrorBoundary fallbackTitle="Admin Dashboard Error">
                      <ProtectedRoute requiredRole="admin">
                        <AdminDashboard />
                      </ProtectedRoute>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <RouteErrorBoundary fallbackTitle="Admin Users Error">
                      <ProtectedRoute requiredRole="admin">
                        <AdminUsers />
                      </ProtectedRoute>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/admin/restaurants"
                  element={
                    <RouteErrorBoundary fallbackTitle="Admin Restaurants Error">
                      <ProtectedRoute requiredRole="admin">
                        <AdminRestaurants />
                      </ProtectedRoute>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <RouteErrorBoundary fallbackTitle="Admin Orders Error">
                      <ProtectedRoute requiredRole="admin">
                        <AdminOrders />
                      </ProtectedRoute>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/admin/delivery-partners"
                  element={
                    <RouteErrorBoundary fallbackTitle="Admin Delivery Partners Error">
                      <ProtectedRoute requiredRole="admin">
                        <AdminDeliveryPartners />
                      </ProtectedRoute>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/admin/revenue"
                  element={
                    <RouteErrorBoundary fallbackTitle="Admin Revenue Error">
                      <ProtectedRoute requiredRole="admin">
                        <AdminRevenue />
                      </ProtectedRoute>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <RouteErrorBoundary fallbackTitle="Admin Analytics Error">
                      <ProtectedRoute requiredRole="admin">
                        <AdminAnalytics />
                      </ProtectedRoute>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/admin/marketing"
                  element={
                    <RouteErrorBoundary fallbackTitle="Admin Marketing Error">
                      <ProtectedRoute requiredRole="admin">
                        <AdminMarketing />
                      </ProtectedRoute>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/admin/logs"
                  element={
                    <RouteErrorBoundary fallbackTitle="Admin Logs Error">
                      <ProtectedRoute requiredRole="admin">
                        <AdminLogs />
                      </ProtectedRoute>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/admin/launch-checklist"
                  element={
                    <RouteErrorBoundary fallbackTitle="Admin Launch Checklist Error">
                      <ProtectedRoute requiredRole="admin">
                        <LaunchChecklist />
                      </ProtectedRoute>
                    </RouteErrorBoundary>
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


