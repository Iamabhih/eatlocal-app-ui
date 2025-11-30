import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Users,
  Bed,
  Wifi,
  Car,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useHotel,
  useHotelRoomTypes,
  useCreateHotelBooking,
  calculateBookingTotal,
  getNumNights,
  propertyTypeLabels,
  RoomType,
} from '@/hooks/useHotels';
import { useAuth } from '@/contexts/AuthContext';

export default function HotelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const { data: hotel, isLoading: hotelLoading } = useHotel(id!);
  const { data: roomTypes = [], isLoading: roomsLoading } = useHotelRoomTypes(id!);

  // Booking state
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 2);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    specialRequests: '',
  });

  const createBooking = useCreateHotelBooking();

  // Gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const allImages = hotel
    ? [hotel.main_image, ...(hotel.gallery_images || [])].filter(Boolean)
    : [];

  const numNights = checkIn && checkOut ? getNumNights(checkIn, checkOut) : 0;

  const handleSelectRoom = (room: RoomType) => {
    if (!checkIn || !checkOut) {
      // Show date picker prompt
      return;
    }
    setSelectedRoom(room);
    setShowBookingDialog(true);
  };

  const handleBooking = () => {
    if (!selectedRoom || !checkIn || !checkOut || !hotel) return;

    const totals = calculateBookingTotal(selectedRoom.base_price, numNights, 1);

    createBooking.mutate(
      {
        hotel_id: hotel.id,
        room_type_id: selectedRoom.id,
        guest_name: guestDetails.name,
        guest_email: guestDetails.email,
        guest_phone: guestDetails.phone || undefined,
        check_in_date: checkIn,
        check_out_date: checkOut,
        num_guests: guests,
        num_rooms: 1,
        nightly_rate: selectedRoom.base_price,
        num_nights: numNights,
        subtotal: totals.subtotal,
        taxes: totals.taxes,
        fees: totals.fees,
        total: totals.total,
        special_requests: guestDetails.specialRequests || undefined,
      },
      {
        onSuccess: () => {
          setShowBookingDialog(false);
          // Redirect to dashboard with success message
          navigate('/dashboard', { state: { bookingSuccess: true, message: 'Hotel booking confirmed!' } });
        },
      }
    );
  };

  if (hotelLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading hotel...</p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Hotel Not Found</h2>
          <Button onClick={() => navigate('/hotels')}>Browse Hotels</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Image Gallery */}
      <section className="relative h-[400px] md:h-[500px] bg-muted">
        {allImages.length > 0 ? (
          <>
            <img
              src={allImages[currentImageIndex] || ''}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
            {allImages.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  onClick={() =>
                    setCurrentImageIndex((i) => (i === 0 ? allImages.length - 1 : i - 1))
                  }
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  onClick={() =>
                    setCurrentImageIndex((i) => (i === allImages.length - 1 ? 0 : i + 1))
                  }
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      onClick={() => setCurrentImageIndex(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-muted-foreground">No images available</p>
          </div>
        )}
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Badge className="mb-2">{propertyTypeLabels[hotel.property_type]}</Badge>
                  <h1 className="text-3xl font-bold">{hotel.name}</h1>
                </div>
                {hotel.star_rating && (
                  <div className="flex">
                    {Array.from({ length: hotel.star_rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {hotel.street_address}, {hotel.city}
                </div>
                {hotel.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-foreground">{hotel.rating.toFixed(1)}</span>
                    <span>({hotel.total_reviews} reviews)</span>
                  </div>
                )}
              </div>

              {hotel.description && (
                <p className="text-muted-foreground">{hotel.description}</p>
              )}
            </div>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Room Types */}
            <Card>
              <CardHeader>
                <CardTitle>Available Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                {roomsLoading ? (
                  <p className="text-muted-foreground">Loading rooms...</p>
                ) : roomTypes.length === 0 ? (
                  <p className="text-muted-foreground">No rooms available</p>
                ) : (
                  <div className="space-y-4">
                    {roomTypes.map((room) => (
                      <div
                        key={room.id}
                        className="border rounded-lg p-4 flex flex-col md:flex-row gap-4"
                      >
                        {room.images[0] && (
                          <img
                            src={room.images[0]}
                            alt={room.name}
                            className="w-full md:w-48 h-32 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{room.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              Up to {room.max_guests} guests
                            </span>
                            {room.beds_description && (
                              <span className="flex items-center gap-1">
                                <Bed className="h-4 w-4" />
                                {room.beds_description}
                              </span>
                            )}
                            {room.room_size_sqm && (
                              <span>{room.room_size_sqm} m²</span>
                            )}
                          </div>
                          {room.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {room.description}
                            </p>
                          )}
                          {room.amenities.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {room.amenities.slice(0, 4).map((a) => (
                                <Badge key={a} variant="outline" className="text-xs">
                                  {a}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right md:min-w-[150px]">
                          <p className="text-2xl font-bold">
                            R{room.base_price.toFixed(0)}
                          </p>
                          <p className="text-sm text-muted-foreground">per night</p>
                          <Button
                            className="mt-2 w-full"
                            onClick={() => handleSelectRoom(room)}
                            disabled={!checkIn || !checkOut}
                          >
                            {checkIn && checkOut ? 'Select' : 'Select Dates'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Policies */}
            <Card>
              <CardHeader>
                <CardTitle>Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Check-in
                    </p>
                    <p className="text-muted-foreground">{hotel.check_in_time}</p>
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Check-out
                    </p>
                    <p className="text-muted-foreground">{hotel.check_out_time}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="font-medium mb-1">Cancellation Policy</p>
                  <p className="text-muted-foreground capitalize">{hotel.cancellation_policy}</p>
                </div>
                {hotel.house_rules && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium mb-1">House Rules</p>
                      <p className="text-muted-foreground">{hotel.house_rules}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {hotel.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${hotel.phone}`} className="hover:underline">
                      {hotel.phone}
                    </a>
                  </div>
                )}
                {hotel.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${hotel.email}`} className="hover:underline">
                      {hotel.email}
                    </a>
                  </div>
                )}
                {hotel.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <a
                      href={hotel.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {hotel.website}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Book Your Stay
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Check-in</Label>
                  <Input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label>Check-out</Label>
                  <Input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label>Guests</Label>
                  <Select value={String(guests)} onValueChange={(v) => setGuests(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} Guest{n > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {numNights > 0 && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {numNights} night{numNights > 1 ? 's' : ''} •{' '}
                      {new Date(checkIn).toLocaleDateString()} -{' '}
                      {new Date(checkOut).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Starting from</p>
                  <p className="text-3xl font-bold">
                    R{hotel.base_price?.toFixed(0) || '---'}
                    <span className="text-sm font-normal text-muted-foreground">/night</span>
                  </p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!checkIn || !checkOut}
                  onClick={() => {
                    const roomSection = document.querySelector('[data-room-section]');
                    roomSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  View Available Rooms
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Booking</DialogTitle>
            <DialogDescription>
              {selectedRoom?.name} at {hotel.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted p-3 rounded-lg text-sm">
              <div className="flex justify-between">
                <span>Check-in:</span>
                <span>{new Date(checkIn).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Check-out:</span>
                <span>{new Date(checkOut).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                <span>{numNights} night(s)</span>
                <span>R{(selectedRoom?.base_price || 0) * numNights}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="guest-name">Full Name *</Label>
                <Input
                  id="guest-name"
                  value={guestDetails.name}
                  onChange={(e) => setGuestDetails({ ...guestDetails, name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label htmlFor="guest-email">Email *</Label>
                <Input
                  id="guest-email"
                  type="email"
                  value={guestDetails.email}
                  onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="guest-phone">Phone</Label>
                <Input
                  id="guest-phone"
                  value={guestDetails.phone}
                  onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                  placeholder="+27 82 123 4567"
                />
              </div>
              <div>
                <Label htmlFor="special-requests">Special Requests</Label>
                <Textarea
                  id="special-requests"
                  value={guestDetails.specialRequests}
                  onChange={(e) =>
                    setGuestDetails({ ...guestDetails, specialRequests: e.target.value })
                  }
                  placeholder="Any special requirements..."
                  rows={3}
                />
              </div>
            </div>

            {selectedRoom && (
              <div className="border-t pt-4 space-y-2">
                {(() => {
                  const totals = calculateBookingTotal(selectedRoom.base_price, numNights, 1);
                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>R{totals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Taxes (15% VAT)</span>
                        <span>R{totals.taxes.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Service Fee</span>
                        <span>R{totals.fees.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>R{totals.total.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBooking}
              disabled={
                createBooking.isPending ||
                !guestDetails.name ||
                !guestDetails.email
              }
            >
              {createBooking.isPending ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
