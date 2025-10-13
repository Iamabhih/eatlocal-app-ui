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
import { useRestaurants } from "@/hooks/useRestaurants";

const RestaurantList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const { data: restaurantsData = [], isLoading } = useRestaurants();

  // Transform database restaurants to component format
  const restaurants = restaurantsData.map(r => ({
    id: r.id,
    name: r.name,
    image: r.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500",
    rating: r.rating,
    deliveryTime: `${r.estimated_delivery_time} min`,
    deliveryFee: `$${r.delivery_fee.toFixed(2)}`,
    categories: r.cuisine_type ? [r.cuisine_type] : [],
    promoted: false
  }));

  const categories = ["All", "Italian", "American", "Japanese", "Mexican", "Thai", "Fast Food"];

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
                    ? "bg-primary hover:bg-primary/90" 
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
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} {...restaurant} />
              ))}
            </div>
          )}

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