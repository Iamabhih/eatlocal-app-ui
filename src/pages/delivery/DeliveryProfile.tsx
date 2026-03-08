import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useDeliveryPartnerStatus } from '@/hooks/useDeliveryPartnerStatus';
import { Phone, Mail, Star, Package, TrendingUp } from 'lucide-react';

export default function DeliveryProfile() {
  const { user } = useAuth();
  const { status } = useDeliveryPartnerStatus();

  const displayName = user?.user_metadata?.full_name || 'Delivery Partner';

  return (
    <div className="container mx-auto p-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
            <AvatarFallback className="text-xl">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-xl">{displayName}</CardTitle>
            <p className="text-muted-foreground">{user?.email}</p>
            <Badge variant={status?.is_online ? 'default' : 'secondary'} className="mt-2">
              {status?.is_online ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user?.user_metadata?.phone || 'Not set'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{status?.current_order_count || 0}</p>
            <p className="text-sm text-muted-foreground">Active Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{status?.max_concurrent_orders || 3}</p>
            <p className="text-sm text-muted-foreground">Max Concurrent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">
              {status?.available_for_orders ? 'Yes' : 'No'}
            </p>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
