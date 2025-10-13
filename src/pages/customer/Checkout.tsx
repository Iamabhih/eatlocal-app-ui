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

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, getSubtotal, getTax, getTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");

  useEffect(() => {
    if (!user) {
      navigate('/auth?role=customer&redirect=/checkout');
      return;
    }
    
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [user, items, navigate]);

  const deliveryFee = fulfillmentType === "delivery" ? 2.49 : 0; // No fee for pickup
  const subtotal = getSubtotal();
  const serviceFee = (subtotal + deliveryFee) * 0.045; // 4.5% settlement fee
  const total = subtotal + deliveryFee + serviceFee;

  // Generate 4-digit pickup code
  const generatePickupCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handlePayment = async () => {
    if (!user || items.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }

    // For delivery, address is required
    if (fulfillmentType === "delivery" && !selectedAddressId) {
      toast({
        title: "Missing Information",
        description: "Please select a delivery address",
        variant: "destructive",
      });
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
        .from('orders')
        .insert([{
          customer_id: user.id,
          restaurant_id: items[0].restaurantId,
          delivery_address_id: fulfillmentType === "delivery" ? selectedAddressId : null,
          order_number: orderNumber,
          fulfillment_type: fulfillmentType,
          pickup_code: pickupCode,
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          tax: 0,
          total: total,
          status: 'pending'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
        special_instructions: item.specialInstructions
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Generate PayFast payment form
      const paymentData = {
        merchant_id: import.meta.env.VITE_PAYFAST_MERCHANT_ID || '10000100',
        merchant_key: import.meta.env.VITE_PAYFAST_MERCHANT_KEY || '46f0cd694581a',
        return_url: `${window.location.origin}/orders/${order.id}`,
        cancel_url: `${window.location.origin}/checkout`,
        notify_url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payfast-webhook`,
        name_first: user.email?.split('@')[0] || 'Customer',
        email_address: user.email,
        m_payment_id: order.id,
        amount: total.toFixed(2),
        item_name: `Order from ${items[0].restaurantName}`,
        item_description: `${items.length} item(s)`,
      };

      // Create form and submit
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://www.payfast.co.za/eng/process'; // Production URL

      Object.entries(paymentData).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      
      // Clear cart before redirecting
      clearCart();
      
      // Submit form to PayFast
      form.submit();

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to process checkout. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  if (!user || items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar type="customer" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fulfillment Type Selector */}
            <FulfillmentSelector
              selected={fulfillmentType}
              onSelect={setFulfillmentType}
              restaurantName={items[0]?.restaurantName || "Restaurant"}
              restaurantAddress="123 Main St, City" // TODO: Get from restaurant data
            />

            {/* Delivery Address Selector - Only show for delivery */}
            {fulfillmentType === "delivery" && (
              <AddressSelector
                selectedAddressId={selectedAddressId}
                onSelectAddress={setSelectedAddressId}
              />
            )}

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>R{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Fee (4.5%)</span>
                    <span>R{serviceFee.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R{total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Service fee covers secure payment processing
                  </p>
                </div>

                <Button
                  className="w-full shadow-orange"
                  size="lg"
                  onClick={handlePayment}
                  disabled={loading || processingPayment || (fulfillmentType === "delivery" && !selectedAddressId)}
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting to PayFast...
                    </>
                  ) : (fulfillmentType === "delivery" && !selectedAddressId) ? (
                    'Select Address to Continue'
                  ) : (
                    'Pay with PayFast'
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  You will be redirected to PayFast to complete your payment securely
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
