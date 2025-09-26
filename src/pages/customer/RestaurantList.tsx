import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/shared/Navbar";
import RestaurantCard from "@/components/shared/RestaurantCard";

const RestaurantList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const restaurants = [
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
    },
    {
      id: "5",
      name: "Taco Fiesta",
      image: "https://images.unsplash.com/photo-1565299585323-38174c4a6471?w=500&h=300&fit=crop",
      rating: 4.4,
      deliveryTime: "15-25 min",
      deliveryFee: "$1.99",
      categories: ["Mexican", "Tacos", "Spicy"]
    },
    {
      id: "6",
      name: "Pasta House",
      image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500&h=300&fit=crop",
      rating: 4.2,
      deliveryTime: "25-35 min",
      deliveryFee: "$2.49",
      categories: ["Italian", "Pasta", "Comfort Food"]
    }
  ];

  const categories = ["All", "Fast Food", "Asian", "Italian", "Mexican", "Healthy", "Pizza"];

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
      restaurant.categories.some(cat => cat.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar type="customer" />
      
      {/* Search and Filters */}
      <section className="py-8 px-4 border-b">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-6">Restaurants</h1>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search restaurants or dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.slice(1).map((category) => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="w-full md:w-auto">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Category Tags */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category.toLowerCase() ? "default" : "secondary"}
                className={`cursor-pointer transition-smooth ${
                  selectedCategory === category.toLowerCase() 
                    ? "bg-uber-green hover:bg-uber-green-hover" 
                    : "hover:bg-secondary"
                }`}
                onClick={() => setSelectedCategory(category.toLowerCase())}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Restaurant Results */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {filteredRestaurants.length} restaurants found
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} {...restaurant} />
            ))}
          </div>

          {filteredRestaurants.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold mb-2">No restaurants found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default RestaurantList;