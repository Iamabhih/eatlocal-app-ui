import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Ban,
  Check,
  Edit2,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  useRoomAvailabilityCalendar,
  useUpdateAvailability,
  useBulkUpdateAvailability,
  DayAvailability,
  formatPrice,
  getMonthRange,
} from '@/hooks/useHotelAvailability';
import { cn } from '@/lib/utils';

interface AvailabilityCalendarProps {
  roomTypeId: string;
  roomTypeName: string;
  basePrice: number;
  totalRooms: number;
  readOnly?: boolean;
  onSelectDates?: (dates: { checkIn: Date; checkOut: Date }) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function AvailabilityCalendar({
  roomTypeId,
  roomTypeName,
  basePrice,
  totalRooms,
  readOnly = false,
  onSelectDates,
}: AvailabilityCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<DayAvailability | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // For guest date selection
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);

  // Edit form state
  const [editPrice, setEditPrice] = useState('');
  const [editRooms, setEditRooms] = useState('');
  const [editBlocked, setEditBlocked] = useState(false);

  // Bulk edit state
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkRooms, setBulkRooms] = useState('');
  const [bulkBlocked, setBulkBlocked] = useState(false);
  const [bulkDays, setBulkDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const { start, end } = getMonthRange(currentYear, currentMonth);
  const { data: availability = [], isLoading } = useRoomAvailabilityCalendar(
    roomTypeId,
    start,
    end
  );

  const updateAvailability = useUpdateAvailability();
  const bulkUpdateAvailability = useBulkUpdateAvailability();

  // Create calendar grid
  const calendarGrid = useMemo(() => {
    const grid: (DayAvailability | null)[][] = [];
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const availMap = new Map(availability.map((a) => [a.date, a]));

    let week: (DayAvailability | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      week.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = availMap.get(dateStr);

      week.push(
        dayData || {
          date: dateStr,
          available: totalRooms,
          booked: 0,
          total: totalRooms,
          price: basePrice,
          isBlocked: false,
          hasOverride: false,
        }
      );

      if (week.length === 7) {
        grid.push(week);
        week = [];
      }
    }

    // Add remaining empty cells
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      grid.push(week);
    }

    return grid;
  }, [currentYear, currentMonth, availability, totalRooms, basePrice]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = (day: DayAvailability) => {
    const dayDate = new Date(day.date);

    if (readOnly && onSelectDates) {
      // Guest date selection mode
      if (!checkInDate || (checkInDate && checkOutDate)) {
        setCheckInDate(dayDate);
        setCheckOutDate(null);
      } else if (dayDate > checkInDate) {
        setCheckOutDate(dayDate);
        onSelectDates({ checkIn: checkInDate, checkOut: dayDate });
      } else {
        setCheckInDate(dayDate);
        setCheckOutDate(null);
      }
    } else if (!readOnly) {
      // Owner edit mode
      setSelectedDate(day);
      setEditPrice(String(day.price));
      setEditRooms(String(day.total));
      setEditBlocked(day.isBlocked);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveDay = () => {
    if (!selectedDate) return;

    updateAvailability.mutate({
      roomTypeId,
      date: selectedDate.date,
      availableRooms: parseInt(editRooms) || totalRooms,
      priceOverride: parseFloat(editPrice) !== basePrice ? parseFloat(editPrice) : null,
      isBlocked: editBlocked,
    });

    setIsEditModalOpen(false);
  };

  const handleBulkSave = () => {
    if (!bulkStartDate || !bulkEndDate) return;

    bulkUpdateAvailability.mutate({
      roomTypeId,
      startDate: new Date(bulkStartDate),
      endDate: new Date(bulkEndDate),
      ...(bulkRooms && { availableRooms: parseInt(bulkRooms) }),
      ...(bulkPrice && { priceOverride: parseFloat(bulkPrice) }),
      isBlocked: bulkBlocked,
      daysOfWeek: bulkDays,
    });

    setIsBulkModalOpen(false);
  };

  const getDayClasses = (day: DayAvailability) => {
    const dayDate = new Date(day.date);
    const isPast = dayDate < new Date(today.toDateString());
    const isSelected =
      (checkInDate && dayDate.getTime() === checkInDate.getTime()) ||
      (checkOutDate && dayDate.getTime() === checkOutDate.getTime());
    const isInRange =
      checkInDate && checkOutDate && dayDate > checkInDate && dayDate < checkOutDate;

    return cn(
      'relative h-20 p-1 border rounded-lg cursor-pointer transition-all',
      isPast && 'opacity-50 cursor-not-allowed',
      day.isBlocked && 'bg-red-50 border-red-200',
      day.available === 0 && !day.isBlocked && 'bg-yellow-50 border-yellow-200',
      day.available > 0 && !day.isBlocked && 'bg-green-50 border-green-200 hover:border-green-400',
      isSelected && 'ring-2 ring-primary',
      isInRange && 'bg-primary/10',
      day.hasOverride && 'border-blue-400 border-2'
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {roomTypeName} Availability
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Base: {formatPrice(basePrice)} • {totalRooms} total rooms
            </p>
          </div>
          {!readOnly && (
            <Button variant="outline" onClick={() => setIsBulkModalOpen(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Bulk Edit
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="text-lg font-semibold">
            {MONTHS[currentMonth]} {currentYear}
          </h3>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-200 border border-green-300" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-200 border border-yellow-300" />
            <span>Sold Out</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-200 border border-red-300" />
            <span>Blocked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-blue-400" />
            <span>Price Override</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border rounded-lg overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 bg-muted">
            {WEEKDAYS.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          {calendarGrid.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-t">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={cn('min-h-20 p-1', !day && 'bg-muted/30')}
                >
                  {day && (
                    <div
                      className={getDayClasses(day)}
                      onClick={() => handleDayClick(day)}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium">
                          {new Date(day.date).getDate()}
                        </span>
                        {day.isBlocked && (
                          <Ban className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                      <div className="mt-1">
                        <p className="text-xs font-semibold text-primary">
                          {formatPrice(day.price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {day.available}/{day.total} left
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Selected Date Range (for guests) */}
        {readOnly && checkInDate && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Check-in:</strong> {checkInDate.toLocaleDateString('en-ZA')}
              {checkOutDate && (
                <>
                  {' '}<strong>Check-out:</strong> {checkOutDate.toLocaleDateString('en-ZA')}
                </>
              )}
            </p>
          </div>
        )}
      </CardContent>

      {/* Single Day Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit {selectedDate?.date && new Date(selectedDate.date).toLocaleDateString('en-ZA', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </DialogTitle>
            <DialogDescription>
              Update availability, pricing, or block this date.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price per night (R)</Label>
              <Input
                id="price"
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder={String(basePrice)}
              />
              <p className="text-xs text-muted-foreground">
                Base price: {formatPrice(basePrice)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rooms">Available rooms</Label>
              <Input
                id="rooms"
                type="number"
                min="0"
                max={totalRooms}
                value={editRooms}
                onChange={(e) => setEditRooms(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Currently {selectedDate?.booked || 0} booked
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="blocked">Block this date</Label>
              <Switch
                id="blocked"
                checked={editBlocked}
                onCheckedChange={setEditBlocked}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDay} disabled={updateAvailability.isPending}>
              {updateAvailability.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Modal */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Edit Availability</DialogTitle>
            <DialogDescription>
              Update multiple dates at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-start">Start Date</Label>
                <Input
                  id="bulk-start"
                  type="date"
                  value={bulkStartDate}
                  onChange={(e) => setBulkStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-end">End Date</Label>
                <Input
                  id="bulk-end"
                  type="date"
                  value={bulkEndDate}
                  onChange={(e) => setBulkEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Apply to days</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day, index) => (
                  <Badge
                    key={day}
                    variant={bulkDays.includes(index) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      if (bulkDays.includes(index)) {
                        setBulkDays(bulkDays.filter((d) => d !== index));
                      } else {
                        setBulkDays([...bulkDays, index]);
                      }
                    }}
                  >
                    {day}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-price">Price override (R)</Label>
              <Input
                id="bulk-price"
                type="number"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                placeholder="Leave empty to keep current"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-rooms">Available rooms</Label>
              <Input
                id="bulk-rooms"
                type="number"
                min="0"
                max={totalRooms}
                value={bulkRooms}
                onChange={(e) => setBulkRooms(e.target.value)}
                placeholder="Leave empty to keep current"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="bulk-blocked">Block dates</Label>
              <Switch
                id="bulk-blocked"
                checked={bulkBlocked}
                onCheckedChange={setBulkBlocked}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkSave}
              disabled={bulkUpdateAvailability.isPending || !bulkStartDate || !bulkEndDate}
            >
              {bulkUpdateAvailability.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default AvailabilityCalendar;
