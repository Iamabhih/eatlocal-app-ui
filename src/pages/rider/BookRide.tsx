import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadScript, GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { JourneyModeSelector } from '@/components/rides/JourneyModeSelector';
import { useRides } from '@/hooks/useRides';
import { MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const libraries: ("places")[] = ["places"];

export default function BookRide() {
  const navigate = useNavigate();
  const { createRide } = useRides();
  
  const [journeyMode, setJourneyMode] = useState('budget');
  const [serviceTier, setServiceTier] = useState('budget');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState({ lat: -26.2041, lng: 28.0473 }); // Johannesburg
  const [dropoffCoords, setDropoffCoords] = useState<{lat: number, lng: number} | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [estimatedFare, setEstimatedFare] = useState(0);

  const handleModeSelect = (mode: string, tier: string) => {
    setJourneyMode(mode);
    setServiceTier(tier);
  };

  const geocodeAddress = async (address: string, isPickup: boolean) => {
    if (!address.trim()) return;
    
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
          
          // Calculate route
          if (pickupCoords) {
            const directionsService = new google.maps.DirectionsService();
            const route = await directionsService.route({
              origin: pickupCoords,
              destination: coords,
              travelMode: google.maps.TravelMode.DRIVING,
            });
            setDirections(route);
            
            // Estimate fare (simple calculation)
            const distance = route.routes[0].legs[0].distance?.value || 0;
            const distanceKm = distance / 1000;
            const baseFare = serviceTier === 'luxury' ? 50 : serviceTier === 'premium' ? 30 : serviceTier === 'enhanced' ? 20 : 15;
            const perKmRate = serviceTier === 'luxury' ? 18 : serviceTier === 'premium' ? 12.5 : serviceTier === 'enhanced' ? 10 : 8.5;
            setEstimatedFare(baseFare + (distanceKm * perKmRate));
          }
        }
      }
    } catch (error) {
      logger.error('Geocoding error:', error);
      toast.error('Could not find address');
    }
  };

  const handleBookRide = async () => {
    if (!dropoffCoords || !directions) {
      toast.error('Please enter both pickup and dropoff addresses');
      return;
    }

    const distance = directions.routes[0].legs[0].distance?.value || 0;
    const duration = directions.routes[0].legs[0].duration?.value || 0;

    createRide.mutate({
      pickup_address: pickupAddress,
      pickup_latitude: pickupCoords.lat,
      pickup_longitude: pickupCoords.lng,
      dropoff_address: dropoffAddress,
      dropoff_latitude: dropoffCoords.lat,
      dropoff_longitude: dropoffCoords.lng,
      journey_mode: journeyMode,
      service_tier: serviceTier,
      estimated_distance_km: distance / 1000,
      estimated_duration_minutes: Math.round(duration / 60),
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
        {/* Left: Map */}
        <Card className="p-4">
          <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}
            libraries={libraries}
          >
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
                <Button onClick={() => geocodeAddress(pickupAddress, true)} variant="outline">
                  <Navigation className="h-4 w-4" />
                </Button>
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
                <Button onClick={() => geocodeAddress(dropoffAddress, false)} variant="outline">
                  <Navigation className="h-4 w-4" />
                </Button>
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
              disabled={!dropoffCoords || createRide.isPending}
            >
              {createRide.isPending ? 'Booking...' : 'Book Ride'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
