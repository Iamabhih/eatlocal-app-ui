import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FeeCalculatorProps {
  type: "restaurant" | "delivery";
}

export const FeeCalculator = ({ type }: FeeCalculatorProps) => {
  const [amount, setAmount] = useState<string>("100");

  const numAmount = parseFloat(amount) || 0;
  const platformFee = numAmount * 0.15;
  const settlementFee = numAmount * 0.045;
  const yourEarnings = numAmount - platformFee - settlementFee;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Earnings Calculator</CardTitle>
        <CardDescription>
          {type === "restaurant" 
            ? "See how much you'll earn per order"
            : "Calculate your net earnings per delivery"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="amount">
            {type === "restaurant" ? "Order Subtotal (R)" : "Delivery Fee (R)"}
          </Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <div className="space-y-3 bg-muted/50 rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {type === "restaurant" ? "Order Amount" : "Delivery Fee"}
            </span>
            <span className="font-medium">R {numAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform Fee (15%)</span>
            <span className="font-medium text-destructive">- R {platformFee.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Settlement Fee (4.5%)</span>
            <span className="font-medium text-destructive">- R {settlementFee.toFixed(2)}</span>
          </div>

          <div className="border-t pt-3 flex justify-between font-bold">
            <span>Your Earnings</span>
            <span className="text-primary text-lg">R {yourEarnings.toFixed(2)}</span>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            You keep <span className="font-semibold text-primary">80.5%</span> of every{" "}
            {type === "restaurant" ? "order" : "delivery"}
            {type === "delivery" && " + 100% of all tips"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
