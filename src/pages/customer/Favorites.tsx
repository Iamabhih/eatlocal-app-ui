import { Link } from "react-router-dom";
import { Heart, Loader2, Search, Star, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useState, useMemo } from "react";

const Favorites = () => {
  const { user } = useAuth();
  const { favorites, isLoading, toggleFavorite } = useFavorites();
  const { data: restaurants = [], isLoading: restaurantsLoading } = useRestaurants();
  const [searchQuery, setSearchQuery] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Get restaurant details for each favorite
  const favoriteRestaurants = useMemo(() => {
    return favorites
      .map(favId => restaurants.find(r => r.id === favId))
      .filter(Boolean);
  }, [favorites, restaurants]);

  const filteredFavorites = useMemo(() => {
    return favoriteRestaurants.filter((restaurant) =>
      restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [favoriteRestaurants, searchQuery]);

  const handleRemoveFavorite = async (restaurantId: string) => {
    setRemovingId(restaurantId);
    await toggleFavorite(restaurantId);
    setRemovingId(null);
  };

  if (!user) {
    return (
      <div className="bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign in to see your favorites</h2>
          <p className="text-muted-foreground mb-6">
            Save your favorite restaurants for quick access
          </p>
          <Link to="/auth?role=customer">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || restaurantsLoading) {
    return (
      <div className="bg-background">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Heart className="h-8 w-8 text-red-500 fill-red-500" />
              My Favorites
            </h1>
            <p className="text-muted-foreground mt-1">
              Your saved restaurants
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {favorites.length} Saved
          </Badge>
        </div>

        {/* Search */}
        {favorites.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Favorites Grid */}
        {filteredFavorites.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? "No matching favorites" : "No favorites yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Try a different search term"
                  : "Start exploring restaurants and save your favorites"}
              </p>
              <Link to="/restaurants">
                <Button>Browse Restaurants</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredFavorites.map((restaurant) => restaurant && (
              <Card
                key={restaurant.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <Link to={`/restaurant/${restaurant.id}`}>
                    <div className="aspect-video relative overflow-hidden">
                      {restaurant.image_url ? (
                        <img
                          src={restaurant.image_url}
                          alt={restaurant.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <span className="text-4xl font-bold text-primary/40">
                            {restaurant.name?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                      {/* Rating Badge */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 dark:bg-black/80">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold">
                          {restaurant.rating?.toFixed(1) || "New"}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Remove from favorites button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70"
                    onClick={() => handleRemoveFavorite(restaurant.id)}
                    disabled={removingId === restaurant.id}
                  >
                    <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                  </Button>
                </div>

                <CardContent className="p-4">
                  <Link to={`/restaurant/${restaurant.id}`}>
                    <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
                      {restaurant.name}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {restaurant.estimated_delivery_time || "25-35"} min
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      R{restaurant.delivery_fee?.toFixed(2) || "0.00"} delivery
                    </span>
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1">
                    {restaurant.cuisine_type && (
                      <Badge variant="secondary" className="text-xs">
                        {restaurant.cuisine_type}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
