import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Star,
  Clock,
  Phone,
  Mail,
  Globe,
  ChevronLeft,
  Calendar,
  Users,
  DollarSign,
  Share2,
  Heart,
  Navigation,
  CheckCircle,
  Facebook,
  Instagram,
  Twitter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useVenue,
  useVenueExperiences,
  venueTypeLabels,
  experienceTypeLabels,
  formatDuration,
  Experience,
} from '@/hooks/useVenues';

export default function VenueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data: venue, isLoading: venueLoading } = useVenue(id || '');
  const { data: experiences = [] } = useVenueExperiences(id || '');

  if (venueLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading venue...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Venue Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The venue you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate('/venues')}>Browse Venues</Button>
        </Card>
      </div>
    );
  }

  const allImages = [
    venue.main_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    ...venue.gallery_images,
  ];

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const ExperienceCard = ({ experience }: { experience: Experience }) => (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all"
      onClick={() => navigate(`/experiences/${experience.id}`)}
    >
      <div className="relative">
        <img
          src={experience.main_image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
          alt={experience.name}
          className="w-full h-40 object-cover"
        />
        {experience.is_featured && (
          <Badge className="absolute top-2 left-2 bg-primary">Featured</Badge>
        )}
      </div>
      <CardContent className="p-4">
        <Badge variant="outline" className="mb-2">
          {experienceTypeLabels[experience.experience_type]}
        </Badge>
        <h4 className="font-semibold line-clamp-1">{experience.name}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {experience.short_description}
        </p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formatDuration(experience.duration_minutes)}
          </div>
          <p className="font-bold">
            R{experience.base_price}
            <span className="text-sm font-normal text-muted-foreground">/person</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <nav className="text-sm text-muted-foreground">
              <Link to="/venues" className="hover:text-primary">
                Venues
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{venue.name}</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="relative">
            <img
              src={allImages[selectedImageIndex]}
              alt={venue.name}
              className="w-full h-[400px] object-cover rounded-lg"
            />
            {venue.is_featured && (
              <Badge className="absolute top-4 left-4 bg-primary">Featured</Badge>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="grid grid-cols-2 gap-4">
              {allImages.slice(1, 5).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${venue.name} ${index + 2}`}
                  className={`w-full h-[190px] object-cover rounded-lg cursor-pointer transition-opacity ${
                    selectedImageIndex === index + 1 ? 'ring-2 ring-primary' : 'hover:opacity-80'
                  }`}
                  onClick={() => setSelectedImageIndex(index + 1)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">
                  {venueTypeLabels[venue.venue_type] || venue.venue_type}
                </Badge>
                {venue.verification_status === 'verified' && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">{venue.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {venue.area_name ? `${venue.area_name}, ` : ''}
                  {venue.city}, {venue.country}
                </div>
                {venue.rating > 0 && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-medium text-foreground">{venue.rating.toFixed(1)}</span>
                    <span className="ml-1">({venue.total_reviews} reviews)</span>
                  </div>
                )}
                {venue.price_level && (
                  <div className="flex items-center text-green-600">
                    {Array.from({ length: venue.price_level }).map((_, i) => (
                      <DollarSign key={i} className="h-4 w-4" />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Heart className="h-4 w-4" />
                Save
              </Button>
              <Button variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              {venue.latitude && venue.longitude && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`,
                      '_blank'
                    )
                  }
                >
                  <Navigation className="h-4 w-4" />
                  Get Directions
                </Button>
              )}
            </div>

            <Tabs defaultValue="about">
              <TabsList>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="experiences">
                  Experiences ({experiences.length})
                </TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6 pt-4">
                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {venue.description || 'No description available.'}
                    </p>
                  </CardContent>
                </Card>

                {/* Categories */}
                {venue.categories.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {venue.categories.map((category) => (
                          <Badge key={category} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Amenities */}
                {venue.amenities.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Amenities & Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {venue.amenities.map((amenity) => (
                          <div key={amenity} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Accessibility */}
                {venue.accessibility_features.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Accessibility</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {venue.accessibility_features.map((feature) => (
                          <Badge key={feature} variant="outline">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="experiences" className="pt-4">
                {experiences.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Experiences Yet</h3>
                    <p className="text-muted-foreground">
                      This venue hasn't listed any experiences yet.
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {experiences.map((experience) => (
                      <ExperienceCard key={experience.id} experience={experience} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="pt-4">
                <Card className="p-8 text-center">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Reviews Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Be the first to review this venue after your visit!
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Contact & Hours */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Contact & Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {venue.street_address}
                    <br />
                    {venue.city}, {venue.state} {venue.zip_code}
                    <br />
                    {venue.country}
                  </p>
                </div>

                <Separator />

                {/* Operating Hours */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hours
                  </h4>
                  {venue.is_24_hours ? (
                    <Badge variant="secondary">Open 24 Hours</Badge>
                  ) : venue.operating_hours && Object.keys(venue.operating_hours).length > 0 ? (
                    <div className="space-y-1 text-sm">
                      {daysOfWeek.map((day) => {
                        const hours = venue.operating_hours[day];
                        return (
                          <div key={day} className="flex justify-between">
                            <span className="capitalize text-muted-foreground">{day}</span>
                            <span>
                              {hours ? `${hours.open} - ${hours.close}` : 'Closed'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Hours not specified</p>
                  )}
                </div>

                <Separator />

                {/* Contact Info */}
                <div className="space-y-3">
                  {venue.phone && (
                    <a
                      href={`tel:${venue.phone}`}
                      className="flex items-center gap-2 text-sm hover:text-primary"
                    >
                      <Phone className="h-4 w-4" />
                      {venue.phone}
                    </a>
                  )}
                  {venue.email && (
                    <a
                      href={`mailto:${venue.email}`}
                      className="flex items-center gap-2 text-sm hover:text-primary"
                    >
                      <Mail className="h-4 w-4" />
                      {venue.email}
                    </a>
                  )}
                  {venue.website && (
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-primary"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>

                {/* Social Links */}
                {venue.social_links && Object.keys(venue.social_links).length > 0 && (
                  <>
                    <Separator />
                    <div className="flex gap-3">
                      {venue.social_links.facebook && (
                        <a
                          href={venue.social_links.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="icon">
                            <Facebook className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      {venue.social_links.instagram && (
                        <a
                          href={venue.social_links.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="icon">
                            <Instagram className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      {venue.social_links.twitter && (
                        <a
                          href={venue.social_links.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="icon">
                            <Twitter className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </>
                )}

                {experiences.length > 0 && (
                  <>
                    <Separator />
                    <Button className="w-full" onClick={() => navigate(`/venues/${venue.id}#experiences`)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Book an Experience
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
