// Key improvements in this fixed version:
// 1. Removed hardcoded PayFast credentials fallbacks
// 2. Added order amount validation
// 3. Added minimum order validation
// 4. Better error handling with fallback
// 5. Retry mechanism for failed payments
// 6. Input validation before payment

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShoppingBag, CreditCard, AlertCircle, Clock, CalendarDays, Wallet, Check, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AddressSelector } from "@/components/customer/AddressSelector";
import { FulfillmentSelector } from "@/components/checkout/FulfillmentSelector";
import { ScheduledOrderSelector } from "@/components/checkout/ScheduledOrderSelector";
import { SavedPaymentMethods } from "@/components/checkout/SavedPaymentMethods";
import { TipSelector } from "@/components/checkout/TipSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useUserWallet, useWalletPayment, formatWalletAmount } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { isRestaurantOpen, isWithinDeliveryRadius, formatTime } from "@/lib/distanceUtils";
import { logger } from "@/lib/logger";

// Move to constants file in production
const PRICING = {
  DELIVERY_FEE: 2.49,
  SERVICE_FEE_RATE: 0.045, // 4.5%
} as const;

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, getSubtotal, getTax, getTotal, clearCart } = useCart();
  const { data: wallet } = useUserWallet();
  const walletPayment = useWalletPayment();
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [restaurant, setRestaurant] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [useWalletBalance, setUseWalletBalance] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);

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
      .select(`
        id,
        name,
        minimum_order,
        delivery_fee,
        is_open,
        opening_time,
        closing_time,
        delivery_radius_km,
        latitude,
        longitude,
        supports_pickup,
        supports_delivery
      `)
      .eq("id", items[0].restaurantId)
      .single();

    if (error) {
      logger.error("Error fetching restaurant:", error);
      toast({
        title: "Error",
        description: "Failed to load restaurant details",
        variant: "destructive",
      });
      return;
    }

    setRestaurant(data);
  };

  // Fetch selected address details when address changes
  useEffect(() => {
    if (selectedAddressId && fulfillmentType === "delivery") {
      fetchAddressDetails(selectedAddressId);
    }
  }, [selectedAddressId, fulfillmentType]);

  const fetchAddressDetails = async (addressId: string) => {
    const { data, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("id", addressId)
      .single();

    if (error) {
      logger.error("Error fetching address:", error);
      return;
    }

    setSelectedAddress(data);
  };

  const deliveryFee = fulfillmentType === "delivery" ? restaurant?.delivery_fee || PRICING.DELIVERY_FEE : 0;
  const subtotal = getSubtotal();
  const serviceFee = (subtotal + deliveryFee) * PRICING.SERVICE_FEE_RATE;
  const totalBeforeWalletAndTip = subtotal + deliveryFee + serviceFee;
  const totalBeforeWallet = totalBeforeWalletAndTip + tipAmount;

  // Calculate wallet contribution
  const walletBalance = wallet?.balance || 0;
  const walletAmountToUse = useWalletBalance ? Math.min(walletBalance, totalBeforeWallet) : 0;
  const total = totalBeforeWallet - walletAmountToUse;

  // Generate 4-digit pickup code
  const generatePickupCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Comprehensive validation function
  const validateOrder = () => {
    const errors: string[] = [];

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

    // Validate address completeness (delivery only)
    if (fulfillmentType === "delivery" && selectedAddress) {
      const { street_address, city, state, zip_code, latitude, longitude } = selectedAddress;

      if (!street_address || !city || !state || !zip_code) {
        errors.push("Delivery address is incomplete. Please update your address with all required fields.");
      }

      // Check if address has coordinates for distance calculation
      if (!latitude || !longitude) {
        errors.push("Address coordinates are missing. Please add a new address or update the existing one.");
      }
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

    // Check restaurant operating hours (skip for scheduled orders)
    if (!scheduledFor && restaurant && restaurant.opening_time && restaurant.closing_time) {
      if (!isRestaurantOpen(restaurant.opening_time, restaurant.closing_time)) {
        errors.push(
          `${restaurant.name} is currently closed. Operating hours: ${formatTime(
            restaurant.opening_time
          )} - ${formatTime(restaurant.closing_time)}. Consider scheduling your order for later.`
        );
      }
    }

    // Check if restaurant is marked as open (skip for scheduled orders)
    if (!scheduledFor && restaurant && !restaurant.is_open) {
      errors.push(`${restaurant.name} is temporarily closed. Consider scheduling your order for later.`);
    }

    // Validate delivery radius (delivery only)
    if (
      fulfillmentType === "delivery" &&
      restaurant &&
      selectedAddress &&
      restaurant.latitude &&
      restaurant.longitude &&
      selectedAddress.latitude &&
      selectedAddress.longitude
    ) {
      const radiusCheck = isWithinDeliveryRadius(
        restaurant.latitude,
        restaurant.longitude,
        selectedAddress.latitude,
        selectedAddress.longitude,
        restaurant.delivery_radius_km || 10
      );

      if (!radiusCheck.isWithinRadius) {
        errors.push(
          `Delivery address is ${radiusCheck.distance.toFixed(1)}km away. Maximum delivery radius is ${
            restaurant.delivery_radius_km || 10
          }km.`
        );
      }
    }

    // If there are validation errors, show them
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Failed",
        description: errors[0],
        variant: "destructive",
      });
      return false;
    }

    setValidationErrors([]);
    return true;
  };

  const handlePayment = async () => {
    // Validate before proceeding
    if (!validateOrder()) {
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
            customer_id: user!.id,
            restaurant_id: items[0].restaurantId,
            delivery_address_id: fulfillmentType === "delivery" ? selectedAddressId : null,
            order_number: orderNumber,
            fulfillment_type: fulfillmentType,
            pickup_code: pickupCode,
            subtotal: Number(subtotal.toFixed(2)),
            delivery_fee: Number(deliveryFee.toFixed(2)),
            tax: 0,
            tip: tipAmount > 0 ? Number(tipAmount.toFixed(2)) : null,
            total: Number(totalBeforeWallet.toFixed(2)),
            status: scheduledFor ? "scheduled" : "pending",
            scheduled_for: scheduledFor ? scheduledFor.toISOString() : null,
            wallet_amount_used: walletAmountToUse > 0 ? Number(walletAmountToUse.toFixed(2)) : null,
            payment_method_id: selectedPaymentMethodId,
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

      // Process wallet payment if applicable
      if (walletAmountToUse > 0) {
        await walletPayment.mutateAsync({
          amount: walletAmountToUse,
          description: `Payment for order ${orderNumber}`,
          referenceId: order.id,
          referenceType: 'order',
        });
      }

      // If wallet covers the full amount, complete the order immediately
      if (total <= 0) {
        // Update order status to confirmed (paid with wallet)
        await supabase
          .from("orders")
          .update({
            status: scheduledFor ? "scheduled" : "confirmed",
            payment_status: "paid",
            payment_method: "wallet",
          })
          .eq("id", order.id);

        clearCart();

        toast({
          title: "Order Placed Successfully!",
          description: `Your order has been paid with your wallet balance.`,
        });

        navigate(`/orders/${order.id}`);
        return;
      }

      // Otherwise, proceed to PayFast for remaining amount
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
        name_first: user!.email?.split("@")[0] || "Customer",
        email_address: user!.email || "",
        m_payment_id: order.id,
        amount: total.toFixed(2),
        item_name: `Order from ${items[0].restaurantName}`,
        item_description: walletAmountToUse > 0
          ? `${items.length} item(s) - Wallet: R${walletAmountToUse.toFixed(2)} applied`
          : `${items.length} item(s)`,
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
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Please resolve the following issues:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Restaurant Status Info */}
            {restaurant && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription className="flex items-center gap-2">
                  {restaurant.opening_time && restaurant.closing_time && (
                    <>
                      <span className="font-semibold">{restaurant.name}</span>
                      <span>•</span>
                      <span>
                        {isRestaurantOpen(restaurant.opening_time, restaurant.closing_time) ? (
                          <span className="text-green-600 font-medium">Open</span>
                        ) : (
                          <span className="text-red-600 font-medium">Closed</span>
                        )}
                      </span>
                      <span>•</span>
                      <span className="text-sm">
                        {formatTime(restaurant.opening_time)} - {formatTime(restaurant.closing_time)}
                      </span>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Fulfillment Type */}
            <Card>
              <CardHeader>
                <CardTitle>Fulfillment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <FulfillmentSelector 
                  selected={fulfillmentType} 
                  onSelect={setFulfillmentType}
                  restaurantName={restaurant.name}
                  restaurantAddress={`${restaurant.street_address}, ${restaurant.city}`}
                  supportsPickup={restaurant.supports_pickup}
                  supportsDelivery={restaurant.supports_delivery}
                />
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

            {/* Order Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Delivery Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScheduledOrderSelector
                  restaurantOpeningTime={restaurant?.opening_time}
                  restaurantClosingTime={restaurant?.closing_time}
                  onScheduleChange={setScheduledFor}
                />
              </CardContent>
            </Card>

            {/* Driver Tip (only for delivery) */}
            {fulfillmentType === "delivery" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Tip Your Driver
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TipSelector
                    subtotal={subtotal}
                    onTipChange={setTipAmount}
                    selectedTip={tipAmount}
                  />
                </CardContent>
              </Card>
            )}

            {/* Wallet Balance */}
            {walletBalance > 0 && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="h-5 w-5" />
                    Use Wallet Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="useWallet"
                        checked={useWalletBalance}
                        onCheckedChange={(checked) => setUseWalletBalance(checked === true)}
                      />
                      <Label htmlFor="useWallet" className="cursor-pointer">
                        <p className="font-medium">Apply {formatWalletAmount(Math.min(walletBalance, totalBeforeWallet))}</p>
                        <p className="text-sm text-muted-foreground">
                          Available: {formatWalletAmount(walletBalance)}
                        </p>
                      </Label>
                    </div>
                    {useWalletBalance && (
                      <div className="text-right">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {useWalletBalance && walletAmountToUse >= totalBeforeWallet && (
                    <p className="mt-2 text-sm text-green-600 font-medium">
                      Your wallet balance covers the entire order!
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Method (only if amount remaining) */}
            {total > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SavedPaymentMethods
                    selectedMethodId={selectedPaymentMethodId}
                    onSelectMethod={setSelectedPaymentMethodId}
                  />
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
                  {tipAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3 fill-current" />
                        Driver Tip
                      </span>
                      <span>R{tipAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {walletAmountToUse > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        Wallet Credit
                      </span>
                      <span>-R{walletAmountToUse.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>{total <= 0 ? 'Amount Due' : 'Total to Pay'}</span>
                  <span className={total <= 0 ? 'text-green-600' : ''}>
                    R{Math.max(0, total).toFixed(2)}
                  </span>
                </div>

                {scheduledFor && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <CalendarDays className="h-4 w-4" />
                      <span className="font-medium">Scheduled Delivery</span>
                    </div>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      {scheduledFor.toLocaleDateString('en-ZA', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })} at {scheduledFor.toLocaleTimeString('en-ZA', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </p>
                  </div>
                )}

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
                  ) : total <= 0 ? (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Pay with Wallet
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      {walletAmountToUse > 0 ? `Pay R${total.toFixed(2)}` : 'Proceed to Payment'}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {total <= 0 ? 'Pay using your wallet balance' : 'Secure payment powered by PayFast'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
