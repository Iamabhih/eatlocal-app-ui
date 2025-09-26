import { Trash2, Plus, Minus, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/shared/Navbar";

const Cart = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: "1",
      restaurantId: "1",
      restaurantName: "Burger Palace",
      name: "Classic Cheeseburger",
      price: 12.99,
      quantity: 2,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=150&fit=crop",
      customizations: ["No onions", "Extra cheese"]
    },
    {
      id: "2",
      restaurantId: "1", 
      restaurantName: "Burger Palace",
      name: "Truffle Fries",
      price: 8.99,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=200&h=150&fit=crop",
      customizations: []
    }
  ]);

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setCartItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const applyPromoCode = () => {
    // Mock promo code validation
    if (promoCode.toLowerCase() === "save10") {
      setAppliedPromo("SAVE10");
      setPromoCode("");
    }
  };

  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = 2.49;
  const serviceFee = 1.99;
  const discount = appliedPromo === "SAVE10" ? subtotal * 0.1 : 0;
  const total = subtotal + deliveryFee + serviceFee - discount;

  const estimatedDelivery = "20-30 min";

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar type="customer" />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="text-8xl mb-6">🛒</div>
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Add some delicious items from our restaurants to get started!
            </p>
            <Link to="/restaurants">
              <Button className="bg-uber-green hover:bg-uber-green-hover">
                Browse Restaurants
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar type="customer" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Your Cart</h1>
              <Badge variant="secondary" className="text-sm">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>

            {/* Delivery Address */}
            <Card className="mb-6 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 uber-green" />
                  <div className="flex-1">
                    <p className="font-medium">Deliver to</p>
                    <p className="text-sm text-muted-foreground">123 Main Street, Apt 4B</p>
                  </div>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
              </CardContent>
            </Card>

            {/* Cart Items */}
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.restaurantName}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {item.customizations.length > 0 && (
                          <div className="mb-3">
                            {item.customizations.map((customization, index) => (
                              <Badge key={index} variant="outline" className="text-xs mr-1">
                                {customization}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="bg-uber-green hover:bg-uber-green-hover"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
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
                  <div className="flex items-center justify-between p-3 bg-uber-green-light rounded-lg">
                    <span className="uber-green font-medium">{appliedPromo} applied!</span>
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
                      placeholder="Enter promo code"
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
                      <span>Subtotal ({cartItems.reduce((total, item) => total + item.quantity, 0)} items)</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery fee</span>
                      <span>${deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service fee</span>
                      <span>${serviceFee.toFixed(2)}</span>
                    </div>
                    {appliedPromo && discount > 0 && (
                      <div className="flex justify-between uber-green">
                        <span>Discount ({appliedPromo})</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between font-bold text-lg mb-6">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-6 p-3 bg-muted rounded-lg">
                    <Clock className="h-4 w-4 uber-green" />
                    <span className="text-sm">
                      Estimated delivery: <span className="font-medium">{estimatedDelivery}</span>
                    </span>
                  </div>
                  
                  <Button className="w-full bg-uber-green hover:bg-uber-green-hover text-lg py-6">
                    Proceed to Checkout
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    By placing your order, you agree to our Terms & Conditions
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