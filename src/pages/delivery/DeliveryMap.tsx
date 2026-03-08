import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDeliveryPartnerStatus } from '@/hooks/useDeliveryPartnerStatus';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DeliveryMap() {
  const { status, toggleOnline } = useDeliveryPartnerStatus();
  const { currentLocation, isTracking, startTracking, stopTracking } = useLocationTracking();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live Map</h1>
        <Badge variant={status?.is_online ? 'default' : 'secondary'}>
          {status?.is_online ? 'Online' : 'Offline'}
        </Badge>
      </div>

      {/* Map placeholder */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[500px] bg-muted flex items-center justify-center relative">
            <div className="text-center space-y-4">
              <MapPin className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium text-lg">Live Location Tracking</p>
                {currentLocation ? (
                  <p className="text-sm text-muted-foreground">
                    Lat: {currentLocation.latitude.toFixed(4)}, Lng: {currentLocation.longitude.toFixed(4)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Enable location tracking to see your position
                  </p>
                )}
              </div>
              <Button
                onClick={isTracking ? stopTracking : startTracking}
                variant={isTracking ? 'destructive' : 'default'}
              >
                <Navigation className="h-4 w-4 mr-2" />
                {isTracking ? 'Stop Tracking' : 'Start Tracking'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Location Details */}
      {currentLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Latitude</p>
                <p className="font-medium">{currentLocation.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Longitude</p>
                <p className="font-medium">{currentLocation.longitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Accuracy</p>
                <p className="font-medium">{currentLocation.accuracy?.toFixed(0) || '-'}m</p>
              </div>
              <div>
                <p className="text-muted-foreground">Speed</p>
                <p className="font-medium">{currentLocation.speed?.toFixed(1) || '0'} km/h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
