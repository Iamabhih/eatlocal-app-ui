import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import {
  Experience,
  useExperienceTimeSlots,
  useCreateExperienceBooking,
  formatDuration,
  formatTime,
} from '@/hooks/useVenueBooking';
import { cn } from '@/lib/utils';

interface ExperienceBookingFormProps {
  experience: Experience;
  onSuccess?: (bookingNumber: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ExperienceBookingForm({ experience, onSuccess }: ExperienceBookingFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'date' | 'details' | 'confirm'>('date');

  // Selection state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [numAdults, setNumAdults] = useState(1);
  const [numChildren, setNumChildren] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);

  // Customer details
  const [customerName, setCustomerName] = useState(user?.user_metadata?.full_name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const { data: timeSlots = [], isLoading: loadingSlots } = useExperienceTimeSlots(
    experience.id,
    selectedDate
  );

  const createBooking = useCreateExperienceBooking();

  // Prefill user details
  useEffect(() => {
    if (user) {
      setCustomerName(user.user_metadata?.full_name || '');
      setCustomerEmail(user.email || '');
    }
  }, [user]);

  // Calculate pricing
  const calculateTotal = () => {
    const slot = timeSlots.find((s) => s.time === selectedTime);
    let unitPrice = slot?.price || experience.base_price;
    const childPrice = experience.child_price || 0;

    if (isPrivate && experience.is_private_available) {
      unitPrice *= experience.private_price_multiplier || 1.5;
    }

    const adultTotal = unitPrice * numAdults;
    const childTotal = childPrice * numChildren;
    const subtotal = adultTotal + childTotal;

    // Group discount
    let discount = 0;
    const totalPeople = numAdults + numChildren;
    if (
      experience.group_discount_percent &&
      experience.group_discount_min_size &&
      totalPeople >= experience.group_discount_min_size
    ) {
      discount = subtotal * (experience.group_discount_percent / 100);
    }

    const taxes = (subtotal - discount) * 0.15;
    const total = subtotal - discount + taxes;

    return { unitPrice, adultTotal, childTotal, subtotal, discount, taxes, total };
  };

  const pricing = selectedTime ? calculateTotal() : null;

  // Calendar generation
  const generateCalendar = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + (experience.max_advance_days || 90));

    const minDate = new Date();
    if (experience.advance_booking_required) {
      minDate.setHours(minDate.getHours() + (experience.min_advance_hours || 24));
    }

    const days: (Date | null)[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }

    return { days, today, minDate, maxDate };
  };

  const { days, today, minDate, maxDate } = generateCalendar();

  const isDateSelectable = (date: Date | null) => {
    if (!date) return false;
    return date >= minDate && date <= maxDate;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;

    try {
      const result = await createBooking.mutateAsync({
        experienceId: experience.id,
        date: selectedDate,
        time: selectedTime,
        numAdults,
        numChildren,
        isPrivate,
        customerName,
        customerEmail,
        customerPhone,
        specialRequests,
      });

      onSuccess?.((result.booking as any).booking_number);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Book This Experience</span>
          <Badge variant="secondary">{formatDuration(experience.duration_minutes)}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Date & Time Selection */}
        {step === 'date' && (
          <>
            {/* Calendar */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear(currentYear - 1);
                    } else {
                      setCurrentMonth(currentMonth - 1);
                    }
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">
                  {new Date(currentYear, currentMonth).toLocaleDateString('en-ZA', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear(currentYear + 1);
                    } else {
                      setCurrentMonth(currentMonth + 1);
                    }
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                {days.map((date, index) => {
                  const isSelectable = isDateSelectable(date);
                  const isSelected =
                    date && selectedDate && date.getTime() === selectedDate.getTime();

                  return (
                    <button
                      key={index}
                      onClick={() => date && isSelectable && handleDateSelect(date)}
                      disabled={!isSelectable}
                      className={cn(
                        'p-2 text-sm rounded-lg transition-colors',
                        !date && 'invisible',
                        !isSelectable && 'text-muted-foreground/50 cursor-not-allowed',
                        isSelectable && 'hover:bg-muted cursor-pointer',
                        isSelected && 'bg-primary text-primary-foreground hover:bg-primary'
                      )}
                    >
                      {date?.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4" />
                  Available Times
                </Label>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : timeSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No available times for this date
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? 'default' : 'outline'}
                        className="flex-col h-auto py-3"
                        disabled={!slot.available}
                        onClick={() => handleTimeSelect(slot.time)}
                      >
                        <span className="font-medium">{formatTime(slot.time)}</span>
                        <span className="text-xs opacity-70">
                          {formatPrice(slot.price)}
                        </span>
                        {slot.spotsLeft !== null && slot.spotsLeft <= 5 && (
                          <span className="text-xs text-orange-500">
                            {slot.spotsLeft} left
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Step 2: Guest Details */}
        {step === 'details' && (
          <>
            <Button
              variant="ghost"
              className="mb-2"
              onClick={() => setStep('date')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Change date/time
            </Button>

            {/* Selected Date/Time Summary */}
            <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  {selectedDate?.toLocaleDateString('en-ZA', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{selectedTime && formatTime(selectedTime)}</span>
              </div>
            </div>

            {/* Guest Count */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adults">Adults</Label>
                <Select
                  value={String(numAdults)}
                  onValueChange={(v) => setNumAdults(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: Math.min(experience.max_participants || 20, 20) },
                      (_, i) => i + 1
                    ).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {n === 1 ? 'Adult' : 'Adults'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {experience.child_price !== null && (
                <div className="space-y-2">
                  <Label htmlFor="children">Children</Label>
                  <Select
                    value={String(numChildren)}
                    onValueChange={(v) => setNumChildren(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} {n === 1 ? 'Child' : 'Children'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Private Booking Option */}
            {experience.is_private_available && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Private Experience</Label>
                  <p className="text-sm text-muted-foreground">
                    Book exclusively for your group (+{((experience.private_price_multiplier || 1.5) - 1) * 100}%)
                  </p>
                </div>
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
              </div>
            )}

            {/* Customer Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requests">Special Requests</Label>
                <Textarea
                  id="requests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requirements or requests..."
                  rows={3}
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => setStep('confirm')}
              disabled={!customerName || !customerEmail}
            >
              Continue to Confirm
            </Button>
          </>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && pricing && (
          <>
            <Button
              variant="ghost"
              className="mb-2"
              onClick={() => setStep('details')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Edit details
            </Button>

            {/* Booking Summary */}
            <div className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <h4 className="font-semibold">{experience.name}</h4>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {selectedDate?.toLocaleDateString('en-ZA', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {selectedTime && formatTime(selectedTime)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {numAdults + numChildren} guests
                  </div>
                </div>
                {isPrivate && (
                  <Badge variant="secondary">
                    <Lock className="h-3 w-3 mr-1" />
                    Private Booking
                  </Badge>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{numAdults} × {formatPrice(pricing.unitPrice)}</span>
                  <span>{formatPrice(pricing.adultTotal)}</span>
                </div>
                {numChildren > 0 && (
                  <div className="flex justify-between">
                    <span>{numChildren} × Child {formatPrice(experience.child_price || 0)}</span>
                    <span>{formatPrice(pricing.childTotal)}</span>
                  </div>
                )}
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Group Discount</span>
                    <span>-{formatPrice(pricing.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT (15%)</span>
                  <span>{formatPrice(pricing.taxes)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(pricing.total)}</span>
                </div>
              </div>

              {/* Cancellation Policy */}
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p className="font-medium mb-1">Cancellation Policy</p>
                <p className="text-muted-foreground">
                  Free cancellation up to {experience.cancellation_hours} hours before the experience.
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {step === 'confirm' && (
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={createBooking.isPending}
          >
            {createBooking.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirm Booking - {pricing && formatPrice(pricing.total)}
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default ExperienceBookingForm;
