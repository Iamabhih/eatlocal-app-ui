/**
 * Order Detail Modal Component
 *
 * Shows complete order information including timeline, customer details, and actions
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Check,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Package,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface OrderDetailModalProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailModal({
  order,
  open,
  onOpenChange,
}: OrderDetailModalProps) {
  if (!order) return null;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-orange-500',
      ready: 'bg-purple-500',
      picked_up: 'bg-indigo-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const timeline = [
    { status: 'pending', label: 'Order Placed', time: order.created_at },
    { status: 'confirmed', label: 'Confirmed', time: order.accepted_at },
    { status: 'preparing', label: 'Preparing', time: order.accepted_at },
    { status: 'ready', label: 'Ready for Pickup', time: order.ready_at },
    { status: 'picked_up', label: 'Picked Up', time: order.picked_up_at },
    { status: 'delivered', label: 'Delivered', time: order.delivered_at },
  ];

  const currentIndex = timeline.findIndex((t) => t.status === order.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order #{order.order_number}
            </DialogTitle>
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="space-y-6 pr-4">
            {/* Order Timeline */}
            <div>
              <h3 className="font-semibold mb-4">Order Timeline</h3>
              <div className="space-y-4">
                {timeline.map((item, index) => {
                  const isComplete = index <= currentIndex;
                  const isCurrent = index === currentIndex;

                  return (
                    <div key={item.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            isComplete
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200'
                          }`}
                        >
                          {isComplete && <Check className="h-4 w-4" />}
                        </div>
                        {index < timeline.length - 1 && (
                          <div
                            className={`w-0.5 h-12 ${
                              isComplete ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            isCurrent ? 'text-green-600' : ''
                          }`}
                        >
                          {item.label}
                        </p>
                        {item.time && (
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(item.time), 'PPp')} (
                            {formatDistanceToNow(new Date(item.time), {
                              addSuffix: true,
                            })}
                            )
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Customer Information */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </h3>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer?.full_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer?.phone || 'N/A'}</span>
                </div>
                {order.delivery_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>
                      {order.delivery_address.street_address},{' '}
                      {order.delivery_address.city}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Restaurant Information */}
            <div>
              <h3 className="font-semibold mb-4">Restaurant</h3>
              <p className="text-sm">{order.restaurant?.name || 'N/A'}</p>
            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-4">Order Items</h3>
              <div className="space-y-2">
                {order.order_items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.quantity}x {item.menu_item?.name}
                      </p>
                      {item.special_instructions && (
                        <p className="text-sm text-muted-foreground">
                          Note: {item.special_instructions}
                        </p>
                      )}
                    </div>
                    <span className="font-medium">
                      R{item.total_price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Payment Summary */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>R{order.delivery_fee.toFixed(2)}</span>
                </div>
                {order.service_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Service Fee</span>
                    <span>R{order.service_fee.toFixed(2)}</span>
                  </div>
                )}
                {order.tip > 0 && (
                  <div className="flex justify-between">
                    <span>Tip</span>
                    <span>R{order.tip.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>R{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" size="sm">
                Contact Customer
              </Button>
              <Button variant="outline" size="sm">
                Contact Restaurant
              </Button>
              {order.delivery_partner_id && (
                <Button variant="outline" size="sm">
                  Contact Driver
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
