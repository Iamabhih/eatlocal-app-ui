import { Search, MapPin, Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/shared/Navbar";
import RestaurantCard from "@/components/shared/RestaurantCard";
import heroImage from "@/assets/hero-delivery.jpg";

const CustomerHome = () => {
  // Mock data
  const featuredRestaurants = [
    {
      id: "1",
      name: "Burger Palace",
      image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&h=300&fit=crop",
      rating: 4.5,
      deliveryTime: "20-30 min",
      deliveryFee: "$2.49",
      categories: ["Burgers", "Fast Food", "American"],
      promoted: true
    },
    {
      id: "2", 
      name: "Sushi Express",
      image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&h=300&fit=crop",
      rating: 4.7,
      deliveryTime: "25-35 min", 
      deliveryFee: "$1.99",
      categories: ["Japanese", "Sushi", "Asian"]
    },
    {
      id: "3",
      name: "Pizza Corner",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500&h=300&fit=crop",
      rating: 4.3,
      deliveryTime: "15-25 min",
      deliveryFee: "$1.49", 
      categories: ["Pizza", "Italian", "Comfort Food"]
    },
    {
      id: "4",
      name: "Healthy Bowls",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=300&fit=crop",
      rating: 4.6,
      deliveryTime: "20-30 min",
      deliveryFee: "$2.99",
      categories: ["Healthy", "Salads", "Bowls"]
    }
  ];

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
    <div className="min-h-screen bg-background">
      <Navbar type="customer" />
      
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
            <Button className="bg-uber-green hover:bg-uber-green-hover">
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
                <span className="text-sm font-medium text-center group-hover:uber-green transition-smooth">
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
            {featuredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} {...restaurant} />
            ))}
          </div>
        </div>
      </section>

      {/* Portal Links */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Join UberEats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="group cursor-pointer hover:shadow-hover transition-all duration-300">
              <Link to="/restaurant-portal">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4">🏪</div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:uber-green transition-smooth">
                    Restaurant Partner
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Grow your business and reach new customers by partnering with UberEats
                  </p>
                  <Button className="bg-uber-green hover:bg-uber-green-hover">
                    Get Started
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="group cursor-pointer hover:shadow-hover transition-all duration-300">
              <Link to="/delivery-portal">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4">🏍️</div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:uber-green transition-smooth">
                    Delivery Partner
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Make money on your schedule. Deliver with UberEats whenever you want
                  </p>
                  <Button className="bg-uber-green hover:bg-uber-green-hover">
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