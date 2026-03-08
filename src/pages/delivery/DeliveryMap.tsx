import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDeliveryPartnerStatus } from '@/hooks/useDeliveryPartnerStatus';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface LocationInfo {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
}

export default function DeliveryMap() {
  const { status } = useDeliveryPartnerStatus();
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const startTracking = () => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed ? pos.coords.speed * 3.6 : null, // m/s to km/h
        });
      },
      () => {},
      { enableHighAccuracy: true }
    );
    setWatchId(id);
    setIsTracking(true);
  };

  const stopTracking = () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    setIsTracking(false);
    setWatchId(null);
  };

  useEffect(() => {
    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, [watchId]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live Map</h1>
        <Badge variant={status?.is_online ? 'default' : 'secondary'}>
          {status?.is_online ? 'Online' : 'Offline'}
        </Badge>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[500px] bg-muted flex items-center justify-center">
            <div className="text-center space-y-4">
              <MapPin className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium text-lg">Live Location Tracking</p>
                {location ? (
                  <p className="text-sm text-muted-foreground">
                    Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
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

      {location && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Latitude</p>
                <p className="font-medium">{location.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Longitude</p>
                <p className="font-medium">{location.longitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Accuracy</p>
                <p className="font-medium">{location.accuracy?.toFixed(0) || '-'}m</p>
              </div>
              <div>
                <p className="text-muted-foreground">Speed</p>
                <p className="font-medium">{location.speed?.toFixed(1) || '0'} km/h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
