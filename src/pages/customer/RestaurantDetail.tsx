import { Star, Clock, DollarSign, Plus, Minus, ShoppingCart } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRestaurant } from "@/hooks/useRestaurants";
import { useRestaurantMenu } from "@/hooks/useMenuItems";
import { useCart } from "@/hooks/useCart";
import { ReviewsSection } from "@/components/customer/ReviewsSection";

const RestaurantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant(id!);
  const { data: menu = [], isLoading: menuLoading } = useRestaurantMenu(id!);
  const { addItem, removeItem, getItemQuantity, getCartTotal, getTotalItems } = useCart();

  if (restaurantLoading || menuLoading) {
    return (
      <div className="bg-background">
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-muted-foreground">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="bg-background">
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-muted-foreground">Restaurant not found</p>
        </div>
      </div>
    );
  }

  const handleAddToCart = (menuItem: any) => {
    addItem({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: Number(menuItem.price),
      image_url: menuItem.image_url,
    });
  };

  const handleRemoveFromCart = (menuItemId: string) => {
    removeItem(menuItemId);
  };

  const cartTotal = getCartTotal();
  const totalItems = getTotalItems();
  const deliveryFee = Number(restaurant.delivery_fee);
  const minimumOrder = Number(restaurant.minimum_order);

  return (
    <div className="bg-background">
      {/* Restaurant Header */}
      <section className="relative">
        <img 
          src={restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
          alt={restaurant.name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="container mx-auto">
            <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
            <p className="text-lg opacity-90 mb-4">{restaurant.description || ''}</p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-current" />
                {restaurant.rating} ({restaurant.total_reviews} reviews)
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {restaurant.estimated_delivery_time} min
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                ${restaurant.delivery_fee} delivery fee
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Info */}
      <section className="py-6 px-4 border-b">
        <div className="container mx-auto">
          <div className="flex flex-wrap gap-2 mb-4">
            {restaurant.cuisine_type && (
              <Badge variant="secondary">{restaurant.cuisine_type}</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Minimum order: ${restaurant.minimum_order} • Delivery fee: ${restaurant.delivery_fee}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu */}
          <div className="lg:col-span-2">
            {menu.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No menu items available</p>
              </div>
            ) : (
              menu.map((category) => (
                <div key={category.id} className="mb-12">
                  <h2 className="text-2xl font-bold mb-6">{category.name}</h2>
                  {category.description && (
                    <p className="text-muted-foreground mb-4">{category.description}</p>
                  )}
                  <div className="space-y-6">
                    {category.items.map((item) => {
                      const quantity = getItemQuantity(item.id);
                      return (
                        <Card key={item.id} className="overflow-hidden hover:shadow-card transition-smooth">
                          <CardContent className="p-0">
                            <div className="flex">
                              <div className="flex-1 p-6">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h3 className="font-semibold text-lg">{item.name}</h3>
                                    <div className="flex gap-2 mt-1">
                                      {item.is_vegetarian && <Badge variant="outline" className="text-xs">Vegetarian</Badge>}
                                      {item.is_vegan && <Badge variant="outline" className="text-xs">Vegan</Badge>}
                                      {item.is_gluten_free && <Badge variant="outline" className="text-xs">Gluten-Free</Badge>}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                  {item.description}
                                </p>
                                {item.calories && (
                                  <p className="text-xs text-muted-foreground mb-2">{item.calories} cal</p>
                                )}
                                <div className="flex items-center justify-between">
                                  <span className="text-lg font-bold">${Number(item.price).toFixed(2)}</span>
                                  <div className="flex items-center gap-2">
                                    {quantity > 0 && (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleRemoveFromCart(item.id)}
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="font-medium w-8 text-center">
                                          {quantity}
                                        </span>
                                      </>
                                    )}
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddToCart(item)}
                                      className="bg-primary hover:bg-primary/90"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-32 h-32 object-cover"
                                />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Your Order
                  </h3>

                  {totalItems === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Your cart is empty
                    </p>
                  ) : (
                    <>
                      <Separator className="my-4" />

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal ({totalItems} items)</span>
                          <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery fee</span>
                          <span>${deliveryFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-2 border-t">
                          <span>Total</span>
                          <span>${(cartTotal + deliveryFee).toFixed(2)}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full mt-4 bg-primary hover:bg-primary/90"
                        disabled={cartTotal < minimumOrder}
                        onClick={() => navigate('/cart')}
                      >
                        {cartTotal < minimumOrder
                          ? `$${(minimumOrder - cartTotal).toFixed(2)} to minimum`
                          : 'View Cart'
                        }
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <ReviewsSection
          restaurantId={restaurant.id}
          restaurantRating={Number(restaurant.rating) || 0}
          totalReviews={restaurant.total_reviews || 0}
        />
      </div>
    </div>
  );
};

export default RestaurantDetail;
