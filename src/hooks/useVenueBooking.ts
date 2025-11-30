import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Venue {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  short_description: string | null;
  street_address: string;
  city: string;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  area_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  venue_type: string;
  categories: string[];
  main_image: string | null;
  gallery_images: string[];
  amenities: string[];
  operating_hours: Record<string, { open: string; close: string }>;
  is_24_hours: boolean;
  price_level: number | null;
  is_active: boolean;
  is_featured: boolean;
  rating: number;
  total_reviews: number;
}

export interface Experience {
  id: string;
  venue_id: string | null;
  host_id: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  short_description: string | null;
  highlights: string[];
  experience_type: string;
  categories: string[];
  duration_minutes: number;
  min_participants: number;
  max_participants: number | null;
  is_private_available: boolean;
  private_price_multiplier: number;
  base_price: number;
  child_price: number | null;
  group_discount_percent: number | null;
  group_discount_min_size: number | null;
  main_image: string | null;
  gallery_images: string[];
  includes: string[];
  excludes: string[];
  requirements: string[];
  advance_booking_required: boolean;
  min_advance_hours: number;
  max_advance_days: number;
  cancellation_hours: number;
  instant_confirmation: boolean;
  is_active: boolean;
  is_featured: boolean;
  rating: number;
  total_reviews: number;
  venue?: Venue;
}

export interface ExperienceSchedule {
  id: string;
  experience_id: string;
  schedule_type: 'recurring' | 'specific_date' | 'on_demand';
  day_of_week: number | null;
  start_time: string;
  end_time: string | null;
  specific_date: string | null;
  capacity_override: number | null;
  price_override: number | null;
  is_active: boolean;
}

export interface ExperienceBooking {
  id: string;
  booking_number: string;
  experience_id: string;
  schedule_id: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  booking_date: string;
  start_time: string;
  num_adults: number;
  num_children: number;
  is_private: boolean;
  unit_price: number;
  adult_total: number;
  child_total: number;
  subtotal: number;
  discount: number;
  taxes: number;
  fees: number;
  total: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded' | 'failed';
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
  special_requests: string | null;
  created_at: string;
  experience?: Experience;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  spotsLeft: number | null;
  price: number;
}

/**
 * Hook to fetch venues with optional filtering
 */
export function useVenues(filters?: {
  city?: string;
  type?: string;
  featured?: boolean;
}) {
  return useQuery({
    queryKey: ['venues', filters],
    queryFn: async () => {
      let query = (supabase
        .from('venues' as any)
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false }) as any);

      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      if (filters?.type) {
        query = query.eq('venue_type', filters.type);
      }
      if (filters?.featured) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return (data || []) as Venue[];
    },
  });
}

/**
 * Hook to fetch a single venue by ID or slug
 */
export function useVenue(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ['venue', idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

      const { data, error } = await (supabase
        .from('venues' as any)
        .select('*')
        .eq(isUuid ? 'id' : 'slug', idOrSlug)
        .eq('is_active', true)
        .single() as any);

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') return null;
        throw error;
      }

      return data as Venue;
    },
    enabled: !!idOrSlug,
  });
}

/**
 * Hook to fetch experiences with optional filtering
 */
export function useExperiences(filters?: {
  venueId?: string;
  type?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
}) {
  return useQuery({
    queryKey: ['experiences', filters],
    queryFn: async () => {
      let query = (supabase
        .from('experiences' as any)
        .select(`
          *,
          venue:venues(id, name, city, main_image)
        `)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false }) as any);

      if (filters?.venueId) {
        query = query.eq('venue_id', filters.venueId);
      }
      if (filters?.type) {
        query = query.eq('experience_type', filters.type);
      }
      if (filters?.featured) {
        query = query.eq('is_featured', true);
      }
      if (filters?.minPrice) {
        query = query.gte('base_price', filters.minPrice);
      }
      if (filters?.maxPrice) {
        query = query.lte('base_price', filters.maxPrice);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return (data || []) as Experience[];
    },
  });
}

/**
 * Hook to fetch a single experience
 */
export function useExperience(id: string | undefined) {
  return useQuery({
    queryKey: ['experience', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await (supabase
        .from('experiences' as any)
        .select(`
          *,
          venue:venues(*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single() as any);

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') return null;
        throw error;
      }

      return data as Experience;
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch available time slots for an experience on a specific date
 */
export function useExperienceTimeSlots(experienceId: string | undefined, date: Date | null) {
  return useQuery({
    queryKey: ['experience-slots', experienceId, date?.toISOString()],
    queryFn: async (): Promise<TimeSlot[]> => {
      if (!experienceId || !date) return [];

      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      // Get experience details
      const { data: experience } = await (supabase
        .from('experiences' as any)
        .select('base_price, max_participants')
        .eq('id', experienceId)
        .single() as any);

      if (!experience) return [];

      // Get schedules for this date
      const { data: schedules, error } = await (supabase
        .from('experience_schedules' as any)
        .select('*')
        .eq('experience_id', experienceId)
        .eq('is_active', true)
        .or(`schedule_type.eq.on_demand,and(schedule_type.eq.recurring,day_of_week.eq.${dayOfWeek}),and(schedule_type.eq.specific_date,specific_date.eq.${dateStr})`) as any);

      if (error) return [];

      // Get existing bookings for this date
      const { data: bookings } = await (supabase
        .from('experience_bookings' as any)
        .select('start_time, num_adults, num_children')
        .eq('experience_id', experienceId)
        .eq('booking_date', dateStr)
        .not('status', 'in', '("cancelled","no_show")') as any);

      // Build time slots
      const slots: TimeSlot[] = [];
      const bookingsByTime = new Map<string, number>();

      (bookings || []).forEach((b: any) => {
        const key = b.start_time;
        bookingsByTime.set(key, (bookingsByTime.get(key) || 0) + b.num_adults + b.num_children);
      });

      (schedules || []).forEach((schedule: any) => {
        const capacity = schedule.capacity_override || experience.max_participants;
        const booked = bookingsByTime.get(schedule.start_time) || 0;
        const spotsLeft = capacity ? capacity - booked : null;

        slots.push({
          time: schedule.start_time,
          available: spotsLeft === null || spotsLeft > 0,
          spotsLeft,
          price: schedule.price_override || experience.base_price,
        });
      });

      // Sort by time
      return slots.sort((a, b) => a.time.localeCompare(b.time));
    },
    enabled: !!experienceId && !!date,
  });
}

/**
 * Hook to create an experience booking
 */
export function useCreateExperienceBooking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      experienceId,
      date,
      time,
      numAdults,
      numChildren = 0,
      isPrivate = false,
      customerName,
      customerEmail,
      customerPhone,
      specialRequests,
    }: {
      experienceId: string;
      date: Date;
      time: string;
      numAdults: number;
      numChildren?: number;
      isPrivate?: boolean;
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      specialRequests?: string;
    }) => {
      // Get experience details
      const { data: experience, error: expError } = await (supabase
        .from('experiences' as any)
        .select('*, venue:venues(name)')
        .eq('id', experienceId)
        .single() as any);

      if (expError) throw expError;

      // Calculate pricing
      let unitPrice = experience.base_price;
      const childPrice = experience.child_price || 0;

      // Check for price override in schedule
      const dateStr = date.toISOString().split('T')[0];
      const { data: schedule } = await (supabase
        .from('experience_schedules' as any)
        .select('price_override')
        .eq('experience_id', experienceId)
        .eq('start_time', time)
        .or(`specific_date.eq.${dateStr},and(schedule_type.eq.recurring,day_of_week.eq.${date.getDay()})`)
        .single() as any);

      if (schedule?.price_override) {
        unitPrice = schedule.price_override;
      }

      // Apply private booking multiplier
      if (isPrivate && experience.is_private_available) {
        unitPrice *= experience.private_price_multiplier || 1.5;
      }

      // Apply group discount
      const totalPeople = numAdults + numChildren;
      let discount = 0;
      if (
        experience.group_discount_percent &&
        experience.group_discount_min_size &&
        totalPeople >= experience.group_discount_min_size
      ) {
        discount = (unitPrice * numAdults + childPrice * numChildren) * (experience.group_discount_percent / 100);
      }

      const adultTotal = unitPrice * numAdults;
      const childTotal = childPrice * numChildren;
      const subtotal = adultTotal + childTotal;
      const taxes = subtotal * 0.15; // 15% VAT
      const total = subtotal + taxes - discount;

      // Create booking
      const { data: booking, error: bookingError } = await (supabase
        .from('experience_bookings' as any)
        .insert({
          experience_id: experienceId,
          customer_id: user?.id || null,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          booking_date: dateStr,
          start_time: time,
          num_adults: numAdults,
          num_children: numChildren,
          is_private: isPrivate,
          unit_price: unitPrice,
          adult_total: adultTotal,
          child_total: childTotal,
          subtotal,
          discount,
          taxes,
          total,
          special_requests: specialRequests,
          status: experience.instant_confirmation ? 'confirmed' : 'pending',
          confirmed_at: experience.instant_confirmation ? new Date().toISOString() : null,
        })
        .select()
        .single() as any);

      if (bookingError) throw bookingError;

      return { booking, experience };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['experience-slots', variables.experienceId],
      });
      queryClient.invalidateQueries({ queryKey: ['my-experience-bookings'] });
      toast({
        title: 'Booking Confirmed!',
        description: 'Your experience has been booked successfully.',
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

/**
 * Hook to fetch user's experience bookings
 */
export function useMyExperienceBookings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-experience-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase
        .from('experience_bookings' as any)
        .select(`
          *,
          experience:experiences(
            name,
            main_image,
            duration_minutes,
            venue:venues(name, city)
          )
        `)
        .eq('customer_id', user.id)
        .order('booking_date', { ascending: false }) as any);

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return (data || []) as ExperienceBooking[];
    },
    enabled: !!user,
  });
}

/**
 * Hook to cancel an experience booking
 */
export function useCancelExperienceBooking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      reason,
    }: {
      bookingId: string;
      reason?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Get booking to check cancellation policy
      const { data: booking, error: fetchError } = await (supabase
        .from('experience_bookings' as any)
        .select(`
          *,
          experience:experiences(cancellation_hours)
        `)
        .eq('id', bookingId)
        .eq('customer_id', user.id)
        .single() as any);

      if (fetchError) throw fetchError;
      if (!booking) throw new Error('Booking not found');

      // Check if within cancellation window
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
      const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
      const cancellationHours = booking.experience?.cancellation_hours || 24;

      if (hoursUntilBooking < cancellationHours) {
        throw new Error(
          `Cannot cancel within ${cancellationHours} hours of the experience. Contact support for assistance.`
        );
      }

      // Cancel the booking
      const { error: updateError } = await (supabase
        .from('experience_bookings' as any)
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', bookingId) as any);

      if (updateError) throw updateError;

      return bookingId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-experience-bookings'] });
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully.',
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

/**
 * Hook to fetch bookings for venue/experience owners
 */
export function useVenueBookings(venueId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['venue-bookings', venueId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      let query = (supabase
        .from('experience_bookings' as any)
        .select(`
          *,
          experience:experiences(
            name,
            venue_id,
            venue:venues(owner_id)
          )
        `)
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true }) as any);

      // Filter by venue if provided
      if (venueId) {
        query = query.eq('experience.venue_id', venueId);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      // Filter to only show bookings for venues owned by user
      return (data || []).filter(
        (booking: any) =>
          booking.experience?.venue?.owner_id === user.id ||
          booking.experience?.host_id === user.id
      ) as ExperienceBooking[];
    },
    enabled: !!user,
  });
}

/**
 * Hook to update booking status (for venue owners)
 */
export function useUpdateBookingStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: ExperienceBooking['status'];
    }) => {
      const updates: Record<string, any> = { status };

      if (status === 'confirmed') updates.confirmed_at = new Date().toISOString();
      if (status === 'checked_in') updates.checked_in_at = new Date().toISOString();
      if (status === 'completed') updates.completed_at = new Date().toISOString();

      const { error } = await (supabase
        .from('experience_bookings' as any)
        .update(updates)
        .eq('id', bookingId) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-bookings'] });
      toast({
        title: 'Status Updated',
        description: 'Booking status has been updated.',
      });
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`;
}

/**
 * Format time for display
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Get experience type label
 */
export function getExperienceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    tour: 'Tour',
    activity: 'Activity',
    class: 'Class',
    workshop: 'Workshop',
    tasting: 'Tasting',
    adventure: 'Adventure',
    wellness: 'Wellness',
    sports: 'Sports',
    entertainment: 'Entertainment',
    food_experience: 'Food Experience',
    cultural: 'Cultural',
    nature: 'Nature',
    nightlife: 'Nightlife',
    event: 'Event',
    private_event: 'Private Event',
    other: 'Other',
  };
  return labels[type] || type;
}
