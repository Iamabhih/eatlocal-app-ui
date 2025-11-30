import { useState } from 'react';
import { AlertCircle, Loader2, HelpCircle, Wallet, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateRefundRequest,
  REFUND_REASONS,
  RefundReason,
  isOrderEligibleForRefund,
} from '@/hooks/useRefunds';

interface RefundRequestFormProps {
  order: {
    id: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
    restaurant?: { name: string };
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RefundRequestForm({ order, onSuccess, onCancel }: RefundRequestFormProps) {
  const [reason, setReason] = useState<RefundReason | ''>('');
  const [description, setDescription] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState<'wallet' | 'original_payment'>('wallet');

  const createRefund = useCreateRefundRequest();

  const eligibility = isOrderEligibleForRefund(order);
  const requestedAmount = refundType === 'full' ? order.total : parseFloat(partialAmount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) return;

    await createRefund.mutateAsync({
      orderId: order.id,
      reason: reason as RefundReason,
      description,
      amountRequested: requestedAmount,
      refundMethod,
    });

    onSuccess?.();
  };

  if (!eligibility.eligible) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Refund Not Available</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{eligibility.reason}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={onCancel} className="w-full">
            Go Back
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request a Refund</CardTitle>
        <CardDescription>
          Order #{order.order_number} from {order.restaurant?.name}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Why are you requesting a refund?</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as RefundReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REFUND_REASONS).map(([key, { label, description }]) => (
                  <SelectItem key={key} value={key}>
                    <div>
                      <span className="font-medium">{label}</span>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Please describe the issue</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about what went wrong..."
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              The more details you provide, the faster we can process your request.
            </p>
          </div>

          {/* Refund Amount */}
          <div className="space-y-3">
            <Label>Refund Amount</Label>
            <RadioGroup value={refundType} onValueChange={(v) => setRefundType(v as 'full' | 'partial')}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="flex-1 cursor-pointer">
                  <span className="font-medium">Full Refund</span>
                  <span className="text-muted-foreground ml-2">R{order.total.toFixed(2)}</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial" className="cursor-pointer">
                  <span className="font-medium">Partial Refund</span>
                </Label>
              </div>
            </RadioGroup>

            {refundType === 'partial' && (
              <div className="ml-6">
                <Label htmlFor="amount">Amount to refund</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={order.total}
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum: R{order.total.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Refund Method */}
          <div className="space-y-3">
            <Label>Where should we send your refund?</Label>
            <RadioGroup value={refundMethod} onValueChange={(v) => setRefundMethod(v as 'wallet' | 'original_payment')}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="flex-1 cursor-pointer flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <div>
                    <span className="font-medium">EatLocal Wallet</span>
                    <p className="text-xs text-muted-foreground">Instant credit, use on future orders</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="original_payment" id="original_payment" />
                <Label htmlFor="original_payment" className="flex-1 cursor-pointer flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <div>
                    <span className="font-medium">Original Payment Method</span>
                    <p className="text-xs text-muted-foreground">5-10 business days to process</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Info Alert */}
          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertDescription>
              Refund requests are typically reviewed within 24-48 hours. You'll receive a notification
              once a decision has been made.
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!reason || !description || createRefund.isPending || (refundType === 'partial' && !partialAmount)}
            className="flex-1"
          >
            {createRefund.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
