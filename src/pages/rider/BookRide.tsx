import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { JourneyModeSelector } from '@/components/rides/JourneyModeSelector';
import { useRides } from '@/hooks/useRides';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const hasMapsKey = !!MAPS_KEY;

// Only import Google Maps if key exists
let LoadScript: any, GoogleMap: any, Marker: any, DirectionsRenderer: any;
if (hasMapsKey) {
  const maps = await import('@react-google-maps/api');
  LoadScript = maps.LoadScript;
  GoogleMap = maps.GoogleMap;
  Marker = maps.Marker;
  DirectionsRenderer = maps.DirectionsRenderer;
}

const libraries: ("places")[] = ["places"];

// Simple distance calculation (Haversine) for fallback mode
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function BookRide() {
  const navigate = useNavigate();
  const { createRide } = useRides();
  
  const [journeyMode, setJourneyMode] = useState('budget');
  const [serviceTier, setServiceTier] = useState('budget');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState({ lat: -26.2041, lng: 28.0473 });
  const [dropoffCoords, setDropoffCoords] = useState<{lat: number, lng: number} | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [manualDistance, setManualDistance] = useState<number | null>(null);

  const handleModeSelect = (mode: string, tier: string) => {
    setJourneyMode(mode);
    setServiceTier(tier);
  };

  const calculateFare = (distanceKm: number, tier: string) => {
    const baseFare = tier === 'luxury' ? 50 : tier === 'premium' ? 30 : tier === 'enhanced' ? 20 : 15;
    const perKmRate = tier === 'luxury' ? 18 : tier === 'premium' ? 12.5 : tier === 'enhanced' ? 10 : 8.5;
    return baseFare + (distanceKm * perKmRate);
  };

  const geocodeAddress = async (address: string, isPickup: boolean) => {
    if (!address.trim() || !hasMapsKey) return;
    
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address });
      
      if (result.results[0]) {
        const location = result.results[0].geometry.location;
        const coords = { lat: location.lat(), lng: location.lng() };
        
        if (isPickup) {
          setPickupCoords(coords);
          setPickupAddress(result.results[0].formatted_address);
        } else {
          setDropoffCoords(coords);
          setDropoffAddress(result.results[0].formatted_address);
          
          if (pickupCoords) {
            const directionsService = new google.maps.DirectionsService();
            const route = await directionsService.route({
              origin: pickupCoords,
              destination: coords,
              travelMode: google.maps.TravelMode.DRIVING,
            });
            setDirections(route);
            
            const distance = route.routes[0].legs[0].distance?.value || 0;
            const distanceKm = distance / 1000;
            setEstimatedFare(calculateFare(distanceKm, serviceTier));
          }
        }
      }
    } catch (error) {
      logger.error('Geocoding error:', error);
      toast.error('Could not find address');
    }
  };

  // Fallback: manual coordinate/distance entry
  const handleManualEstimate = () => {
    if (!manualDistance || manualDistance <= 0) {
      toast.error('Please enter a valid distance');
      return;
    }
    setEstimatedFare(calculateFare(manualDistance, serviceTier));
    // Set dummy coords for fallback
    if (!dropoffCoords) {
      setDropoffCoords({ lat: pickupCoords.lat + 0.01, lng: pickupCoords.lng + 0.01 });
    }
  };

  const handleBookRide = async () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      toast.error('Please enter both pickup and dropoff addresses');
      return;
    }

    const distance = directions
      ? (directions.routes[0].legs[0].distance?.value || 0) / 1000
      : manualDistance || 0;
    const duration = directions
      ? Math.round((directions.routes[0].legs[0].duration?.value || 0) / 60)
      : Math.round(distance * 2); // rough estimate: 2 min/km

    createRide.mutate({
      pickup_address: pickupAddress,
      pickup_latitude: pickupCoords.lat,
      pickup_longitude: pickupCoords.lng,
      dropoff_address: dropoffAddress,
      dropoff_latitude: dropoffCoords?.lat || pickupCoords.lat,
      dropoff_longitude: dropoffCoords?.lng || pickupCoords.lng,
      journey_mode: journeyMode,
      service_tier: serviceTier,
      estimated_distance_km: distance,
      estimated_duration_minutes: duration,
      estimated_fare: estimatedFare,
      special_instructions: specialInstructions,
    }, {
      onSuccess: () => {
        navigate('/rides/my-rides');
      },
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Book a Ride</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Map or Fallback */}
        <Card className="p-4">
          {hasMapsKey ? (
            <LoadScript googleMapsApiKey={MAPS_KEY} libraries={libraries}>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '500px' }}
                center={pickupCoords}
                zoom={13}
              >
                <Marker position={pickupCoords} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }} />
                {dropoffCoords && <Marker position={dropoffCoords} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }} />}
                {directions && <DirectionsRenderer directions={directions} />}
              </GoogleMap>
            </LoadScript>
          ) : (
            <div className="h-[500px] bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-4 p-6">
                <MapPin className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium text-lg">Map Unavailable</p>
                  <p className="text-sm text-muted-foreground">
                    Enter your addresses manually below. We'll calculate an estimated fare based on distance.
                  </p>
                </div>
                <div className="space-y-2 max-w-xs mx-auto">
                  <label className="text-sm font-medium">Estimated Distance (km)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="e.g. 15"
                      value={manualDistance || ''}
                      onChange={(e) => setManualDistance(Number(e.target.value))}
                    />
                    <Button onClick={handleManualEstimate} variant="outline">
                      Calculate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Right: Form */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-semibold mb-4">Journey Mode</h2>
            <JourneyModeSelector selected={journeyMode} onSelect={handleModeSelect} />
          </Card>

          <Card className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                Pickup Location
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter pickup address"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && geocodeAddress(pickupAddress, true)}
                />
                {hasMapsKey && (
                  <Button onClick={() => geocodeAddress(pickupAddress, true)} variant="outline">
                    <Navigation className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-destructive" />
                Dropoff Location
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter dropoff address"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && geocodeAddress(dropoffAddress, false)}
                />
                {hasMapsKey && (
                  <Button onClick={() => geocodeAddress(dropoffAddress, false)} variant="outline">
                    <Navigation className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Special Instructions (Optional)</label>
              <Textarea
                placeholder="Any special requests or instructions..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
              />
            </div>

            {estimatedFare > 0 && (
              <Card className="p-4 bg-primary/5">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Estimated Fare</span>
                  <span className="text-2xl font-bold">R {estimatedFare.toFixed(2)}</span>
                </div>
              </Card>
            )}

            <Button 
              onClick={handleBookRide} 
              className="w-full" 
              size="lg"
              disabled={!pickupAddress.trim() || !dropoffAddress.trim() || createRide.isPending}
            >
              {createRide.isPending ? 'Booking...' : 'Book Ride'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
