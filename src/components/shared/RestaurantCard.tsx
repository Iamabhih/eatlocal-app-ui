import { Star, Clock, DollarSign, Heart, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
}: RestaurantCardProps) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.();
  };

  return (
    <Link to={`/restaurant/${id}`}>
      <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-hover hover:-translate-y-1 bg-gradient-card ${!isOpen ? 'opacity-75' : ''}`}>
        <div className="relative">
          <img
            src={image}
            alt={name}
            className="w-full h-48 object-cover rounded-t-lg"
            loading="lazy"
          />

          {/* Top left badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {promoted && (
              <Badge className="bg-primary hover:bg-primary/90">
                Promoted
              </Badge>
            )}
            {!isOpen && (
              <Badge variant="secondary" className="bg-gray-800 text-white">
                Closed
              </Badge>
            )}
          </div>

          {/* Rating badge - top right */}
          <div className="absolute top-3 right-12 bg-black/80 text-white px-2 py-1 rounded-md text-sm flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {rating.toFixed(1)}
          </div>

          {/* Favorite button - top right */}
          {onFavoriteToggle && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/90 hover:bg-white rounded-full shadow-sm"
              onClick={handleFavoriteClick}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isFavorite
                    ? "fill-red-500 text-red-500"
                    : "text-gray-600 hover:text-red-500"
                }`}
              />
            </Button>
          )}

          {/* Matched dish indicator */}
          {matchedDish && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="flex items-center gap-2 text-white text-sm">
                <Search className="h-3 w-3" />
                <span className="truncate">Found: {matchedDish}</span>
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-smooth truncate">
            {name}
          </h3>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{deliveryTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{deliveryFee} delivery</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 3).map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {category}
              </Badge>
            ))}
            {categories.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{categories.length - 3} more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default RestaurantCard;
