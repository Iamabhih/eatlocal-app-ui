import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRides } from '@/hooks/useRides';
import { MapPin, Clock, DollarSign, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  requested: 'bg-yellow-500',
  accepted: 'bg-blue-500',
  driver_arriving: 'bg-cyan-500',
  started: 'bg-green-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-500',
};

export default function MyRides() {
  const navigate = useNavigate();
  const { rides, isLoading } = useRides();

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading rides...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Rides</h1>
        <Button onClick={() => navigate('/rides/book')}>Book New Ride</Button>
      </div>

      {!rides || rides.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">You haven't booked any rides yet</p>
          <Button onClick={() => navigate('/rides/book')}>Book Your First Ride</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {rides.map((ride: any) => (
            <Card key={ride.id} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Badge className={statusColors[ride.status]}>
                    {ride.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(ride.created_at), 'PPp')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">R {ride.total.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{ride.journey_mode}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Pickup</p>
                    <p className="text-sm text-muted-foreground">{ride.pickup_address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-destructive mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Dropoff</p>
                    <p className="text-sm text-muted-foreground">{ride.dropoff_address}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {ride.estimated_duration_minutes} min
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {ride.estimated_distance_km.toFixed(1)} km
                </div>
                {ride.driver && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {ride.driver.profiles?.full_name || 'Driver assigned'}
                  </div>
                )}
              </div>

              {['accepted', 'driver_arriving', 'started'].includes(ride.status) && (
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={() => navigate(`/rides/tracking/${ride.id}`)}
                >
                  Track Ride
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
