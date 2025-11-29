import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, Store, Clock, DollarSign, Check, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { OrderOffer } from '@/hooks/useDeliveryPartnerStatus';

interface OrderOfferCardProps {
  offer: OrderOffer;
  onAccept: () => void;
  onReject: (reason?: string) => void;
  isResponding: boolean;
}

export function OrderOfferCard({ offer, onAccept, onReject, isResponding }: OrderOfferCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  // Countdown timer
  useEffect(() => {
    const calculateTimeLeft = () => {
      const seconds = differenceInSeconds(new Date(offer.expires_at), new Date());
      setTimeLeft(Math.max(0, seconds));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [offer.expires_at]);

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReject = () => {
    onReject(rejectReason || undefined);
    setShowRejectDialog(false);
    setRejectReason('');
  };

  if (timeLeft === 0) {
    return null; // Offer expired
  }

  return (
    <>
      <Card className="border-2 border-primary/50 animate-pulse-slow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">New Order Offer</CardTitle>
            <Badge variant={timeLeft < 30 ? 'destructive' : 'secondary'}>
              <Clock className="w-3 h-3 mr-1" />
              {formatTimeLeft(timeLeft)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Restaurant Info */}
          <div className="flex items-start gap-3">
            <Store className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{offer.order?.restaurant?.name}</p>
              <p className="text-sm text-muted-foreground">
                {offer.order?.restaurant?.street_address}, {offer.order?.restaurant?.city}
              </p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Deliver To</p>
              <p className="text-sm text-muted-foreground">
                {offer.order?.delivery_address?.street_address},{' '}
                {offer.order?.delivery_address?.city}
              </p>
            </div>
          </div>

          <Separator />

          {/* Earnings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="font-medium">Estimated Earnings</span>
            </div>
            <span className="text-xl font-bold text-green-600">
              R{offer.estimated_earnings?.toFixed(2)}
            </span>
          </div>

          {/* Order Details */}
          <div className="text-sm text-muted-foreground">
            <p>Order #{offer.order?.order_number}</p>
            <p>Order Total: R{offer.order?.total?.toFixed(2)}</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(true)}
              disabled={isResponding}
            >
              {isResponding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Decline
                </>
              )}
            </Button>
            <Button onClick={onAccept} disabled={isResponding}>
              {isResponding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Accept
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this order? You can optionally provide a reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Too far, Currently busy, etc."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Decline Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
