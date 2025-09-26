import { Star, Clock, DollarSign, Plus, Minus, Heart } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/shared/Navbar";

const RestaurantDetail = () => {
  const { id } = useParams();
  const [cartItems, setCartItems] = useState<{[key: string]: number}>({});

  // Mock restaurant data
  const restaurant = {
    id: "1",
    name: "Burger Palace",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=400&fit=crop",
    rating: 4.5,
    reviewCount: 1250,
    deliveryTime: "20-30 min",
    deliveryFee: "$2.49",
    minOrder: "$12.00",
    categories: ["Burgers", "Fast Food", "American"],
    description: "Gourmet burgers made with fresh, locally sourced ingredients. From classic cheeseburgers to creative specialty options.",
  };

  const menuCategories = [
    {
      name: "Popular",
      items: [
        {
          id: "1",
          name: "Classic Cheeseburger",
          description: "Angus beef patty with aged cheddar, lettuce, tomato, onion, and house sauce",
          price: 12.99,
          image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop"
        },
        {
          id: "2", 
          name: "BBQ Bacon Burger",
          description: "Double patty with crispy bacon, BBQ sauce, onion rings, and cheddar cheese",
          price: 16.99,
          image: "https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=300&h=200&fit=crop"
        }
      ]
    },
    {
      name: "Burgers",
      items: [
        {
          id: "3",
          name: "Mushroom Swiss Burger", 
          description: "Sautéed mushrooms, Swiss cheese, and garlic aioli on brioche bun",
          price: 14.99,
          image: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=300&h=200&fit=crop"
        },
        {
          id: "4",
          name: "Spicy Jalapeño Burger",
          description: "Pepper jack cheese, jalapeños, spicy mayo, and avocado",
          price: 15.99,
          image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=300&h=200&fit=crop"
        }
      ]
    },
    {
      name: "Sides",
      items: [
        {
          id: "5",
          name: "Truffle Fries",
          description: "Hand-cut fries with truffle oil and parmesan cheese",
          price: 8.99,
          image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&h=200&fit=crop"
        },
        {
          id: "6",
          name: "Onion Rings",
          description: "Beer-battered onion rings with spicy ranch dip",
          price: 6.99,
          image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=300&h=200&fit=crop"
        }
      ]
    }
  ];

  const addToCart = (itemId: string) => {
    setCartItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) - 1)
    }));
  };

  const getCartTotal = () => {
    return Object.entries(cartItems).reduce((total, [itemId, quantity]) => {
      const item = menuCategories.flatMap(cat => cat.items).find(item => item.id === itemId);
      return total + (item?.price || 0) * quantity;
    }, 0);
  };

  const getTotalItems = () => {
    return Object.values(cartItems).reduce((total, quantity) => total + quantity, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar type="customer" />
      
      {/* Restaurant Header */}
      <section className="relative">
        <img 
          src={restaurant.image} 
          alt={restaurant.name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="container mx-auto">
            <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
            <p className="text-lg opacity-90 mb-4">{restaurant.description}</p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-current" />
                {restaurant.rating} ({restaurant.reviewCount} reviews)
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {restaurant.deliveryTime}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {restaurant.deliveryFee} delivery fee
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Info */}
      <section className="py-6 px-4 border-b">
        <div className="container mx-auto">
          <div className="flex flex-wrap gap-2 mb-4">
            {restaurant.categories.map((category) => (
              <Badge key={category} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
          <p className="text-muted-foreground">
            Minimum order: {restaurant.minOrder} • Delivery fee: {restaurant.deliveryFee}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu */}
          <div className="lg:col-span-2">
            {menuCategories.map((category) => (
              <div key={category.name} className="mb-12">
                <h2 className="text-2xl font-bold mb-6">{category.name}</h2>
                <div className="space-y-6">
                  {category.items.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-card transition-smooth">
                      <CardContent className="p-0">
                        <div className="flex">
                          <div className="flex-1 p-6">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-lg">{item.name}</h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Heart className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                              {item.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold">${item.price}</span>
                              <div className="flex items-center gap-2">
                                {cartItems[item.id] > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                )}
                                {cartItems[item.id] > 0 && (
                                  <span className="font-medium w-8 text-center">
                                    {cartItems[item.id]}
                                  </span>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(item.id)}
                                  className="bg-uber-green hover:bg-uber-green-hover"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-32 h-32 object-cover"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">Your Order</h3>
                  
                  {getTotalItems() === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Your cart is empty
                    </p>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4">
                        {Object.entries(cartItems).map(([itemId, quantity]) => {
                          const item = menuCategories.flatMap(cat => cat.items).find(item => item.id === itemId);
                          if (!item || quantity === 0) return null;
                          
                          return (
                            <div key={itemId} className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-muted-foreground text-xs">${item.price}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFromCart(itemId)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-sm">{quantity}</span>
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(itemId)}
                                  className="bg-uber-green hover:bg-uber-green-hover"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>${getCartTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery fee</span>
                          <span>$2.49</span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-2 border-t">
                          <span>Total</span>
                          <span>${(getCartTotal() + 2.49).toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full mt-4 bg-uber-green hover:bg-uber-green-hover"
                        disabled={getCartTotal() < 12}
                      >
                        {getCartTotal() < 12 
                          ? `$${(12 - getCartTotal()).toFixed(2)} to minimum`
                          : 'Proceed to Checkout'
                        }
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;