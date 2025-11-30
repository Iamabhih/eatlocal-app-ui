import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Navigation,
  Filter,
  List,
  Map as MapIcon,
  Star,
  Clock,
  DollarSign,
  Utensils,
  Building2,
  Sparkles,
  Hotel,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type SearchType = 'all' | 'restaurants' | 'hotels' | 'venues' | 'experiences';

interface MapLocation {
  id: string;
  name: string;
  type: SearchType;
  latitude: number;
  longitude: number;
  rating: number;
  price?: number;
  image?: string;
  address: string;
  city: string;
}

export default function LiveMapSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [radius, setRadius] = useState(10); // km
  const [isLocating, setIsLocating] = useState(false);

  // Get user's location
  const getUserLocation = useCallback(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Cape Town
          setUserLocation({ lat: -33.9249, lng: 18.4241 });
          setIsLocating(false);
        }
      );
    } else {
      setUserLocation({ lat: -33.9249, lng: 18.4241 });
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Fetch nearby locations
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['map-locations', userLocation, searchType, radius, searchQuery],
    queryFn: async () => {
      if (!userLocation) return [];

      const latDelta = radius / 111;
      const lngDelta = radius / (111 * Math.cos(userLocation.lat * Math.PI / 180));

      const results: MapLocation[] = [];

      // Fetch restaurants
      if (searchType === 'all' || searchType === 'restaurants') {
        const { data: restaurants } = await (supabase
          .from('restaurants')
          .select('id, name, cuisine_type, latitude, longitude, rating, street_address, city, image_url')
          .eq('is_active', true) as any);

        if (restaurants) {
          results.push(
            ...(restaurants as any[]).filter((r: any) => r.latitude && r.longitude).map((r: any) => ({
              id: r.id,
              name: r.name,
              type: 'restaurants' as SearchType,
              latitude: Number(r.latitude) || 0,
              longitude: Number(r.longitude) || 0,
              rating: Number(r.rating) || 0,
              image: r.image_url,
              address: r.street_address || '',
              city: r.city || '',
            }))
          );
        }
      }

      // Fetch hotels
      if (searchType === 'all' || searchType === 'hotels') {
        const { data: hotels } = await supabase
          .from('hotels')
          .select('id, name, property_type, latitude, longitude, rating, street_address, city, main_image, base_price')
          .eq('is_active', true)
          .eq('verification_status', 'verified')
          .gte('latitude', userLocation.lat - latDelta)
          .lte('latitude', userLocation.lat + latDelta)
          .gte('longitude', userLocation.lng - lngDelta)
          .lte('longitude', userLocation.lng + lngDelta);

        if (hotels) {
          results.push(
            ...hotels.map((h) => ({
              id: h.id,
              name: h.name,
              type: 'hotels' as SearchType,
              latitude: h.latitude || 0,
              longitude: h.longitude || 0,
              rating: h.rating || 0,
              price: h.base_price || undefined,
              image: h.main_image || undefined,
              address: h.street_address || '',
              city: h.city || '',
            }))
          );
        }
      }

      // Fetch venues
      if (searchType === 'all' || searchType === 'venues') {
        const { data: venues } = await (supabase
          .from('venues' as any)
          .select('id, name, venue_type, latitude, longitude, rating, street_address, city, main_image, price_level')
          .eq('is_active', true)
          .eq('verification_status', 'verified') as any);

        if (venues) {
          results.push(
            ...(venues as any[]).filter((v: any) => v.latitude && v.longitude).map((v: any) => ({
              id: v.id,
              name: v.name,
              type: 'venues' as SearchType,
              latitude: Number(v.latitude) || 0,
              longitude: Number(v.longitude) || 0,
              rating: Number(v.rating) || 0,
              image: v.main_image || undefined,
              address: v.street_address || '',
              city: v.city || '',
            }))
          );
        }
      }

      // Filter by search query
      if (searchQuery) {
        return results.filter((r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.city.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      return results;
    },
    enabled: !!userLocation,
  });

  const getTypeIcon = (type: SearchType) => {
    switch (type) {
      case 'restaurants':
        return <Utensils className="h-4 w-4" />;
      case 'hotels':
        return <Hotel className="h-4 w-4" />;
      case 'venues':
        return <Building2 className="h-4 w-4" />;
      case 'experiences':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: SearchType) => {
    switch (type) {
      case 'restaurants':
        return 'bg-orange-500';
      case 'hotels':
        return 'bg-blue-500';
      case 'venues':
        return 'bg-purple-500';
      case 'experiences':
        return 'bg-pink-500';
      default:
        return 'bg-primary';
    }
  };

  const navigateTo = (location: MapLocation) => {
    switch (location.type) {
      case 'restaurants':
        navigate(`/restaurant/${location.id}`);
        break;
      case 'hotels':
        navigate(`/hotels/${location.id}`);
        break;
      case 'venues':
        navigate(`/venues/${location.id}`);
        break;
      case 'experiences':
        navigate(`/experiences/${location.id}`);
        break;
    }
  };

  const LocationCard = ({ location }: { location: MapLocation }) => (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedLocation?.id === location.id ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => setSelectedLocation(location)}
      onDoubleClick={() => navigateTo(location)}
    >
      <CardContent className="p-3">
        <div className="flex gap-3">
          <div className="relative">
            <img
              src={location.image || `https://source.unsplash.com/100x100/?${location.type}`}
              alt={location.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <Badge className={`absolute -top-1 -right-1 ${getTypeColor(location.type)} text-white p-1`}>
              {getTypeIcon(location.type)}
            </Badge>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-1">{location.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {location.address}, {location.city}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {location.rating > 0 && (
                <span className="text-xs flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {location.rating.toFixed(1)}
                </span>
              )}
              {location.price && (
                <span className="text-xs font-medium text-green-600">
                  R{location.price}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Search Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search places, restaurants, hotels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={getUserLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Radius</label>
                  <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 km</SelectItem>
                      <SelectItem value="10">10 km</SelectItem>
                      <SelectItem value="20">20 km</SelectItem>
                      <SelectItem value="50">50 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Type Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { value: 'all', label: 'All', icon: MapPin },
            { value: 'restaurants', label: 'Food', icon: Utensils },
            { value: 'hotels', label: 'Hotels', icon: Hotel },
            { value: 'venues', label: 'Venues', icon: Building2 },
            { value: 'experiences', label: 'Experiences', icon: Sparkles },
          ].map((type) => (
            <Button
              key={type.value}
              variant={searchType === type.value ? 'default' : 'outline'}
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setSearchType(type.value as SearchType)}
            >
              <type.icon className="h-4 w-4 mr-1" />
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Area */}
        <div className={`flex-1 relative ${viewMode === 'list' ? 'hidden md:block' : ''}`}>
          {/* Placeholder Map - In production, integrate with Google Maps, Mapbox, or Leaflet */}
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="text-center p-8">
              <MapIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Map integration with Google Maps, Mapbox, or Leaflet would display
                {locations.length} locations within {radius}km
              </p>
              {userLocation && (
                <Badge variant="secondary" className="mb-4">
                  <MapPin className="h-3 w-3 mr-1" />
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </Badge>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                {locations.slice(0, 6).map((loc) => (
                  <Badge
                    key={loc.id}
                    className={`${getTypeColor(loc.type)} cursor-pointer`}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setViewMode('list');
                    }}
                  >
                    {getTypeIcon(loc.type)}
                    <span className="ml-1">{loc.name}</span>
                  </Badge>
                ))}
                {locations.length > 6 && (
                  <Badge variant="outline">+{locations.length - 6} more</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Selected Location Popup */}
          {selectedLocation && viewMode === 'map' && (
            <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(selectedLocation.type)}>
                        {getTypeIcon(selectedLocation.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground capitalize">
                        {selectedLocation.type}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setSelectedLocation(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-4">
                    <img
                      src={selectedLocation.image || `https://source.unsplash.com/100x100/?${selectedLocation.type}`}
                      alt={selectedLocation.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{selectedLocation.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {selectedLocation.address}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedLocation.rating > 0 && (
                          <span className="text-sm flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {selectedLocation.rating.toFixed(1)}
                          </span>
                        )}
                        {selectedLocation.price && (
                          <span className="text-sm font-medium text-green-600">
                            R{selectedLocation.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.latitude},${selectedLocation.longitude}`,
                          '_blank'
                        )
                      }
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Directions
                    </Button>
                    <Button className="flex-1" onClick={() => navigateTo(selectedLocation)}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* List View */}
        <div
          className={`w-full md:w-96 border-l overflow-y-auto ${
            viewMode === 'map' ? 'hidden md:block' : ''
          }`}
        >
          <div className="p-4 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {isLoading ? 'Searching...' : `${locations.length} places found`}
              </h2>
              <div className="md:hidden">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'map' | 'list')}>
                  <TabsList className="h-8">
                    <TabsTrigger value="map" className="h-6 px-2">
                      <MapIcon className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="list" className="h-6 px-2">
                      <List className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <div className="w-16 h-16 bg-muted animate-pulse rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                          <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : locations.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No places found</h3>
                <p className="text-muted-foreground">
                  Try expanding your search radius or changing filters
                </p>
              </div>
            ) : (
              locations.map((location) => (
                <LocationCard key={`${location.type}-${location.id}`} location={location} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile View Toggle */}
      <div className="md:hidden border-t p-2">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'map' | 'list')} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="map" className="flex-1">
              <MapIcon className="h-4 w-4 mr-2" />
              Map
            </TabsTrigger>
            <TabsTrigger value="list" className="flex-1">
              <List className="h-4 w-4 mr-2" />
              List ({locations.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
