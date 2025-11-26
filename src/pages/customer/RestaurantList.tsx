import { Search, SlidersHorizontal, Star, Clock, DollarSign, Heart, ArrowUpDown, Leaf, X, Sparkles, TrendingUp } from "lucide-react";
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

      {/* Hero Section */}
      <section className="relative py-12 px-4 bg-gradient-mesh overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="decorative-blob w-[400px] h-[400px] -top-32 -left-32 bg-primary/10" />
          <div className="decorative-blob w-[300px] h-[300px] -bottom-16 -right-16 bg-accent/10" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-2xl animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Discover delicious food near you</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Explore <span className="text-gradient-primary">Restaurants</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Find your favorite cuisines from top-rated local restaurants
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="sticky top-16 z-40 py-4 px-4 glass-subtle border-b border-border/50">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
              <Input
                placeholder="Search restaurants or dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-10"
                variant="premium"
                aria-label="Search restaurants or dishes"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Category Dropdown */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-44 rounded-xl" aria-label="Select category">
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
                  <Button variant="secondary" className="rounded-xl">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => { setSortBy("rating"); setSortDirection("desc"); }}>
                    <Star className="h-4 w-4 mr-2 text-yellow-500" /> Highest Rated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy("deliveryTime"); setSortDirection("asc"); }}>
                    <Clock className="h-4 w-4 mr-2 text-primary" /> Fastest Delivery
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy("deliveryFee"); setSortDirection("asc"); }}>
                    <DollarSign className="h-4 w-4 mr-2 text-emerald-500" /> Lowest Fee
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy("name"); setSortDirection("asc"); }}>
                    A-Z
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Filters Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="secondary" className="rounded-xl relative">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="font-display">Filter Restaurants</SheetTitle>
                    <SheetDescription>
                      Narrow down your search with these filters
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-6 py-6">
                    {/* Quick Filters */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">Quick Filters</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                          <Checkbox
                            id="openNow"
                            checked={filters.openNow}
                            onCheckedChange={(checked) =>
                              setFilters(prev => ({ ...prev, openNow: checked === true }))
                            }
                          />
                          <label htmlFor="openNow" className="text-sm cursor-pointer flex-1">
                            Open Now
                          </label>
                          <Badge variant="success" size="sm">Live</Badge>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                          <Checkbox
                            id="freeDelivery"
                            checked={filters.freeDelivery}
                            onCheckedChange={(checked) =>
                              setFilters(prev => ({ ...prev, freeDelivery: checked === true }))
                            }
                          />
                          <label htmlFor="freeDelivery" className="text-sm cursor-pointer flex-1">
                            Free Delivery
                          </label>
                          <Badge variant="accent" size="sm">Save</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Minimum Rating */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">Minimum Rating</h4>
                      <div className="flex gap-2 flex-wrap">
                        {[0, 3, 3.5, 4, 4.5].map((rating) => (
                          <Button
                            key={rating}
                            variant={filters.minRating === rating ? "default" : "secondary"}
                            size="sm"
                            className="rounded-lg"
                            onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                          >
                            {rating === 0 ? "Any" : `${rating}+`}
                            {rating > 0 && <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Fee Range */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Delivery Fee</h4>
                        <span className="text-sm text-muted-foreground">
                          R{filters.priceRange[0]} - R{filters.priceRange[1]}
                        </span>
                      </div>
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
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-primary" />
                        Dietary Options
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {DIETARY_OPTIONS.map((option) => (
                          <div
                            key={option.id}
                            onClick={() => toggleDietary(option.id)}
                            className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                              filters.dietary.includes(option.id)
                                ? "bg-primary/10 border-primary/30 border"
                                : "bg-secondary/50 hover:bg-secondary border border-transparent"
                            }`}
                          >
                            <span className="text-lg">{option.icon}</span>
                            <span className="text-sm">{option.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <SheetFooter className="gap-2">
                    <Button variant="outline" onClick={clearFilters} className="flex-1 rounded-xl">
                      Clear All
                    </Button>
                    <SheetTrigger asChild>
                      <Button className="flex-1 rounded-xl">Apply Filters</Button>
                    </SheetTrigger>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              {/* Favorites Toggle */}
              <Button
                variant={showFavoritesOnly ? "default" : "secondary"}
                className="rounded-xl"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Heart className={`h-4 w-4 mr-2 ${showFavoritesOnly ? "fill-current" : ""}`} />
                Favorites
                {favorites.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-background/20">
                    {favorites.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mt-4 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category.toLowerCase() ? "default" : "secondary"}
                className={`cursor-pointer whitespace-nowrap px-4 py-1.5 transition-all hover:scale-105 ${
                  selectedCategory === category.toLowerCase()
                    ? "shadow-button"
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
            <div className="flex flex-wrap items-center gap-2 mt-3 animate-fade-in">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="outline" className="gap-1 rounded-lg">
                  "{searchQuery}"
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setSearchQuery("")} />
                </Badge>
              )}
              {filters.openNow && (
                <Badge variant="outline" className="gap-1 rounded-lg">
                  Open Now
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setFilters(p => ({ ...p, openNow: false }))} />
                </Badge>
              )}
              {filters.freeDelivery && (
                <Badge variant="outline" className="gap-1 rounded-lg">
                  Free Delivery
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setFilters(p => ({ ...p, freeDelivery: false }))} />
                </Badge>
              )}
              {filters.minRating > 0 && (
                <Badge variant="outline" className="gap-1 rounded-lg">
                  {filters.minRating}+ Stars
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setFilters(p => ({ ...p, minRating: 0 }))} />
                </Badge>
              )}
              {filters.dietary.map(d => (
                <Badge key={d} variant="outline" className="gap-1 rounded-lg">
                  {DIETARY_OPTIONS.find(o => o.id === d)?.label}
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => toggleDietary(d)} />
                </Badge>
              ))}
              {showFavoritesOnly && (
                <Badge variant="outline" className="gap-1 rounded-lg">
                  Favorites Only
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setShowFavoritesOnly(false)} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7">
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
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{sortedRestaurants.length}</span> restaurant{sortedRestaurants.length !== 1 ? "s" : ""} found
              {searchQuery && <span className="text-primary"> for "{searchQuery}"</span>}
            </p>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Sorted by {sortBy === "rating" ? "Rating" : sortBy === "deliveryTime" ? "Delivery Time" : sortBy === "deliveryFee" ? "Delivery Fee" : "Name"}
              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3 animate-pulse">
                  <Skeleton className="aspect-[16/10] w-full rounded-xl" />
                  <Skeleton className="h-5 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 rounded-lg" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedRestaurants.map((restaurant, index) => (
                <div
                  key={restaurant.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <RestaurantCard
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
                    trending={index < 3}
                    matchedDish={
                      searchQuery && restaurant.menuItems?.find(m =>
                        m.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )?.name
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {sortedRestaurants.length === 0 && !isLoading && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-2">No restaurants found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery
                  ? `No restaurants or dishes match "${searchQuery}"`
                  : "Try adjusting your filters to find what you're looking for."
                }
              </p>
              <Button onClick={clearFilters} variant="outline" className="rounded-xl">
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
