// Key improvements in this fixed version:
// 1. Removed hardcoded PayFast credentials fallbacks
// 2. Added order amount validation
// 3. Added minimum order validation
// 4. Better error handling with fallback
// 5. Retry mechanism for failed payments
// 6. Input validation before payment

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShoppingBag, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/shared/Navbar";
import { AddressSelector } from "@/components/customer/AddressSelector";
import { FulfillmentSelector } from "@/components/checkout/FulfillmentSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Move to constants file in production
const PRICING = {
  DELIVERY_FEE: 2.49,
  SERVICE_FEE_RATE: 0.045, // 4.5%
} as const;

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, getSubtotal, getTax, getTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [restaurant, setRestaurant] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth?role=customer&redirect=/checkout");
      return;
    }

    if (items.length === 0) {
      navigate("/cart");
      return;
    }

    // Fetch restaurant details for minimum order validation
    fetchRestaurantDetails();
  }, [user, items, navigate]);

  const fetchRestaurantDetails = async () => {
    if (items.length === 0) return;

    const { data, error } = await supabase
      .from("restaurants")
      .select("id, name, minimum_order, delivery_fee")
      .eq("id", items[0].restaurantId)
      .single();

    if (error) {
      console.error("Error fetching restaurant:", error);
      return;
    }

    setRestaurant(data);
  };

  const deliveryFee = fulfillmentType === "delivery" ? restaurant?.delivery_fee || PRICING.DELIVERY_FEE : 0;
  const subtotal = getSubtotal();
  const serviceFee = (subtotal + deliveryFee) * PRICING.SERVICE_FEE_RATE;
  const total = subtotal + deliveryFee + serviceFee;

  // Generate 4-digit pickup code
  const generatePickupCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Validation function
  const validateOrder = () => {
    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue",
        variant: "destructive",
      });
      return false;
    }

    // Check if cart is empty
    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart",
        variant: "destructive",
      });
      return false;
    }

    // Check if delivery address is selected for delivery orders
    if (fulfillmentType === "delivery" && !selectedAddressId) {
      toast({
        title: "Missing Delivery Address",
        description: "Please select a delivery address",
        variant: "destructive",
      });
      return false;
    }

    // Validate order total is positive
    if (total <= 0) {
      toast({
        title: "Invalid Order Total",
        description: "Order total must be greater than zero",
        variant: "destructive",
      });
      return false;
    }

    // Check minimum order requirement
    if (restaurant && subtotal < restaurant.minimum_order) {
      toast({
        title: "Minimum Order Not Met",
        description: `Minimum order for ${restaurant.name} is R${restaurant.minimum_order.toFixed(2)}`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    // Validate before proceeding
    if (!validateOrder()) {
      return;
    }

    // Validate PayFast credentials are configured
    const merchantId = import.meta.env.VITE_PAYFAST_MERCHANT_ID;
    const merchantKey = import.meta.env.VITE_PAYFAST_MERCHANT_KEY;

    if (!merchantId || !merchantKey) {
      toast({
        title: "Payment Configuration Error",
        description: "Payment system is not properly configured. Please contact support.",
        variant: "destructive",
      });
      console.error("PayFast credentials not configured");
      return;
    }

    setLoading(true);
    setProcessingPayment(true);

    try {
      // Generate order number and pickup code (if applicable)
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const pickupCode = fulfillmentType === "pickup" ? generatePickupCode() : null;

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_id: user.id,
            restaurant_id: items[0].restaurantId,
            delivery_address_id: fulfillmentType === "delivery" ? selectedAddressId : null,
            order_number: orderNumber,
            fulfillment_type: fulfillmentType,
            pickup_code: pickupCode,
            subtotal: Number(subtotal.toFixed(2)),
            delivery_fee: Number(deliveryFee.toFixed(2)),
            tax: 0,
            total: Number(total.toFixed(2)),
            status: "pending",
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: Number(item.price.toFixed(2)),
        subtotal: Number((item.price * item.quantity).toFixed(2)),
        special_instructions: item.specialInstructions,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

      if (itemsError) throw itemsError;

      // Store order ID for retry mechanism
      localStorage.setItem("pending_order_id", order.id);
      localStorage.setItem("pending_order_expiry", (Date.now() + 30 * 60 * 1000).toString()); // 30 min expiry

      // Generate PayFast payment form
      const paymentData = {
        merchant_id: merchantId,
        merchant_key: merchantKey,
        return_url: `${window.location.origin}/orders/${order.id}`,
        cancel_url: `${window.location.origin}/checkout`,
        notify_url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payfast-webhook`,
        name_first: user.email?.split("@")[0] || "Customer",
        email_address: user.email || "",
        m_payment_id: order.id,
        amount: total.toFixed(2),
        item_name: `Order from ${items[0].restaurantName}`,
        item_description: `${items.length} item(s)`,
      };

      // Create form and submit
      const form = document.createElement("form");
      form.method = "POST";
      form.action =
        import.meta.env.MODE === "production"
          ? "https://www.payfast.co.za/eng/process"
          : "https://sandbox.payfast.co.za/eng/process";

      Object.entries(paymentData).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);

      // Clear cart before redirecting
      clearCart();

      try {
        // Submit form to PayFast
        form.submit();
      } catch (submitError) {
        console.error("Form submission error:", submitError);

        // Fallback: Navigate to order page with payment instructions
        toast({
          title: "Payment Page Issue",
          description: "We've saved your order. Redirecting to order details...",
          variant: "default",
        });

        setTimeout(() => {
          navigate(`/orders/${order.id}`);
        }, 2000);
      }
    } catch (error: unknown) {
      console.error("Checkout error:", error);

      // Clear pending order on error
      localStorage.removeItem("pending_order_id");
      localStorage.removeItem("pending_order_expiry");

      const errorMessage = error instanceof Error ? error.message : "Failed to process checkout. Please try again.";

      toast({
        title: "Checkout Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Fulfillment Type */}
            <Card>
              <CardHeader>
                <CardTitle>Fulfillment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <FulfillmentSelector value={fulfillmentType} onChange={setFulfillmentType} />
              </CardContent>
            </Card>

            {/* Delivery Address (only for delivery) */}
            {fulfillmentType === "delivery" && (
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <AddressSelector selectedAddressId={selectedAddressId} onSelectAddress={setSelectedAddressId} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.menuItemId} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>R{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>R{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service Fee (4.5%)</span>
                    <span>R{serviceFee.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>R{total.toFixed(2)}</span>
                </div>

                {restaurant.minimum_order && subtotal < restaurant.minimum_order && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    Minimum order: R{restaurant.minimum_order.toFixed(2)}
                    <br />
                    Add R{(restaurant.minimum_order - subtotal).toFixed(2)} more
                  </div>
                )}

                <Button
                  onClick={handlePayment}
                  disabled={
                    loading || processingPayment || (restaurant.minimum_order && subtotal < restaurant.minimum_order)
                  }
                  className="w-full"
                  size="lg"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Proceed to Payment
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">Secure payment powered by PayFast</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
