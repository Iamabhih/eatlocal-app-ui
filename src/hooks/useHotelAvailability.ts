import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  description: string | null;
  max_guests: number;
  beds_description: string | null;
  room_size_sqm: number | null;
  base_price: number;
  weekend_price: number | null;
  total_rooms: number;
  amenities: string[];
  images: string[];
  is_active: boolean;
}

export interface RoomAvailability {
  id: string;
  room_type_id: string;
  date: string;
  available_rooms: number;
  price_override: number | null;
  is_blocked: boolean;
}

export interface DayAvailability {
  date: string;
  available: number;
  booked: number;
  total: number;
  price: number;
  isBlocked: boolean;
  hasOverride: boolean;
}

export interface Hotel {
  id: string;
  name: string;
  description: string | null;
  street_address: string;
  city: string;
  star_rating: number | null;
  base_price: number | null;
  check_in_time: string;
  check_out_time: string;
  main_image: string | null;
  amenities: string[];
}

/**
 * Hook to fetch hotels owned by current user
 */
export function useMyHotels() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-hotels', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('owner_id', user.id)
        .order('name');

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return (data || []) as Hotel[];
    },
    enabled: !!user,
  });
}

/**
 * Hook to fetch room types for a hotel
 */
export function useRoomTypes(hotelId: string | undefined) {
  return useQuery({
    queryKey: ['room-types', hotelId],
    queryFn: async () => {
      if (!hotelId) return [];

      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('is_active', true)
        .order('base_price');

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return (data || []) as RoomType[];
    },
    enabled: !!hotelId,
  });
}

/**
 * Hook to get availability calendar for a room type
 */
export function useRoomAvailabilityCalendar(
  roomTypeId: string | undefined,
  startDate: Date,
  endDate: Date
) {
  return useQuery({
    queryKey: ['room-availability', roomTypeId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<DayAvailability[]> => {
      if (!roomTypeId) return [];

      // Get room type details
      const { data: roomType, error: roomTypeError } = await supabase
        .from('room_types')
        .select('total_rooms, base_price, weekend_price')
        .eq('id', roomTypeId)
        .single();

      if (roomTypeError) throw roomTypeError;

      // Get availability overrides
      const { data: availabilityData, error: availError } = await supabase
        .from('room_availability')
        .select('*')
        .eq('room_type_id', roomTypeId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (availError && availError.code !== '42P01') throw availError;

      // Get bookings in this range
      const { data: bookings, error: bookingsError } = await supabase
        .from('hotel_bookings')
        .select('check_in_date, check_out_date, num_rooms')
        .eq('room_type_id', roomTypeId)
        .not('status', 'in', '("cancelled","no_show")')
        .lte('check_in_date', endDate.toISOString().split('T')[0])
        .gte('check_out_date', startDate.toISOString().split('T')[0]);

      if (bookingsError && bookingsError.code !== '42P01') throw bookingsError;

      // Build availability map
      const availabilityMap = new Map(
        (availabilityData || []).map((a) => [a.date, a])
      );

      // Build calendar
      const calendar: DayAvailability[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

        const override = availabilityMap.get(dateStr);

        // Calculate booked rooms for this date
        let booked = 0;
        (bookings || []).forEach((booking) => {
          const checkIn = new Date(booking.check_in_date);
          const checkOut = new Date(booking.check_out_date);
          if (currentDate >= checkIn && currentDate < checkOut) {
            booked += booking.num_rooms;
          }
        });

        // Calculate availability
        const totalRooms = override?.available_rooms ?? roomType.total_rooms;
        const available = Math.max(0, totalRooms - booked);

        // Calculate price
        let price = roomType.base_price;
        if (override?.price_override) {
          price = override.price_override;
        } else if (isWeekend && roomType.weekend_price) {
          price = roomType.weekend_price;
        }

        calendar.push({
          date: dateStr,
          available,
          booked,
          total: roomType.total_rooms,
          price,
          isBlocked: override?.is_blocked ?? false,
          hasOverride: !!override?.price_override,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return calendar;
    },
    enabled: !!roomTypeId,
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Hook to check availability for specific dates
 */
export function useCheckAvailability() {
  return useMutation({
    mutationFn: async ({
      roomTypeId,
      checkIn,
      checkOut,
      numRooms = 1,
    }: {
      roomTypeId: string;
      checkIn: Date;
      checkOut: Date;
      numRooms?: number;
    }): Promise<{
      available: boolean;
      totalPrice: number;
      nights: number;
      priceBreakdown: { date: string; price: number }[];
    }> => {
      const checkInStr = checkIn.toISOString().split('T')[0];
      const checkOutStr = checkOut.toISOString().split('T')[0];

      // Get room type
      const { data: roomType, error: roomTypeError } = await supabase
        .from('room_types')
        .select('total_rooms, base_price, weekend_price')
        .eq('id', roomTypeId)
        .single();

      if (roomTypeError) throw roomTypeError;

      // Get availability overrides
      const { data: availabilityData } = await supabase
        .from('room_availability')
        .select('*')
        .eq('room_type_id', roomTypeId)
        .gte('date', checkInStr)
        .lt('date', checkOutStr);

      // Get existing bookings
      const { data: bookings } = await supabase
        .from('hotel_bookings')
        .select('check_in_date, check_out_date, num_rooms')
        .eq('room_type_id', roomTypeId)
        .not('status', 'in', '("cancelled","no_show")')
        .lte('check_in_date', checkOutStr)
        .gte('check_out_date', checkInStr);

      const availabilityMap = new Map(
        (availabilityData || []).map((a) => [a.date, a])
      );

      let available = true;
      let totalPrice = 0;
      const priceBreakdown: { date: string; price: number }[] = [];

      const currentDate = new Date(checkIn);
      const endDate = new Date(checkOut);

      while (currentDate < endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

        const override = availabilityMap.get(dateStr);

        // Check if blocked
        if (override?.is_blocked) {
          available = false;
          break;
        }

        // Calculate booked rooms
        let booked = 0;
        (bookings || []).forEach((booking) => {
          const bookingCheckIn = new Date(booking.check_in_date);
          const bookingCheckOut = new Date(booking.check_out_date);
          if (currentDate >= bookingCheckIn && currentDate < bookingCheckOut) {
            booked += booking.num_rooms;
          }
        });

        const totalRooms = override?.available_rooms ?? roomType.total_rooms;
        if (totalRooms - booked < numRooms) {
          available = false;
          break;
        }

        // Calculate price
        let price = roomType.base_price;
        if (override?.price_override) {
          price = override.price_override;
        } else if (isWeekend && roomType.weekend_price) {
          price = roomType.weekend_price;
        }

        totalPrice += price * numRooms;
        priceBreakdown.push({ date: dateStr, price: price * numRooms });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      return { available, totalPrice, nights, priceBreakdown };
    },
  });
}

/**
 * Hook to update room availability (for hotel owners)
 */
export function useUpdateAvailability() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomTypeId,
      date,
      availableRooms,
      priceOverride,
      isBlocked,
    }: {
      roomTypeId: string;
      date: string;
      availableRooms?: number;
      priceOverride?: number | null;
      isBlocked?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Upsert availability
      const { data, error } = await supabase
        .from('room_availability')
        .upsert(
          {
            room_type_id: roomTypeId,
            date,
            available_rooms: availableRooms,
            price_override: priceOverride,
            is_blocked: isBlocked,
          },
          { onConflict: 'room_type_id,date' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['room-availability', variables.roomTypeId],
      });
      toast({
        title: 'Availability Updated',
        description: 'Room availability has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'Could not update room availability.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to bulk update availability for date range
 */
export function useBulkUpdateAvailability() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomTypeId,
      startDate,
      endDate,
      availableRooms,
      priceOverride,
      isBlocked,
      daysOfWeek,
    }: {
      roomTypeId: string;
      startDate: Date;
      endDate: Date;
      availableRooms?: number;
      priceOverride?: number | null;
      isBlocked?: boolean;
      daysOfWeek?: number[]; // 0-6 for specific days only
    }) => {
      if (!user) throw new Error('Not authenticated');

      const updates: {
        room_type_id: string;
        date: string;
        available_rooms?: number;
        price_override?: number | null;
        is_blocked?: boolean;
      }[] = [];

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();

        // Skip if daysOfWeek is specified and current day not included
        if (!daysOfWeek || daysOfWeek.includes(dayOfWeek)) {
          updates.push({
            room_type_id: roomTypeId,
            date: currentDate.toISOString().split('T')[0],
            ...(availableRooms !== undefined && { available_rooms: availableRooms }),
            ...(priceOverride !== undefined && { price_override: priceOverride }),
            ...(isBlocked !== undefined && { is_blocked: isBlocked }),
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (updates.length === 0) return [];

      const { data, error } = await supabase
        .from('room_availability')
        .upsert(updates, { onConflict: 'room_type_id,date' })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['room-availability', variables.roomTypeId],
      });
      toast({
        title: 'Availability Updated',
        description: 'Bulk availability update completed successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'Could not complete bulk availability update.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to block dates
 */
export function useBlockDates() {
  const bulkUpdate = useBulkUpdateAvailability();

  return {
    ...bulkUpdate,
    mutate: ({
      roomTypeId,
      startDate,
      endDate,
    }: {
      roomTypeId: string;
      startDate: Date;
      endDate: Date;
    }) => {
      bulkUpdate.mutate({
        roomTypeId,
        startDate,
        endDate,
        isBlocked: true,
      });
    },
  };
}

/**
 * Hook to unblock dates
 */
export function useUnblockDates() {
  const bulkUpdate = useBulkUpdateAvailability();

  return {
    ...bulkUpdate,
    mutate: ({
      roomTypeId,
      startDate,
      endDate,
    }: {
      roomTypeId: string;
      startDate: Date;
      endDate: Date;
    }) => {
      bulkUpdate.mutate({
        roomTypeId,
        startDate,
        endDate,
        isBlocked: false,
      });
    },
  };
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get date range for a month
 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
