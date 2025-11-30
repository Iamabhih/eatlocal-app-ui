import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  Star,
  Clock,
  Car,
  User,
  ArrowLeft,
  CheckCircle,
  Circle,
  AlertCircle
} from 'lucide-react';

interface RideDetails {
  id: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_latitude: number;
  dropoff_longitude: number;
  estimated_fare: number;
  actual_fare: number | null;
  estimated_duration_minutes: number;
  created_at: string;
  driver?: {
    id: string;
    user_id: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_color: string;
    license_plate: string;
    average_rating: number;
    profile?: {
      full_name: string;
      phone: string;
    };
  };
}

const statusSteps = [
  { key: 'requested', label: 'Requested', icon: Circle },
  { key: 'accepted', label: 'Driver Assigned', icon: User },
  { key: 'arriving', label: 'Driver Arriving', icon: Car },
  { key: 'in_progress', label: 'In Transit', icon: Navigation },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
];

function getStatusIndex(status: string): number {
  const index = statusSteps.findIndex(s => s.key === status);
  return index >= 0 ? index : 0;
}

export default function RideTracking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: ride, isLoading, error } = useQuery({
    queryKey: ['ride-tracking', id],
    queryFn: async () => {
      if (!id) throw new Error('No ride ID provided');

      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:drivers!rides_driver_id_fkey(
            id,
            user_id,
            vehicle_make,
            vehicle_model,
            vehicle_color,
            license_plate,
            average_rating,
            profile:profiles!drivers_user_id_fkey(
              full_name,
              phone
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as RideDetails;
    },
    refetchInterval: 5000, // Poll every 5 seconds for live updates
    enabled: !!id && !!user,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ride Not Found</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't find this ride. It may have been cancelled or doesn't exist.
            </p>
            <Button onClick={() => navigate('/rides/my-rides')}>
              View My Rides
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStep = getStatusIndex(ride.status);
  const isCancelled = ride.status === 'cancelled';
  const isCompleted = ride.status === 'completed';

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/rides/my-rides')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to My Rides
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ride Status</CardTitle>
            <Badge
              variant={isCancelled ? 'destructive' : isCompleted ? 'default' : 'secondary'}
            >
              {ride.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <CardDescription>
            Booked on {new Date(ride.created_at).toLocaleDateString('en-ZA', {
              dateStyle: 'medium',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          {!isCancelled && (
            <div className="flex items-center justify-between mb-8">
              {statusSteps.map((step, index) => {
                const isActive = index <= currentStep;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs mt-2 text-center ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                    {index < statusSteps.length - 1 && (
                      <div className={`
                        absolute h-0.5 w-full -z-10
                        ${index < currentStep ? 'bg-primary' : 'bg-muted'}
                      `} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Route Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Circle className="w-4 h-4 text-green-600" fill="currentColor" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pickup</p>
                <p className="font-medium">{ride.pickup_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Drop-off</p>
                <p className="font-medium">{ride.dropoff_address}</p>
              </div>
            </div>
          </div>

          {/* Fare Info */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  {ride.actual_fare ? 'Final Fare' : 'Estimated Fare'}
                </p>
                <p className="text-2xl font-bold">
                  R{(ride.actual_fare || ride.estimated_fare).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Est. Duration</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {ride.estimated_duration_minutes} min
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Info */}
      {ride.driver && (
        <Card>
          <CardHeader>
            <CardTitle>Your Driver</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {ride.driver.profile?.full_name || 'Driver'}
                </h3>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4" fill="currentColor" />
                  <span className="text-sm font-medium">
                    {ride.driver.average_rating?.toFixed(1) || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">Vehicle</p>
              <p className="font-medium">
                {ride.driver.vehicle_color} {ride.driver.vehicle_make} {ride.driver.vehicle_model}
              </p>
              <p className="text-lg font-bold mt-1">{ride.driver.license_plate}</p>
            </div>

            {!isCompleted && !isCancelled && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <a href={`tel:${ride.driver.profile?.phone}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </a>
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cancel Button (only if ride is not completed or cancelled) */}
      {!isCompleted && !isCancelled && ride.status === 'requested' && (
        <div className="mt-6">
          <Button variant="destructive" className="w-full">
            Cancel Ride
          </Button>
        </div>
      )}
    </div>
  );
}
