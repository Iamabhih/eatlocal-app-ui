import { Trash2, Plus, Minus, MapPin, Clock, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useState, useEffect } from "react";

const Cart = () => {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    getCartTotal,
    getTotalItems,
    getServiceFee,
    checkExpiry,
  } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check cart expiry on mount
  useEffect(() => {
    checkExpiry();
  }, [checkExpiry]);

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === "save10") {
      setAppliedPromo("SAVE10");
      setPromoCode("");
    }
  };

  const subtotal = getCartTotal();
  const deliveryFee = 2.49;
  const serviceFee = getServiceFee();
  const discount = appliedPromo === "SAVE10" ? subtotal * 0.1 : 0;
  const total = subtotal + deliveryFee + serviceFee - discount;
  const totalItems = getTotalItems();

  const estimatedDelivery = "20-30 min";

  if (items.length === 0) {
    return (
      <div className="bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="text-8xl mb-6">🛒</div>
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Add some delicious items from our restaurants to get started!
            </p>
            <Link to="/restaurants">
              <Button className="bg-primary hover:bg-primary/90">
                Browse Restaurants
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Your Cart</h1>
              <Badge variant="secondary" className="text-sm">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </Badge>
            </div>

            {/* Restaurant Name */}
            <Card className="mb-6 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{items[0].restaurantName}</p>
                    <p className="text-sm text-muted-foreground">
                      Estimated delivery: {estimatedDelivery}
                    </p>
                  </div>
                  <Clock className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card className="mb-6 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Deliver to</p>
                    <p className="text-sm text-muted-foreground">
                      Please sign in to select a delivery address
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/auth?role=customer')}>
                    Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.menuItemId} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.restaurantName}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.menuItemId, 0)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(item.menuItemId)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              onClick={() => addItem({
                                menuItemId: item.menuItemId,
                                name: item.name,
                                price: item.price,
                                image_url: item.image_url,
                                restaurantId: item.restaurantId,
                                restaurantName: item.restaurantName,
                              })}
                              className="bg-primary hover:bg-primary/90"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <span className="font-bold">R{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Promo Code */}
            <Card className="mt-6 shadow-card">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Promo Code</h3>
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <span className="text-primary font-medium">{appliedPromo} applied!</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setAppliedPromo(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code (try SAVE10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <Button 
                      variant="outline"
                      onClick={applyPromoCode}
                      disabled={!promoCode.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal ({totalItems} items)</span>
                      <span>R{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery fee</span>
                      <span>R{deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service fee</span>
                      <span>R{serviceFee.toFixed(2)}</span>
                    </div>
                    {appliedPromo && discount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>Discount ({appliedPromo})</span>
                        <span>-R{discount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between font-bold text-lg mb-6">
                    <span>Total</span>
                    <span>R{total.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-6 p-3 bg-muted rounded-lg">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      Estimated delivery: <span className="font-medium">{estimatedDelivery}</span>
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                    onClick={() => navigate('/checkout')}
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Secure payment with PayFast
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
