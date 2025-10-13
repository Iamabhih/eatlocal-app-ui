import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Truck, Store, MapPin } from "lucide-react";

interface FulfillmentSelectorProps {
  selected: "delivery" | "pickup";
  onSelect: (type: "delivery" | "pickup") => void;
  restaurantName: string;
  restaurantAddress?: string;
  supportsPickup?: boolean;
  supportsDelivery?: boolean;
}

export const FulfillmentSelector = ({
  selected,
  onSelect,
  restaurantName,
  restaurantAddress,
  supportsPickup = true,
  supportsDelivery = true,
}: FulfillmentSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Fulfillment Method
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selected} onValueChange={(value) => onSelect(value as "delivery" | "pickup")}>
          {supportsDelivery && (
            <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selected === "delivery" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`} onClick={() => onSelect("delivery")}>
              <RadioGroupItem value="delivery" id="delivery" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="delivery" className="cursor-pointer">
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    <Truck className="h-4 w-4 text-primary" />
                    Delivery
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get your order delivered to your door
                  </p>
                  <p className="text-xs text-primary mt-1">
                    Estimated delivery: 30-45 min
                  </p>
                </Label>
              </div>
            </div>
          )}

          {supportsPickup && (
            <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selected === "pickup" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`} onClick={() => onSelect("pickup")}>
              <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="pickup" className="cursor-pointer">
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    <Store className="h-4 w-4 text-primary" />
                    Store Pickup
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Collect from {restaurantName}
                  </p>
                  {restaurantAddress && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1 mt-1">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {restaurantAddress}
                    </p>
                  )}
                  <p className="text-xs text-primary mt-1">
                    Ready in: 15-25 min • No delivery fee!
                  </p>
                </Label>
              </div>
            </div>
          )}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
