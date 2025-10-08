import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}

export const useLocationTracking = (orderId: string | null, enabled: boolean = false) => {
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateLocation = async (position: GeolocationPosition) => {
    if (!orderId) return;

    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      accuracy: position.coords.accuracy,
    };

    setLastLocation(locationData);

    try {
      const { error } = await supabase
        .from('delivery_partner_locations')
        .upsert({
          delivery_partner_id: (await supabase.auth.getUser()).data.user?.id,
          order_id: orderId,
          ...locationData,
        });

      if (error) {
        console.error('Error updating location:', error);
      }
    } catch (error) {
      console.error('Error in location update:', error);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    if (watchIdRef.current) {
      return; // Already tracking
    }

    setIsTracking(true);

    // Watch position with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        updateLocation(position);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location Error",
          description: error.message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Update every 10 seconds
    updateIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(updateLocation);
    }, 10000);

    toast({
      title: "Location Tracking Started",
      description: "Your location is now being shared",
    });
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    setIsTracking(false);

    toast({
      title: "Location Tracking Stopped",
      description: "Location sharing has been disabled",
    });
  };

  useEffect(() => {
    if (enabled && orderId) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, orderId]);

  return {
    isTracking,
    lastLocation,
    startTracking,
    stopTracking,
  };
};
