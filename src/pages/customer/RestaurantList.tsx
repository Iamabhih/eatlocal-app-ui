import { Search, SlidersHorizontal, Star, Clock, DollarSign, Heart, ArrowUpDown, Leaf, X } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Navbar from "@/components/shared/Navbar";
import RestaurantCard from "@/components/shared/RestaurantCard";
import { useRestaurantsWithMenu } from "@/hooks/useRestaurants";
import { useFavorites } from "@/hooks/useFavorites";

type SortOption = "rating" | "deliveryTime" | "deliveryFee" | "name";
type SortDirection = "asc" | "desc";

interface FilterState {
  priceRange: [number, number];
  dietary: string[];
  openNow: boolean;
  freeDelivery: boolean;
  minRating: number;
}

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian", icon: "🥗" },
  { id: "vegan", label: "Vegan", icon: "🌱" },
  { id: "halal", label: "Halal", icon: "☪️" },
  { id: "kosher", label: "Kosher", icon: "✡️" },
  { id: "gluten-free", label: "Gluten-Free", icon: "🌾" },
];

const CATEGORIES = [
  "All",
  "Italian",
  "American",
  "Japanese",
  "Mexican",
  "Thai",
  "Chinese",
  "Indian",
  "Fast Food",
  "Pizza",
  "Burgers",
  "Sushi",
  "Healthy",
  "Desserts",
  "Coffee",
];

const RestaurantList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 100],
    dietary: [],
    openNow: false,
    freeDelivery: false,
    minRating: 0,
  });

  const { data: restaurantsData = [], isLoading, menuItems = [] } = useRestaurantsWithMenu();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  // Transform database restaurants to component format
  const restaurants = useMemo(() =>
    restaurantsData.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      image: r.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500",
      rating: r.rating,
      totalReviews: r.total_reviews,
      deliveryTime: r.estimated_delivery_time,
      deliveryFee: r.delivery_fee,
      categories: r.cuisine_type ? [r.cuisine_type] : [],
      isOpen: r.is_open,
      minimumOrder: r.minimum_order,
      dietary: r.dietary_options || [],
      menuItems: menuItems.filter(m => m.restaurant_id === r.id),
    })),
    [restaurantsData, menuItems]
  );

  // Search in both restaurant names AND menu items
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return restaurants;

    const query = searchQuery.toLowerCase();
    return restaurants.filter(restaurant => {
      // Search in restaurant name
      const nameMatch = restaurant.name.toLowerCase().includes(query);

      // Search in restaurant description
      const descMatch = restaurant.description?.toLowerCase().includes(query);

      // Search in menu items
      const menuMatch = restaurant.menuItems?.some(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );

      return nameMatch || descMatch || menuMatch;
    });
  }, [restaurants, searchQuery]);

  // Apply filters
  const filteredRestaurants = useMemo(() => {
    return searchResults.filter(restaurant => {
      // Category filter
      const matchesCategory = selectedCategory === "all" ||
        restaurant.categories.some(cat => cat.toLowerCase() === selectedCategory.toLowerCase());

      // Price range filter (based on delivery fee)
      const matchesPrice = restaurant.deliveryFee >= filters.priceRange[0] &&
        restaurant.deliveryFee <= filters.priceRange[1];

      // Open now filter
      const matchesOpen = !filters.openNow || restaurant.isOpen;

      // Free delivery filter
      const matchesFreeDelivery = !filters.freeDelivery || restaurant.deliveryFee === 0;

      // Rating filter
      const matchesRating = restaurant.rating >= filters.minRating;

      // Dietary filter
      const matchesDietary = filters.dietary.length === 0 ||
        filters.dietary.some(d => restaurant.dietary?.includes(d));

      // Favorites filter
      const matchesFavorites = !showFavoritesOnly || isFavorite(restaurant.id);

      return matchesCategory && matchesPrice && matchesOpen &&
        matchesFreeDelivery && matchesRating && matchesDietary && matchesFavorites;
    });
  }, [searchResults, selectedCategory, filters, showFavoritesOnly, isFavorite]);

  // Sort restaurants
  const sortedRestaurants = useMemo(() => {
    const sorted = [...filteredRestaurants].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "rating":
          comparison = a.rating - b.rating;
          break;
        case "deliveryTime":
          comparison = a.deliveryTime - b.deliveryTime;
          break;
        case "deliveryFee":
          comparison = a.deliveryFee - b.deliveryFee;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [filteredRestaurants, sortBy, sortDirection]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.openNow) count++;
    if (filters.freeDelivery) count++;
    if (filters.minRating > 0) count++;
    if (filters.dietary.length > 0) count += filters.dietary.length;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100) count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 100],
      dietary: [],
      openNow: false,
      freeDelivery: false,
      minRating: 0,
    });
    setShowFavoritesOnly(false);
    setSelectedCategory("all");
  };

  const toggleDietary = (dietaryId: string) => {
    setFilters(prev => ({
      ...prev,
      dietary: prev.dietary.includes(dietaryId)
        ? prev.dietary.filter(d => d !== dietaryId)
        : [...prev.dietary, dietaryId],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar type="customer" />

      {/* Search and Filters */}
      <section className="py-8 px-4 border-b">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-6">Restaurants</h1>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Input - searches restaurants AND dishes */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search restaurants or dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search restaurants or dishes"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Category Dropdown */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48" aria-label="Select category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.slice(1).map((category) => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort by
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setSortBy("rating"); setSortDirection("desc"); }}>
                  <Star className="h-4 w-4 mr-2" /> Highest Rated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("rating"); setSortDirection("asc"); }}>
                  <Star className="h-4 w-4 mr-2" /> Lowest Rated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("deliveryTime"); setSortDirection("asc"); }}>
                  <Clock className="h-4 w-4 mr-2" /> Fastest Delivery
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("deliveryTime"); setSortDirection("desc"); }}>
                  <Clock className="h-4 w-4 mr-2" /> Slowest Delivery
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("deliveryFee"); setSortDirection("asc"); }}>
                  <DollarSign className="h-4 w-4 mr-2" /> Lowest Fee
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("deliveryFee"); setSortDirection("desc"); }}>
                  <DollarSign className="h-4 w-4 mr-2" /> Highest Fee
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("name"); setSortDirection("asc"); }}>
                  A-Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy("name"); setSortDirection("desc"); }}>
                  Z-A
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filters Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto relative">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filter Restaurants</SheetTitle>
                  <SheetDescription>
                    Narrow down your search with these filters
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-6">
                  {/* Quick Filters */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Quick Filters</h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="openNow"
                        checked={filters.openNow}
                        onCheckedChange={(checked) =>
                          setFilters(prev => ({ ...prev, openNow: checked === true }))
                        }
                      />
                      <label htmlFor="openNow" className="text-sm cursor-pointer">
                        Open Now
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="freeDelivery"
                        checked={filters.freeDelivery}
                        onCheckedChange={(checked) =>
                          setFilters(prev => ({ ...prev, freeDelivery: checked === true }))
                        }
                      />
                      <label htmlFor="freeDelivery" className="text-sm cursor-pointer">
                        Free Delivery
                      </label>
                    </div>
                  </div>

                  {/* Minimum Rating */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Minimum Rating</h4>
                    <div className="flex gap-2">
                      {[0, 3, 3.5, 4, 4.5].map((rating) => (
                        <Button
                          key={rating}
                          variant={filters.minRating === rating ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                        >
                          {rating === 0 ? "Any" : `${rating}+`}
                          {rating > 0 && <Star className="h-3 w-3 ml-1 fill-current" />}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Fee Range */}
                  <div className="space-y-4">
                    <h4 className="font-medium">
                      Delivery Fee: R{filters.priceRange[0]} - R{filters.priceRange[1]}
                    </h4>
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) =>
                        setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))
                      }
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {/* Dietary Options */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Leaf className="h-4 w-4" />
                      Dietary Options
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {DIETARY_OPTIONS.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={option.id}
                            checked={filters.dietary.includes(option.id)}
                            onCheckedChange={() => toggleDietary(option.id)}
                          />
                          <label htmlFor={option.id} className="text-sm cursor-pointer">
                            {option.icon} {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <SheetFooter className="gap-2">
                  <Button variant="outline" onClick={clearFilters} className="flex-1">
                    Clear All
                  </Button>
                  <SheetTrigger asChild>
                    <Button className="flex-1">Apply Filters</Button>
                  </SheetTrigger>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Favorites Toggle */}
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              className="w-full md:w-auto"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Heart className={`h-4 w-4 mr-2 ${showFavoritesOnly ? "fill-current" : ""}`} />
              Favorites
              {favorites.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {favorites.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Category Tags */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category.toLowerCase() ? "default" : "secondary"}
                className={`cursor-pointer transition-all ${
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

          {/* Active Filters Display */}
          {(activeFiltersCount > 0 || showFavoritesOnly || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchQuery}"
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                </Badge>
              )}
              {filters.openNow && (
                <Badge variant="secondary" className="gap-1">
                  Open Now
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters(p => ({ ...p, openNow: false }))} />
                </Badge>
              )}
              {filters.freeDelivery && (
                <Badge variant="secondary" className="gap-1">
                  Free Delivery
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters(p => ({ ...p, freeDelivery: false }))} />
                </Badge>
              )}
              {filters.minRating > 0 && (
                <Badge variant="secondary" className="gap-1">
                  {filters.minRating}+ Stars
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters(p => ({ ...p, minRating: 0 }))} />
                </Badge>
              )}
              {filters.dietary.map(d => (
                <Badge key={d} variant="secondary" className="gap-1">
                  {DIETARY_OPTIONS.find(o => o.id === d)?.label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => toggleDietary(d)} />
                </Badge>
              ))}
              {showFavoritesOnly && (
                <Badge variant="secondary" className="gap-1">
                  Favorites Only
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setShowFavoritesOnly(false)} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Restaurant Results */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {sortedRestaurants.length} restaurant{sortedRestaurants.length !== 1 ? "s" : ""} found
              {searchQuery && ` for "${searchQuery}"`}
            </p>
            <p className="text-sm text-muted-foreground">
              Sorted by: {sortBy === "rating" ? "Rating" : sortBy === "deliveryTime" ? "Delivery Time" : sortBy === "deliveryFee" ? "Delivery Fee" : "Name"}
              ({sortDirection === "asc" ? "↑" : "↓"})
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  id={restaurant.id}
                  name={restaurant.name}
                  image={restaurant.image}
                  rating={restaurant.rating}
                  deliveryTime={`${restaurant.deliveryTime} min`}
                  deliveryFee={`R${restaurant.deliveryFee.toFixed(2)}`}
                  categories={restaurant.categories}
                  isOpen={restaurant.isOpen}
                  isFavorite={isFavorite(restaurant.id)}
                  onFavoriteToggle={() => toggleFavorite(restaurant.id)}
                  matchedDish={
                    searchQuery && restaurant.menuItems?.find(m =>
                      m.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )?.name
                  }
                />
              ))}
            </div>
          )}

          {sortedRestaurants.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold mb-2">No restaurants found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? `No restaurants or dishes match "${searchQuery}"`
                  : "Try adjusting your filters to find what you're looking for."
                }
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default RestaurantList;
