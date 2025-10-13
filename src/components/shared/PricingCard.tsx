import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface FeeItem {
  label: string;
  value: string;
  description?: string;
}

interface PricingCardProps {
  title: string;
  description: string;
  fees: FeeItem[];
  example?: {
    title: string;
    calculation: { label: string; value: string }[];
    result: { label: string; value: string };
  };
}

export const PricingCard = ({ title, description, fees, example }: PricingCardProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fee List */}
        <div className="space-y-3">
          {fees.map((fee, index) => (
            <div key={index} className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{fee.label}</span>
                  <span className="text-lg font-bold text-primary">{fee.value}</span>
                </div>
                {fee.description && (
                  <p className="text-sm text-muted-foreground mt-1">{fee.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Example Calculation */}
        {example && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm">{example.title}</h4>
            <div className="space-y-2">
              {example.calculation.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                <span>{example.result.label}</span>
                <span className="text-primary">{example.result.value}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
