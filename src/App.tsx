import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Customer App Routes */}
          <Route path="/" element={<CustomerHome />} />
          <Route path="/restaurants" element={<RestaurantList />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/cart" element={<Cart />} />

          {/* Restaurant Portal Routes */}
          <Route path="/restaurant-portal" element={<RestaurantDashboard />} />
          <Route path="/restaurant-portal/orders" element={<RestaurantOrders />} />
          <Route path="/restaurant-portal/menu" element={<RestaurantMenu />} />

          {/* Delivery Partner Portal Routes */}
          <Route path="/delivery-portal" element={<DeliveryDashboard />} />
          <Route path="/delivery-portal/orders" element={<DeliveryOrders />} />
          <Route path="/delivery-portal/earnings" element={<DeliveryEarnings />} />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;