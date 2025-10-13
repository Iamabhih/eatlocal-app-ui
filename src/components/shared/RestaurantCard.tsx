import { Star, Clock, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RestaurantCardProps {
  id: string;
  name: string;
  image: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: string;
  categories: string[];
  promoted?: boolean;
}

const RestaurantCard = ({
  id,
  name,
  image,
  rating,
  deliveryTime,
  deliveryFee,
  categories,
  promoted = false
}: RestaurantCardProps) => {
  return (
    <Link to={`/restaurant/${id}`}>
      <Card className="group cursor-pointer transition-all duration-300 hover:shadow-hover hover:-translate-y-1 bg-gradient-card">
        <div className="relative">
          <img 
            src={image} 
            alt={name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          {promoted && (
            <Badge className="absolute top-3 left-3 bg-primary hover:bg-primary/90">
              Promoted
            </Badge>
          )}
          <div className="absolute top-3 right-3 bg-black/80 text-white px-2 py-1 rounded-md text-sm flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            {rating}
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-smooth">
            {name}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {deliveryTime}
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {deliveryFee} delivery
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