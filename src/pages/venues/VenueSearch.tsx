import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Star,
  Filter,
  SlidersHorizontal,
  Clock,
  DollarSign,
  Map,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  useVenueSearch,
  useFeaturedVenues,
  venueTypeLabels,
  Venue,
} from '@/hooks/useVenues';

export default function VenueSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search state
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [venueType, setVenueType] = useState(searchParams.get('type') || '');
  const [priceLevel, setPriceLevel] = useState<number | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { data: venues = [], isLoading } = useVenueSearch({
    city: city || undefined,
    venueType: venueType || undefined,
    priceLevel: priceLevel || undefined,
    minRating: minRating > 0 ? minRating : undefined,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
  });

  const { data: featuredVenues = [] } = useFeaturedVenues(4);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (venueType) params.set('type', venueType);
    setSearchParams(params);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const commonCategories = [
    'Dining',
    'Nightlife',
    'Entertainment',
    'Outdoor',
    'Culture',
    'Wellness',
    'Sports',
    'Shopping',
  ];

  const VenueCard = ({ venue }: { venue: Venue }) => (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
      onClick={() => navigate(`/venues/${venue.id}`)}
    >
      <div className="relative">
        <img
          src={venue.main_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'}
          alt={venue.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {venue.is_featured && (
          <Badge className="absolute top-3 left-3 bg-primary">Featured</Badge>
        )}
        <Badge
          variant="secondary"
          className="absolute top-3 right-3"
        >
          {venueTypeLabels[venue.venue_type] || venue.venue_type}
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{venue.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              {venue.city}, {venue.country}
            </div>
          </div>
          {venue.price_level && (
            <div className="flex text-green-600">
              {Array.from({ length: venue.price_level }).map((_, i) => (
                <DollarSign key={i} className="h-4 w-4" />
              ))}
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {venue.short_description || venue.description || 'Discover amazing experiences at this venue.'}
        </p>

        {/* Categories */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {venue.categories.slice(0, 3).map((category) => (
            <Badge key={category} variant="outline" className="text-xs">
              {category}
            </Badge>
          ))}
          {venue.categories.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{venue.categories.length - 3}
            </Badge>
          )}
        </div>

        <Separator className="my-3" />

        <div className="flex justify-between items-center">
          <div>
            {venue.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{venue.rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({venue.total_reviews} reviews)
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            {venue.is_24_hours ? '24 Hours' : 'See hours'}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Venue Type */}
      <div>
        <h4 className="font-medium mb-3">Venue Type</h4>
        <Select value={venueType} onValueChange={setVenueType}>
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {Object.entries(venueTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Level */}
      <div>
        <h4 className="font-medium mb-3">Price Level</h4>
        <div className="flex gap-2">
          {[null, 1, 2, 3, 4].map((level) => (
            <Button
              key={level ?? 'any'}
              variant={priceLevel === level ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPriceLevel(level)}
            >
              {level === null ? 'Any' : '$'.repeat(level)}
            </Button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="font-medium mb-3">Minimum Rating</h4>
        <div className="flex gap-2 flex-wrap">
          {[0, 3, 3.5, 4, 4.5].map((rating) => (
            <Button
              key={rating}
              variant={minRating === rating ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMinRating(rating)}
            >
              {rating === 0 ? 'Any' : `${rating}+`}
            </Button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h4 className="font-medium mb-3">Categories</h4>
        <div className="space-y-2">
          {commonCategories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
              />
              <label htmlFor={category} className="text-sm cursor-pointer">
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setVenueType('');
          setPriceLevel(null);
          setMinRating(0);
          setSelectedCategories([]);
        }}
      >
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Search Section */}
      <section className="bg-gradient-to-r from-purple-600 to-purple-500 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Discover Amazing Venues</h1>
          <p className="text-lg opacity-90 mb-8">
            Find restaurants, bars, museums, parks, and unique experiences near you
          </p>

          {/* Search Form */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Where are you looking?"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Type
                </label>
                <Select value={venueType} onValueChange={setVenueType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All venues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All venues</SelectItem>
                    {Object.entries(venueTypeLabels).slice(0, 10).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button className="w-full" size="lg" onClick={handleSearch}>
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/map')}>
                <Map className="h-4 w-4 mr-2" />
                View Map
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/experiences')}>
                Browse Experiences
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filters */}
          <aside className="hidden lg:block">
            <Card className="p-4 sticky top-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Filters
              </h3>
              <FilterSidebar />
            </Card>
          </aside>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {isLoading ? 'Searching...' : `${venues.length} venues found`}
              </h2>
              <Select defaultValue="recommended">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Venue Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="h-48 bg-muted animate-pulse" />
                    <CardContent className="p-4">
                      <div className="h-6 bg-muted animate-pulse rounded mb-2" />
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : venues.length === 0 ? (
              <Card className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No venues found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters to find more options.
                </p>
                <Button variant="outline" onClick={() => {
                  setCity('');
                  setVenueType('');
                  setPriceLevel(null);
                  setMinRating(0);
                  setSelectedCategories([]);
                }}>
                  Clear All Filters
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {venues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Section */}
      {!city && featuredVenues.length > 0 && (
        <section className="bg-muted/50 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Featured Venues</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
