import { useState, useMemo } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ScheduledOrderSelectorProps {
  restaurantOpeningTime?: string; // Format: "HH:MM:SS"
  restaurantClosingTime?: string; // Format: "HH:MM:SS"
  onScheduleChange: (scheduledFor: Date | null) => void;
}

export function ScheduledOrderSelector({
  restaurantOpeningTime = '09:00:00',
  restaurantClosingTime = '22:00:00',
  onScheduleChange,
}: ScheduledOrderSelectorProps) {
  const [orderType, setOrderType] = useState<'now' | 'scheduled'>('now');
  const [selectedDay, setSelectedDay] = useState<string>('today');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Generate available days (today + next 6 days)
  const availableDays = useMemo(() => {
    const days: { value: string; label: string; date: Date }[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      let label = date.toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' });
      if (i === 0) label = 'Today';
      if (i === 1) label = 'Tomorrow';

      days.push({
        value: i === 0 ? 'today' : i === 1 ? 'tomorrow' : date.toISOString().split('T')[0],
        label,
        date,
      });
    }

    return days;
  }, []);

  // Generate available time slots based on restaurant hours
  const availableTimeSlots = useMemo(() => {
    const slots: { value: string; label: string }[] = [];
    const now = new Date();
    const isToday = selectedDay === 'today';

    // Parse restaurant hours
    const [openHour, openMin] = restaurantOpeningTime.split(':').map(Number);
    const [closeHour, closeMin] = restaurantClosingTime.split(':').map(Number);

    // Generate 30-minute slots
    let currentHour = openHour;
    let currentMin = openMin;

    while (currentHour < closeHour || (currentHour === closeHour && currentMin <= closeMin)) {
      const slotTime = new Date();
      slotTime.setHours(currentHour, currentMin, 0, 0);

      // If today, only show future slots (at least 30 mins from now)
      if (isToday) {
        const minTime = new Date(now.getTime() + 30 * 60 * 1000);
        if (slotTime < minTime) {
          currentMin += 30;
          if (currentMin >= 60) {
            currentMin = 0;
            currentHour++;
          }
          continue;
        }
      }

      const timeValue = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      const timeLabel = slotTime.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });

      slots.push({ value: timeValue, label: timeLabel });

      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }

    return slots;
  }, [selectedDay, restaurantOpeningTime, restaurantClosingTime]);

  // Update parent when schedule changes
  const handleScheduleChange = (type: 'now' | 'scheduled') => {
    setOrderType(type);
    if (type === 'now') {
      onScheduleChange(null);
    } else if (selectedTime) {
      updateScheduledTime(selectedDay, selectedTime);
    }
  };

  const updateScheduledTime = (day: string, time: string) => {
    if (!time) return;

    const dayData = availableDays.find(d => d.value === day);
    if (!dayData) return;

    const [hours, minutes] = time.split(':').map(Number);
    const scheduledDate = new Date(dayData.date);
    scheduledDate.setHours(hours, minutes, 0, 0);

    onScheduleChange(scheduledDate);
  };

  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    setSelectedTime(''); // Reset time when day changes
    if (orderType === 'scheduled') {
      onScheduleChange(null); // Wait for time selection
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (orderType === 'scheduled') {
      updateScheduledTime(selectedDay, time);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">When do you want your order?</Label>

      <RadioGroup
        value={orderType}
        onValueChange={(value) => handleScheduleChange(value as 'now' | 'scheduled')}
        className="grid grid-cols-2 gap-4"
      >
        <Card
          className={cn(
            'p-4 cursor-pointer transition-all',
            orderType === 'now'
              ? 'border-primary bg-primary/5 ring-2 ring-primary'
              : 'hover:border-primary/50'
          )}
          onClick={() => handleScheduleChange('now')}
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value="now" id="order-now" />
            <div>
              <Label htmlFor="order-now" className="cursor-pointer font-medium">
                <Clock className="inline h-4 w-4 mr-1" />
                Order Now
              </Label>
              <p className="text-sm text-muted-foreground">
                ASAP delivery (30-45 min)
              </p>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            'p-4 cursor-pointer transition-all',
            orderType === 'scheduled'
              ? 'border-primary bg-primary/5 ring-2 ring-primary'
              : 'hover:border-primary/50'
          )}
          onClick={() => handleScheduleChange('scheduled')}
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value="scheduled" id="order-scheduled" />
            <div>
              <Label htmlFor="order-scheduled" className="cursor-pointer font-medium">
                <CalendarDays className="inline h-4 w-4 mr-1" />
                Schedule
              </Label>
              <p className="text-sm text-muted-foreground">
                Choose a time
              </p>
            </div>
          </div>
        </Card>
      </RadioGroup>

      {/* Schedule Selectors */}
      {orderType === 'scheduled' && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <Label>Select Day</Label>
            <Select value={selectedDay} onValueChange={handleDayChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose day" />
              </SelectTrigger>
              <SelectContent>
                {availableDays.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Time</Label>
            <Select value={selectedTime} onValueChange={handleTimeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose time" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {availableTimeSlots.length > 0 ? (
                  availableTimeSlots.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No available slots
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedTime && (
            <div className="col-span-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm">
                <CalendarDays className="inline h-4 w-4 mr-1" />
                Your order will be delivered on{' '}
                <span className="font-semibold">
                  {availableDays.find(d => d.value === selectedDay)?.label}
                </span>
                {' '}at{' '}
                <span className="font-semibold">{selectedTime}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
