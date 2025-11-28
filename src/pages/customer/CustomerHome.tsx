import { Search, MapPin, Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RestaurantCard from "@/components/shared/RestaurantCard";
import heroImage from "@/assets/hero-delivery.jpg";
import { useRestaurants } from "@/hooks/useRestaurants";

const CustomerHome = () => {
  const { data: restaurants = [], isLoading } = useRestaurants();
  const featuredRestaurants = restaurants.slice(0, 4).map(r => ({
    id: r.id,
    name: r.name,
    image: r.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500",
    rating: r.rating,
    deliveryTime: `${r.estimated_delivery_time} min`,
    deliveryFee: `$${r.delivery_fee.toFixed(2)}`,
    categories: r.cuisine_type ? [r.cuisine_type] : [],
    promoted: false
  }));

  const categories = [
    { name: "Fast Food", icon: "🍔" },
    { name: "Pizza", icon: "🍕" },
    { name: "Asian", icon: "🍜" },
    { name: "Mexican", icon: "🌮" },
    { name: "Italian", icon: "🍝" },
    { name: "Desserts", icon: "🍰" },
    { name: "Healthy", icon: "🥗" },
    { name: "Coffee", icon: "☕" }
  ];

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-hero flex items-center justify-center text-white overflow-hidden">
        <img 
          src={heroImage} 
          alt="Food delivery" 
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10 text-center max-w-2xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Order food to your door</h1>
          <p className="text-xl mb-8 opacity-90">Get your favorite meals delivered fast from local restaurants</p>
          
          <div className="flex items-center gap-4 bg-white rounded-lg p-2 text-black max-w-md mx-auto">
            <MapPin className="h-5 w-5 text-muted-foreground ml-2" />
            <Input 
              placeholder="Enter delivery address" 
              className="border-0 text-lg"
            />
            <Button className="bg-primary hover:bg-primary/90">
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8">What are you craving?</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-6">
            {categories.map((category) => (
              <Link 
                key={category.name}
                to="/restaurants"
                className="flex flex-col items-center p-4 rounded-lg hover:bg-muted transition-smooth cursor-pointer group"
              >
                <div className="text-4xl mb-2 group-hover:scale-110 transition-bounce">
                  {category.icon}
                </div>
                <span className="text-sm font-medium text-center group-hover:text-primary transition-smooth">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured restaurants</h2>
            <Link to="/restaurants">
              <Button variant="outline">View all</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <p className="col-span-full text-center text-muted-foreground">Loading restaurants...</p>
            ) : featuredRestaurants.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground">
                No restaurants available. Sign up as a restaurant to add your business!
              </p>
            ) : (
              featuredRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} {...restaurant} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Portal Links */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Join Smash Local</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="group cursor-pointer hover:shadow-hover transition-all duration-300">
              <Link to="/restaurant/dashboard">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4">🏪</div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-smooth">
                    Restaurant Partner
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Grow your business and reach new customers by partnering with Smash Local
                  </p>
                  <Button className="bg-primary hover:bg-primary/90">
                    Get Started
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="group cursor-pointer hover:shadow-hover transition-all duration-300">
              <Link to="/delivery/dashboard">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4">🏍️</div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-smooth">
                    Delivery Partner
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Make money on your schedule. Deliver with Smash Local whenever you want
                  </p>
                  <Button className="bg-primary hover:bg-primary/90">
                    Start Earning
                  </Button>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomerHome;