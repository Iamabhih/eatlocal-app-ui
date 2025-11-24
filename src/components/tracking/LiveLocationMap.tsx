/**
 * Live Location Map Component
 * Real-time delivery partner location tracking with route visualization
 */

import { useEffect, useState, useRef } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Navigation, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { calculateDistance } from '@/lib/distanceUtils';

interface LiveLocationMapProps {
  orderId: string;
  deliveryPartnerId?: string;
  restaurantLocation: { lat: number; lng: number };
  deliveryLocation: { lat: number; lng: number };
}

interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
};

const defaultCenter = {
  lat: -26.2041,
  lng: 28.0473, // Johannesburg, South Africa
};

export function LiveLocationMap({
  orderId,
  deliveryPartnerId,
  restaurantLocation,
  deliveryLocation,
}: LiveLocationMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const [currentLocation, setCurrentLocation] = useState<LocationUpdate | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!deliveryPartnerId) return;

    logger.log('Subscribing to delivery partner location:', deliveryPartnerId);

    const channel = supabase
      .channel(`delivery-location:${deliveryPartnerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_partner_locations',
          filter: `delivery_partner_id=eq.${deliveryPartnerId}`,
        },
        (payload) => {
          logger.log('Location update received:', payload);

          if (payload.new) {
            const location: LocationUpdate = {
              latitude: payload.new.latitude,
              longitude: payload.new.longitude,
              timestamp: payload.new.updated_at,
              speed: payload.new.speed,
              heading: payload.new.heading,
            };

            setCurrentLocation(location);
            setIsActive(payload.new.is_active);

            // Calculate ETA based on distance and average speed
            if (location.speed && location.speed > 0) {
              const distance = calculateDistance(
                location.latitude,
                location.longitude,
                deliveryLocation.lat,
                deliveryLocation.lng
              );

              // ETA in minutes (distance in km, speed in km/h)
              const estimatedMinutes = (distance / location.speed) * 60;
              setEta(Math.round(estimatedMinutes));
            }

            // Auto-center map on new location
            if (mapRef.current) {
              mapRef.current.panTo({
                lat: location.latitude,
                lng: location.longitude,
              });
            }
          }
        }
      )
      .subscribe();

    // Fetch initial location
    fetchCurrentLocation();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deliveryPartnerId]);

  const fetchCurrentLocation = async () => {
    if (!deliveryPartnerId) return;

    const { data, error } = await supabase
      .from('delivery_partner_locations')
      .select('*')
      .eq('delivery_partner_id', deliveryPartnerId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      logger.error('Error fetching location:', error);
      return;
    }

    if (data) {
      setCurrentLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.updated_at,
        speed: data.speed,
        heading: data.heading,
      });
      setIsActive(data.is_active);
    }
  };

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;

    // Fit bounds to show all markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(restaurantLocation);
    bounds.extend(deliveryLocation);
    if (currentLocation) {
      bounds.extend({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      });
    }
    map.fitBounds(bounds);
  };

  if (!isLoaded) {
    return (
      <Card className="p-6 flex items-center justify-center" style={{ height: '400px' }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </Card>
    );
  }

  const routePath = currentLocation
    ? [
        { lat: currentLocation.latitude, lng: currentLocation.longitude },
        deliveryLocation,
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Navigation className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Delivery Partner</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isActive ? 'default' : 'secondary'}>
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
                {currentLocation && (
                  <span className="text-xs text-muted-foreground">
                    Last updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {eta !== null && (
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="text-right">
                <p className="text-2xl font-bold">{eta}</p>
                <p className="text-xs text-muted-foreground">minutes</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Map */}
      <Card className="overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={
            currentLocation
              ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
              : defaultCenter
          }
          zoom={14}
          onLoad={onMapLoad}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {/* Restaurant Marker */}
          <Marker
            position={restaurantLocation}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#10b981" stroke="white" stroke-width="3"/>
                  <text x="20" y="27" font-size="20" text-anchor="middle" fill="white">🍽️</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40),
            }}
            title="Restaurant"
          />

          {/* Delivery Location Marker */}
          <Marker
            position={deliveryLocation}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#3b82f6" stroke="white" stroke-width="3"/>
                  <text x="20" y="27" font-size="20" text-anchor="middle" fill="white">📍</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40),
            }}
            title="Delivery Address"
          />

          {/* Delivery Partner Current Location */}
          {currentLocation && isActive && (
            <>
              <Marker
                position={{
                  lat: currentLocation.latitude,
                  lng: currentLocation.longitude,
                }}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="#f59e0b" stroke="white" stroke-width="3"/>
                      <text x="20" y="27" font-size="20" text-anchor="middle" fill="white">🏍️</text>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(40, 40),
                }}
                title="Delivery Partner"
              />

              {/* Route Line */}
              {routePath.length > 1 && (
                <Polyline
                  path={routePath}
                  options={{
                    strokeColor: '#f59e0b',
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                    geodesic: true,
                  }}
                />
              )}
            </>
          )}
        </GoogleMap>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Restaurant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Delivery Address</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Delivery Partner</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
