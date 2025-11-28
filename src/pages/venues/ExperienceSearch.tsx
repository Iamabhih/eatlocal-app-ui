import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Star,
  Filter,
  SlidersHorizontal,
  Clock,
  Users,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
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
  useExperienceSearch,
  experienceTypeLabels,
  formatDuration,
  Experience,
} from '@/hooks/useVenues';

export default function ExperienceSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search state
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [experienceType, setExperienceType] = useState(searchParams.get('type') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [priceRange, setPriceRange] = useState([0, 5000]);

  const { data: experiences = [], isLoading } = useExperienceSearch({
    city: city || undefined,
    experienceType: experienceType || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 5000 ? priceRange[1] : undefined,
    date: date || undefined,
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (experienceType) params.set('type', experienceType);
    if (date) params.set('date', date);
    setSearchParams(params);
  };

  const experienceCategories = [
    'Adventure',
    'Food & Drink',
    'Tours',
    'Wellness',
    'Arts & Culture',
    'Sports',
    'Nature',
    'Entertainment',
  ];

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const ExperienceCard = ({ experience }: { experience: Experience }) => (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
      onClick={() => navigate(`/experiences/${experience.id}`)}
    >
      <div className="relative">
        <img
          src={experience.main_image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
          alt={experience.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {experience.is_featured && (
          <Badge className="absolute top-3 left-3 bg-primary">Featured</Badge>
        )}
        {experience.instant_confirmation && (
          <Badge
            variant="secondary"
            className="absolute top-3 right-3"
          >
            Instant Book
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline">
            {experienceTypeLabels[experience.experience_type]}
          </Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(experience.duration_minutes)}
          </div>
        </div>

        <h3 className="font-semibold text-lg line-clamp-1">{experience.name}</h3>

        {experience.venue && (
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            {experience.venue.name} - {experience.venue.city}
          </div>
        )}

        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
          {experience.short_description || 'Join us for an unforgettable experience!'}
        </p>

        {/* Highlights */}
        {experience.highlights.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {experience.highlights.slice(0, 2).map((highlight) => (
              <Badge key={highlight} variant="outline" className="text-xs">
                {highlight}
              </Badge>
            ))}
          </div>
        )}

        <Separator className="my-3" />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {experience.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{experience.rating.toFixed(1)}</span>
              </div>
            )}
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              {experience.min_participants}
              {experience.max_participants && `-${experience.max_participants}`}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">
              R{experience.base_price}
              <span className="text-sm font-normal text-muted-foreground">/person</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Experience Type */}
      <div>
        <h4 className="font-medium mb-3">Experience Type</h4>
        <Select value={experienceType} onValueChange={setExperienceType}>
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {Object.entries(experienceTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-medium mb-3">Price Range (per person)</h4>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={5000}
          step={50}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>R{priceRange[0]}</span>
          <span>R{priceRange[1]}+</span>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h4 className="font-medium mb-3">Categories</h4>
        <div className="space-y-2">
          {experienceCategories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
              />
              <label htmlFor={`cat-${category}`} className="text-sm cursor-pointer">
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <h4 className="font-medium mb-3">Duration</h4>
        <div className="space-y-2">
          {[
            { label: 'Under 1 hour', value: '60' },
            { label: '1-3 hours', value: '180' },
            { label: '3-6 hours', value: '360' },
            { label: 'Full day', value: '480' },
          ].map((duration) => (
            <div key={duration.value} className="flex items-center space-x-2">
              <Checkbox id={`dur-${duration.value}`} />
              <label htmlFor={`dur-${duration.value}`} className="text-sm cursor-pointer">
                {duration.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setExperienceType('');
          setPriceRange([0, 5000]);
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
      <section className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Find Unique Experiences</h1>
          <p className="text-lg opacity-90 mb-8">
            Tours, activities, classes, and unforgettable adventures
          </p>

          {/* Search Form */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Where?"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Type
                </label>
                <Select value={experienceType} onValueChange={setExperienceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All experiences" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All experiences</SelectItem>
                    {Object.entries(experienceTypeLabels).map(([value, label]) => (
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
          </Card>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {experienceCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => toggleCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
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
                {isLoading ? 'Searching...' : `${experiences.length} experiences found`}
              </h2>
              <Select defaultValue="recommended">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Experience Grid */}
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
            ) : experiences.length === 0 ? (
              <Card className="p-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No experiences found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters to discover more.
                </p>
                <Button variant="outline" onClick={() => {
                  setCity('');
                  setExperienceType('');
                  setPriceRange([0, 5000]);
                  setSelectedCategories([]);
                }}>
                  Clear All Filters
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {experiences.map((experience) => (
                  <ExperienceCard key={experience.id} experience={experience} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
