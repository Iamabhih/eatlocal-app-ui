import { Star, Clock, MapPin, Heart, Search, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RestaurantCardProps {
  id: string;
  name: string;
  image: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: string;
  categories: string[];
  promoted?: boolean;
  isOpen?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  matchedDish?: string;
  trending?: boolean;
}

const RestaurantCard = ({
  id,
  name,
  image,
  rating,
  deliveryTime,
  deliveryFee,
  categories,
  promoted = false,
  isOpen = true,
  isFavorite = false,
  onFavoriteToggle,
  matchedDish,
  trending = false,
}: RestaurantCardProps) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.();
  };

  return (
    <Link to={`/restaurant/${id}`} className="block group">
      <Card
        variant="interactive"
        className={cn(
          "overflow-hidden",
          !isOpen && "opacity-75"
        )}
      >
        {/* Image Container */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {/* Image with gradient overlay */}
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />

          {/* Gradient overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Top row badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            <div className="flex flex-col gap-2">
              {promoted && (
                <Badge className="bg-gradient-primary text-white border-0 shadow-md gap-1">
                  <Sparkles className="h-3 w-3" />
                  Featured
                </Badge>
              )}
              {trending && (
                <Badge className="bg-gradient-accent text-white border-0 shadow-md gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Trending
                </Badge>
              )}
              {!isOpen && (
                <Badge variant="secondary" className="bg-foreground/90 text-background shadow-md">
                  Closed
                </Badge>
              )}
            </div>

            {/* Favorite button */}
            {onFavoriteToggle && (
              <Button
                variant="secondary"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-full shadow-lg transition-all duration-300",
                  "bg-white/90 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70",
                  isFavorite && "bg-red-50 hover:bg-red-100"
                )}
                onClick={handleFavoriteClick}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-all duration-300",
                    isFavorite
                      ? "fill-red-500 text-red-500 scale-110"
                      : "text-muted-foreground group-hover:text-red-400"
                  )}
                />
              </Button>
            )}
          </div>

          {/* Rating badge - bottom right */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/95 dark:bg-black/80 shadow-lg backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
          </div>

          {/* Matched dish indicator */}
          {matchedDish && (
            <div className="absolute bottom-3 left-3 right-14 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/95 text-white shadow-lg backdrop-blur-sm">
              <Search className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-sm font-medium truncate">{matchedDish}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Name */}
          <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1">
            {name}
          </h3>

          {/* Delivery Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="font-medium">{deliveryTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
                <MapPin className="h-3.5 w-3.5 text-accent" />
              </div>
              <span className="font-medium">{deliveryFee}</span>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 3).map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="text-xs font-medium bg-secondary/50 hover:bg-secondary"
              >
                {category}
              </Badge>
            ))}
            {categories.length > 3 && (
              <Badge
                variant="secondary"
                className="text-xs font-medium bg-secondary/50"
              >
                +{categories.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default RestaurantCard;
