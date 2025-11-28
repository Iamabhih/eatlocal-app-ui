import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Star,
  Clock,
  Users,
  ChevronLeft,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Share2,
  Heart,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useExperience,
  useCreateExperienceBooking,
  experienceTypeLabels,
  formatDuration,
  calculateExperienceBookingTotal,
} from '@/hooks/useVenues';
import { useAuth } from '@/contexts/AuthContext';

export default function ExperienceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  // Booking form state
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [numAdults, setNumAdults] = useState(2);
  const [numChildren, setNumChildren] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const { data: experience, isLoading } = useExperience(id || '');
  const createBooking = useCreateExperienceBooking();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading experience...</p>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Experience Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The experience you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate('/experiences')}>Browse Experiences</Button>
        </Card>
      </div>
    );
  }

  const allImages = [
    experience.main_image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    ...experience.gallery_images,
  ];

  const totals = calculateExperienceBookingTotal(
    experience.base_price,
    numAdults,
    numChildren,
    experience.child_price,
    isPrivate,
    experience.private_price_multiplier
  );

  const handleBooking = async () => {
    if (!bookingDate || !startTime || !guestName || !guestEmail) {
      return;
    }

    await createBooking.mutateAsync({
      experience_id: experience.id,
      customer_name: guestName,
      customer_email: guestEmail,
      customer_phone: guestPhone || undefined,
      booking_date: bookingDate,
      start_time: startTime,
      num_adults: numAdults,
      num_children: numChildren,
      is_private: isPrivate,
      unit_price: experience.base_price,
      adult_total: totals.adultTotal,
      child_total: totals.childTotal,
      subtotal: totals.subtotal,
      taxes: totals.taxes,
      fees: totals.fees,
      total: totals.total,
      special_requests: specialRequests || undefined,
    });

    setShowBookingDialog(false);
    navigate('/orders');
  };

  const minBookingDate = new Date();
  if (experience.min_advance_hours > 0) {
    minBookingDate.setHours(minBookingDate.getHours() + experience.min_advance_hours);
  }

  const maxBookingDate = new Date();
  maxBookingDate.setDate(maxBookingDate.getDate() + experience.max_advance_days);

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
              <Link to="/experiences" className="hover:text-primary">
                Experiences
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{experience.name}</span>
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
              alt={experience.name}
              className="w-full h-[400px] object-cover rounded-lg"
            />
            {experience.is_featured && (
              <Badge className="absolute top-4 left-4 bg-primary">Featured</Badge>
            )}
            {experience.instant_confirmation && (
              <Badge variant="secondary" className="absolute top-4 right-4">
                Instant Confirmation
              </Badge>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="grid grid-cols-2 gap-4">
              {allImages.slice(1, 5).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${experience.name} ${index + 2}`}
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
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">
                  {experienceTypeLabels[experience.experience_type]}
                </Badge>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(experience.duration_minutes)}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{experience.name}</h1>

              {experience.venue && (
                <Link
                  to={`/venues/${experience.venue.id}`}
                  className="flex items-center text-muted-foreground hover:text-primary"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  {experience.venue.name} - {experience.venue.city}
                </Link>
              )}

              <div className="flex items-center gap-4 mt-2">
                {experience.rating > 0 && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-medium">{experience.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground ml-1">
                      ({experience.total_reviews} reviews)
                    </span>
                  </div>
                )}
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  {experience.min_participants}
                  {experience.max_participants && `-${experience.max_participants}`} participants
                </div>
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
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About this Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {experience.description || experience.short_description}
                </p>
              </CardContent>
            </Card>

            {/* Highlights */}
            {experience.highlights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Highlights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {experience.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* What's Included / Not Included */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {experience.includes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">What's Included</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {experience.includes.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {experience.excludes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Not Included</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {experience.excludes.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Requirements */}
            {experience.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {experience.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <span className="text-sm">{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - Booking */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Book this Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold">
                    R{experience.base_price}
                    <span className="text-sm font-normal text-muted-foreground">/person</span>
                  </p>
                  {experience.child_price && (
                    <p className="text-sm text-muted-foreground">
                      Children: R{experience.child_price}
                    </p>
                  )}
                </div>

                {/* Quick Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{formatDuration(experience.duration_minutes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Group Size</span>
                    <span>
                      {experience.min_participants}-{experience.max_participants || '∞'}
                    </span>
                  </div>
                  {experience.is_private_available && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Private Available</span>
                      <span className="text-green-600">Yes ({experience.private_price_multiplier}x)</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Booking Notice */}
                {experience.advance_booking_required && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Advance booking required
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      Book at least {experience.min_advance_hours} hours ahead
                    </p>
                  </div>
                )}

                {/* Cancellation Policy */}
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Cancellation Policy</p>
                  <p>
                    Free cancellation up to {experience.cancellation_hours} hours before start time
                  </p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowBookingDialog(true)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Check Availability
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Book: {experience.name}</DialogTitle>
            <DialogDescription>
              Fill in the details to complete your booking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="booking-date">Date</Label>
                <Input
                  id="booking-date"
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={minBookingDate.toISOString().split('T')[0]}
                  max={maxBookingDate.toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-time">Time</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'].map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Participants */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Adults</Label>
                <Select value={String(numAdults)} onValueChange={(v) => setNumAdults(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} Adult{n > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Children</Label>
                <Select value={String(numChildren)} onValueChange={(v) => setNumChildren(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} Child{n !== 1 ? 'ren' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Private Option */}
            {experience.is_private_available && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="private">Book as private experience ({experience.private_price_multiplier}x price)</Label>
              </div>
            )}

            <Separator />

            {/* Guest Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guest-name">Full Name *</Label>
                <Input
                  id="guest-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest-email">Email *</Label>
                <Input
                  id="guest-email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest-phone">Phone</Label>
                <Input
                  id="guest-phone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+27 XX XXX XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="special-requests">Special Requests</Label>
                <Textarea
                  id="special-requests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any dietary requirements or special needs?"
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Price Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{numAdults} Adult{numAdults > 1 ? 's' : ''} × R{experience.base_price}</span>
                <span>R{totals.adultTotal.toFixed(2)}</span>
              </div>
              {numChildren > 0 && (
                <div className="flex justify-between">
                  <span>{numChildren} Child{numChildren > 1 ? 'ren' : ''} × R{experience.child_price || experience.base_price * 0.5}</span>
                  <span>R{totals.childTotal.toFixed(2)}</span>
                </div>
              )}
              {isPrivate && (
                <div className="flex justify-between text-orange-600">
                  <span>Private experience ({experience.private_price_multiplier}x)</span>
                  <span>Included above</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>VAT (15%)</span>
                <span>R{totals.taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Service Fee</span>
                <span>R{totals.fees.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>R{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBooking}
              disabled={!bookingDate || !startTime || !guestName || !guestEmail || createBooking.isPending}
            >
              {createBooking.isPending ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
