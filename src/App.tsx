import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GlobalErrorBoundary } from "@/components/errors/GlobalErrorBoundary";
import { RouteErrorBoundary } from "@/components/errors/RouteErrorBoundary";
import { NavigationLogger } from "@/components/logging/NavigationLogger";
import { SkipLink } from "@/components/shared/SkipLink";
import { loggingService } from "@/services/loggingService";
import { RestaurantChangeModal } from "@/components/customer/RestaurantChangeModal";
import { PanicButton } from "@/components/shared/PanicButton";
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

// Lazy-loaded: Provider Signup Pages
const ProviderSignupRestaurant = lazy(() => import("./pages/providers/ProviderSignupRestaurant"));
const ProviderSignupHotel = lazy(() => import("./pages/providers/ProviderSignupHotel"));
const ProviderSignupVenue = lazy(() => import("./pages/providers/ProviderSignupVenue"));
const ProviderSignupDelivery = lazy(() => import("./pages/providers/ProviderSignupDelivery"));
const ProviderSignupSecurity = lazy(() => import("./pages/providers/ProviderSignupSecurity"));

// Customer App (loaded immediately - main user flow)
import CustomerHome from "./pages/customer/CustomerHome";
const CustomerDashboard = lazy(() => import("./pages/customer/CustomerDashboard"));
import RestaurantList from "./pages/customer/RestaurantList";
import RestaurantDetail from "./pages/customer/RestaurantDetail";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import OrderTracking from "./pages/customer/OrderTracking";
import NotFound from "./pages/NotFound";

// Portal Layouts
import { CustomerLayout } from "./components/customer/CustomerLayout";

// Lazy-loaded: Customer Account Pages
const OrderHistory = lazy(() => import("./pages/customer/OrderHistory"));
const Profile = lazy(() => import("./pages/customer/Profile"));
const Favorites = lazy(() => import("./pages/customer/Favorites"));

// Lazy-loaded: Ride-Sharing App
const BookRide = lazy(() => import("./pages/rider/BookRide"));
const MyRides = lazy(() => import("./pages/rider/MyRides"));

// Lazy-loaded: Hotels Module
const HotelSearch = lazy(() => import("./pages/hotels/HotelSearch"));
const HotelDetail = lazy(() => import("./pages/hotels/HotelDetail"));
const HotelPartnerDashboard = lazy(() => import("./pages/hotel-partner/HotelPartnerDashboard"));

// Lazy-loaded: Venues & Experiences Module
const VenueSearch = lazy(() => import("./pages/venues/VenueSearch"));
const VenueDetail = lazy(() => import("./pages/venues/VenueDetail"));
const ExperienceSearch = lazy(() => import("./pages/venues/ExperienceSearch"));
const ExperienceDetail = lazy(() => import("./pages/venues/ExperienceDetail"));
const VenuePartnerDashboard = lazy(() => import("./pages/venue-partner/VenuePartnerDashboard"));

// Lazy-loaded: Live Map Search
const LiveMapSearch = lazy(() => import("./pages/map/LiveMapSearch"));

// Lazy-loaded: Restaurant Portal
const RestaurantPortalLayout = lazy(() => import("./components/restaurant/RestaurantPortalLayout"));
const RestaurantDashboard = lazy(() => import("./pages/restaurant/RestaurantDashboard"));
const RestaurantOrders = lazy(() => import("./pages/restaurant/RestaurantOrders"));
const RestaurantMenu = lazy(() => import("./pages/restaurant/RestaurantMenu"));

// Lazy-loaded: Delivery Partner Portal
const DeliveryPortalLayout = lazy(() => import("./components/delivery/DeliveryPortalLayout"));
const DeliveryDashboard = lazy(() => import("./pages/delivery/DeliveryDashboard"));
const DeliveryOrders = lazy(() => import("./pages/delivery/DeliveryOrders"));
const DeliveryEarnings = lazy(() => import("./pages/delivery/DeliveryEarnings"));

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
const SuperAdminDashboard = lazy(() => import("./pages/admin/SuperAdminDashboard"));
const AdminHotels = lazy(() => import("./pages/admin/AdminHotels"));
const AdminVenues = lazy(() => import("./pages/admin/AdminVenues"));
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
      staleTime: QUERY_CACHE.STALE_TIME,
      gcTime: QUERY_CACHE.GC_TIME,
    },
    mutations: {
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error("Mutation error:", error);
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
        {/* ============================================ */}
        {/* PUBLIC ROUTES - Marketing & Landing Pages */}
        {/* ============================================ */}
        <Route path="/" element={<Index />} />
        <Route path="/customer-info" element={<CustomerLanding />} />
        <Route path="/restaurant-info" element={<RestaurantLanding />} />
        <Route path="/shop-info" element={<ShopLanding />} />
        <Route path="/delivery-info" element={<DeliveryLanding />} />
        <Route path="/auth" element={<Auth />} />

        {/* ============================================ */}
        {/* PROVIDER SIGNUP PAGES */}
        {/* ============================================ */}
        <Route path="/partner/restaurant" element={
          <RouteErrorBoundary fallbackTitle="Provider Signup Error">
            <Suspense fallback={<PageLoader />}>
              <ProviderSignupRestaurant />
            </Suspense>
          </RouteErrorBoundary>
        } />
        <Route path="/partner/hotel" element={
          <RouteErrorBoundary fallbackTitle="Provider Signup Error">
            <Suspense fallback={<PageLoader />}>
              <ProviderSignupHotel />
            </Suspense>
          </RouteErrorBoundary>
        } />
        <Route path="/partner/venue" element={
          <RouteErrorBoundary fallbackTitle="Provider Signup Error">
            <Suspense fallback={<PageLoader />}>
              <ProviderSignupVenue />
            </Suspense>
          </RouteErrorBoundary>
        } />
        <Route path="/partner/delivery" element={
          <RouteErrorBoundary fallbackTitle="Provider Signup Error">
            <Suspense fallback={<PageLoader />}>
              <ProviderSignupDelivery />
            </Suspense>
          </RouteErrorBoundary>
        } />
        <Route path="/partner/security" element={
          <RouteErrorBoundary fallbackTitle="Provider Signup Error">
            <Suspense fallback={<PageLoader />}>
              <ProviderSignupSecurity />
            </Suspense>
          </RouteErrorBoundary>
        } />

        {/* ============================================ */}
        {/* CUSTOMER PORTAL - Food Ordering Experience */}
        {/* ============================================ */}
        <Route element={<CustomerLayout />}>
          <Route path="/customer" element={
            <RouteErrorBoundary fallbackTitle="Customer Portal Error">
              <CustomerHome />
            </RouteErrorBoundary>
          } />
          <Route path="/dashboard" element={
            <RouteErrorBoundary fallbackTitle="Customer Dashboard Error">
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute requiredRole="customer">
                  <CustomerDashboard />
                </ProtectedRoute>
              </Suspense>
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
              <ProtectedRoute requiredRole="customer">
                <Checkout />
              </ProtectedRoute>
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
        </Route>

        {/* ============================================ */}
        {/* RIDE-SHARING MODULE */}
        {/* ============================================ */}
        <Route path="/rides/book" element={
          <RouteErrorBoundary fallbackTitle="Ride Booking Error">
            <Suspense fallback={<PageLoader />}>
              <BookRide />
            </Suspense>
          </RouteErrorBoundary>
        } />
        <Route path="/rides/my-rides" element={
          <RouteErrorBoundary fallbackTitle="My Rides Error">
            <Suspense fallback={<PageLoader />}>
              <ProtectedRoute requiredRole="rider">
                <MyRides />
              </ProtectedRoute>
            </Suspense>
          </RouteErrorBoundary>
        } />

        {/* ============================================ */}
        {/* HOTELS MODULE - Accommodation Booking */}
        {/* ============================================ */}
        <Route path="/hotels" element={
          <RouteErrorBoundary fallbackTitle="Hotel Search Error">
            <Suspense fallback={<PageLoader />}>
              <HotelSearch />
            </Suspense>
          </RouteErrorBoundary>
        } />
        <Route path="/hotels/:id" element={
          <RouteErrorBoundary fallbackTitle="Hotel Details Error">
            <Suspense fallback={<PageLoader />}>
              <HotelDetail />
            </Suspense>
          </RouteErrorBoundary>
        } />

        {/* ============================================ */}
        {/* HOTEL PARTNER PORTAL - Property Management */}
        {/* ============================================ */}
        <Route path="/hotel-partner/*" element={
          <RouteErrorBoundary fallbackTitle="Hotel Partner Error">
            <Suspense fallback={<PageLoader />}>
              <ProtectedRoute requiredRole="hotel_partner">
                <HotelPartnerDashboard />
              </ProtectedRoute>
            </Suspense>
          </RouteErrorBoundary>
        } />

        {/* ============================================ */}
        {/* VENUES & EXPERIENCES MODULE */}
        {/* ============================================ */}
        <Route path="/venues" element={
          <RouteErrorBoundary fallbackTitle="Venue Search Error">
            <Suspense fallback={<PageLoader />}>
              <VenueSearch />
            </Suspense>
          </RouteErrorBoundary>
        } />
        <Route path="/venues/:id" element={
          <RouteErrorBoundary fallbackTitle="Venue Details Error">
            <Suspense fallback={<PageLoader />}>
              <VenueDetail />
            </Suspense>
          </RouteErrorBoundary>
        } />
        <Route path="/experiences" element={
          <RouteErrorBoundary fallbackTitle="Experience Search Error">
            <Suspense fallback={<PageLoader />}>
              <ExperienceSearch />
            </Suspense>
          </RouteErrorBoundary>
        } />
        <Route path="/experiences/:id" element={
          <RouteErrorBoundary fallbackTitle="Experience Details Error">
            <Suspense fallback={<PageLoader />}>
              <ExperienceDetail />
            </Suspense>
          </RouteErrorBoundary>
        } />

        {/* ============================================ */}
        {/* VENUE PARTNER PORTAL */}
        {/* ============================================ */}
        <Route path="/venue-partner/*" element={
          <RouteErrorBoundary fallbackTitle="Venue Partner Error">
            <Suspense fallback={<PageLoader />}>
              <ProtectedRoute requiredRole="venue_partner">
                <VenuePartnerDashboard />
              </ProtectedRoute>
            </Suspense>
          </RouteErrorBoundary>
        } />

        {/* ============================================ */}
        {/* LIVE MAP SEARCH */}
        {/* ============================================ */}
        <Route path="/map" element={
          <RouteErrorBoundary fallbackTitle="Map Search Error">
            <Suspense fallback={<PageLoader />}>
              <LiveMapSearch />
            </Suspense>
          </RouteErrorBoundary>
        } />

        {/* ============================================ */}
        {/* RESTAURANT PORTAL - Business Management */}
        {/* ============================================ */}
        <Route element={
          <Suspense fallback={<PageLoader />}>
            <RestaurantPortalLayout />
          </Suspense>
        }>
          <Route path="/restaurant/dashboard" element={
            <RouteErrorBoundary fallbackTitle="Restaurant Dashboard Error">
              <Suspense fallback={<PageLoader />}>
                <RestaurantDashboard />
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/restaurant/orders" element={
            <RouteErrorBoundary fallbackTitle="Restaurant Orders Error">
              <Suspense fallback={<PageLoader />}>
                <RestaurantOrders />
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/restaurant/menu" element={
            <RouteErrorBoundary fallbackTitle="Restaurant Menu Error">
              <Suspense fallback={<PageLoader />}>
                <RestaurantMenu />
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/restaurant/analytics" element={
            <RouteErrorBoundary fallbackTitle="Restaurant Analytics Error">
              <Suspense fallback={<PageLoader />}>
                <RestaurantDashboard />
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/restaurant/settings" element={
            <RouteErrorBoundary fallbackTitle="Restaurant Settings Error">
              <Suspense fallback={<PageLoader />}>
                <RestaurantDashboard />
              </Suspense>
            </RouteErrorBoundary>
          } />
        </Route>

        {/* ============================================ */}
        {/* DELIVERY PARTNER PORTAL - Driver Experience */}
        {/* ============================================ */}
        <Route element={
          <Suspense fallback={<PageLoader />}>
            <DeliveryPortalLayout />
          </Suspense>
        }>
          <Route path="/delivery/dashboard" element={
            <RouteErrorBoundary fallbackTitle="Delivery Dashboard Error">
              <Suspense fallback={<PageLoader />}>
                <DeliveryDashboard />
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/delivery/orders" element={
            <RouteErrorBoundary fallbackTitle="Delivery Orders Error">
              <Suspense fallback={<PageLoader />}>
                <DeliveryOrders />
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/delivery/earnings" element={
            <RouteErrorBoundary fallbackTitle="Delivery Earnings Error">
              <Suspense fallback={<PageLoader />}>
                <DeliveryEarnings />
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/delivery/map" element={
            <RouteErrorBoundary fallbackTitle="Delivery Map Error">
              <Suspense fallback={<PageLoader />}>
                <DeliveryDashboard />
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/delivery/profile" element={
            <RouteErrorBoundary fallbackTitle="Delivery Profile Error">
              <Suspense fallback={<PageLoader />}>
                <DeliveryDashboard />
              </Suspense>
            </RouteErrorBoundary>
          } />
        </Route>

        {/* ============================================ */}
        {/* ADMIN PORTAL - Platform Management */}
        {/* ============================================ */}
        <Route element={
          <Suspense fallback={<PageLoader />}>
            <AdminLayout />
          </Suspense>
        }>
          <Route path="/admin/dashboard" element={
            <RouteErrorBoundary fallbackTitle="Admin Dashboard Error">
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/admin/users" element={
            <RouteErrorBoundary fallbackTitle="Admin Users Error">
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute requiredRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/admin/restaurants" element={
            <RouteErrorBoundary fallbackTitle="Admin Restaurants Error">
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute requiredRole="admin">
                  <AdminRestaurants />
                </ProtectedRoute>
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/admin/orders" element={
            <RouteErrorBoundary fallbackTitle="Admin Orders Error">
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute requiredRole="admin">
                  <AdminOrders />
                </ProtectedRoute>
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/admin/delivery-partners" element={
            <RouteErrorBoundary fallbackTitle="Admin Delivery Partners Error">
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute requiredRole="admin">
                  <AdminDeliveryPartners />
                </ProtectedRoute>
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/admin/revenue" element={
            <RouteErrorBoundary fallbackTitle="Admin Revenue Error">
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute requiredRole="admin">
                  <AdminRevenue />
                </ProtectedRoute>
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/admin/analytics" element={
            <RouteErrorBoundary fallbackTitle="Admin Analytics Error">
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute requiredRole="admin">
                  <AdminAnalytics />
                </ProtectedRoute>
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/admin/marketing" element={
            <RouteErrorBoundary fallbackTitle="Admin Marketing Error">
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute requiredRole="admin">
                  <AdminMarketing />
                </ProtectedRoute>
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/admin/logs" element={
            <RouteErrorBoundary fallbackTitle="Admin Logs Error">
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute requiredRole="admin">
                  <AdminLogs />
                </ProtectedRoute>
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/admin/launch-checklist" element={
            <RouteErrorBoundary fallbackTitle="Admin Launch Checklist Error">
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute requiredRole="admin">
                  <LaunchChecklist />
                </ProtectedRoute>
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/admin/hotels" element={
            <RouteErrorBoundary fallbackTitle="Admin Hotels Error">
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute requiredRole="admin">
                  <AdminHotels />
                </ProtectedRoute>
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/admin/venues" element={
            <RouteErrorBoundary fallbackTitle="Admin Venues Error">
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute requiredRole="admin">
                  <AdminVenues />
                </ProtectedRoute>
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/admin/superadmin" element={
            <RouteErrorBoundary fallbackTitle="Super Admin Dashboard Error">
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute requiredRole="superadmin">
                  <SuperAdminDashboard />
                </ProtectedRoute>
              </Suspense>
            </RouteErrorBoundary>
          } />
          <Route path="/admin/settings" element={
            <RouteErrorBoundary fallbackTitle="Platform Settings Error">
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute requiredRole="superadmin">
                  <SuperAdminDashboard />
                </ProtectedRoute>
              </Suspense>
            </RouteErrorBoundary>
          } />
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <GlobalErrorBoundary>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SkipLink />
          <NavigationLogger />
          <AuthProvider>
            <RestaurantChangeModal />
            <PanicButton variant="floating" size="md" />
            <main id="main-content">
              <AppContent />
            </main>
          </AuthProvider>
        </BrowserRouter>
      </GlobalErrorBoundary>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
