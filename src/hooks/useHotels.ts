import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Hotel {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  slug: string | null;
  street_address: string;
  city: string;
  state: string | null;
  country: string;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  star_rating: number | null;
  property_type: 'hotel' | 'guesthouse' | 'bnb' | 'lodge' | 'resort' | 'apartment' | 'hostel';
  amenities: string[];
  main_image: string | null;
  gallery_images: string[];
  check_in_time: string;
  check_out_time: string;
  cancellation_policy: string;
  house_rules: string | null;
  base_price: number | null;
  currency: string;
  is_active: boolean;
  is_featured: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  total_rooms: number;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

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

export interface HotelBooking {
  id: string;
  booking_number: string;
  hotel_id: string;
  room_type_id: string;
  guest_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  num_rooms: number;
  nightly_rate: number;
  num_nights: number;
  subtotal: number;
  taxes: number;
  fees: number;
  discount: number;
  total: number;
  currency: string;
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded' | 'failed';
  payment_method: string | null;
  payment_reference: string | null;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  special_requests: string | null;
  created_at: string;
  hotel?: Hotel;
  room_type?: RoomType;
}

export interface HotelSearchParams {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  minRating?: number;
}

// Hook to search hotels
export function useHotelSearch(params: HotelSearchParams) {
  return useQuery({
    queryKey: ['hotels', 'search', params],
    queryFn: async () => {
      let query = (supabase
        .from('hotels' as any)
        .select('*')
        .eq('is_active', true)
        .eq('verification_status', 'verified') as any);

      if (params.city) {
        query = query.ilike('city', `%${params.city}%`);
      }

      if (params.propertyType) {
        query = query.eq('property_type', params.propertyType);
      }

      if (params.minPrice) {
        query = query.gte('base_price', params.minPrice);
      }

      if (params.maxPrice) {
        query = query.lte('base_price', params.maxPrice);
      }

      if (params.minRating) {
        query = query.gte('rating', params.minRating);
      }

      if (params.amenities && params.amenities.length > 0) {
        query = query.contains('amenities', params.amenities);
      }

      const { data, error } = await query.order('is_featured', { ascending: false }).order('rating', { ascending: false });

      if (error) throw error;
      return (data || []) as Hotel[];
    },
  });
}

// Hook to get featured hotels
export function useFeaturedHotels(limit = 6) {
  return useQuery({
    queryKey: ['hotels', 'featured', limit],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('hotels' as any)
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('rating', { ascending: false })
        .limit(limit) as any);

      if (error) throw error;
      return (data || []) as Hotel[];
    },
  });
}

// Hook to get hotel by ID
export function useHotel(hotelId: string) {
  return useQuery({
    queryKey: ['hotel', hotelId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('hotels' as any)
        .select('*')
        .eq('id', hotelId)
        .single() as any);

      if (error) throw error;
      return data as Hotel;
    },
    enabled: !!hotelId,
  });
}

// Hook to get room types for a hotel
export function useHotelRoomTypes(hotelId: string) {
  return useQuery({
    queryKey: ['hotel-rooms', hotelId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('room_types' as any)
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('is_active', true)
        .order('base_price', { ascending: true }) as any);

      if (error) throw error;
      return (data || []) as RoomType[];
    },
    enabled: !!hotelId,
  });
}

// Hook to check room availability
export function useCheckAvailability(
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  numRooms = 1
) {
  return useQuery({
    queryKey: ['room-availability', roomTypeId, checkIn, checkOut, numRooms],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('check_room_availability', {
        p_room_type_id: roomTypeId,
        p_check_in: checkIn,
        p_check_out: checkOut,
        p_num_rooms: numRooms,
      });

      if (error) throw error;
      return data as boolean;
    },
    enabled: !!roomTypeId && !!checkIn && !!checkOut,
  });
}

// Hook to create a booking
export function useCreateHotelBooking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: {
      hotel_id: string;
      room_type_id: string;
      guest_name: string;
      guest_email: string;
      guest_phone?: string;
      check_in_date: string;
      check_out_date: string;
      num_guests: number;
      num_rooms: number;
      nightly_rate: number;
      num_nights: number;
      subtotal: number;
      taxes: number;
      fees: number;
      total: number;
      special_requests?: string;
    }) => {
      const { data, error } = await (supabase
        .from('hotel_bookings' as any)
        .insert({
          ...booking,
          guest_id: user?.id,
          status: 'pending',
          payment_status: 'pending',
        })
        .select()
        .single() as any);

      if (error) throw error;
      return data as HotelBooking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-hotel-bookings'] });
      toast({
        title: 'Booking Created',
        description: 'Your reservation has been submitted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Booking Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to get user's hotel bookings
export function useMyHotelBookings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-hotel-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase
        .from('hotel_bookings' as any)
        .select(`
          *,
          hotel:hotels(*),
          room_type:room_types(*)
        `)
        .eq('guest_id', user.id)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as HotelBooking[];
    },
    enabled: !!user,
  });
}

// Hook to cancel a booking
export function useCancelHotelBooking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      const { data, error } = await (supabase
        .from('hotel_bookings' as any)
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', bookingId)
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-hotel-bookings'] });
      toast({
        title: 'Booking Cancelled',
        description: 'Your reservation has been cancelled.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Calculate booking totals
export function calculateBookingTotal(
  nightlyRate: number,
  numNights: number,
  numRooms: number,
  taxRate = 0.15 // 15% VAT
): { subtotal: number; taxes: number; fees: number; total: number } {
  const subtotal = nightlyRate * numNights * numRooms;
  const taxes = subtotal * taxRate;
  const fees = 50; // Service fee
  const total = subtotal + taxes + fees;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxes: Math.round(taxes * 100) / 100,
    fees,
    total: Math.round(total * 100) / 100,
  };
}

// Get number of nights between dates
export function getNumNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Property type labels
export const propertyTypeLabels: Record<string, string> = {
  hotel: 'Hotel',
  guesthouse: 'Guesthouse',
  bnb: 'B&B',
  lodge: 'Lodge',
  resort: 'Resort',
  apartment: 'Apartment',
  hostel: 'Hostel',
};

// Common amenities list
export const commonAmenities = [
  'Free WiFi',
  'Parking',
  'Swimming Pool',
  'Gym',
  'Restaurant',
  'Room Service',
  'Spa',
  'Air Conditioning',
  'TV',
  'Breakfast Included',
  'Airport Shuttle',
  '24/7 Front Desk',
  'Pet Friendly',
  'Laundry Service',
];