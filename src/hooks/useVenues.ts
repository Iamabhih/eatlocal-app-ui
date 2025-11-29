import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Venue {
  id: string;
  owner_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  short_description: string | null;
  street_address: string;
  city: string;
  state: string | null;
  country: string;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  area_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  social_links: Record<string, string>;
  venue_type: string;
  categories: string[];
  main_image: string | null;
  gallery_images: string[];
  amenities: string[];
  accessibility_features: string[];
  operating_hours: Record<string, { open: string; close: string }>;
  is_24_hours: boolean;
  price_level: number | null;
  currency: string;
  is_active: boolean;
  is_featured: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  rating: number;
  total_reviews: number;
  total_bookings: number;
  created_at: string;
  updated_at: string;
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
  total_bookings: number;
  created_at: string;
  venue?: Venue;
}

export interface ExperienceBooking {
  id: string;
  booking_number: string;
  experience_id: string;
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
  currency: string;
  payment_status: string;
  status: string;
  special_requests: string | null;
  created_at: string;
  experience?: Experience;
}

export interface VenueSearchParams {
  city?: string;
  venueType?: string;
  categories?: string[];
  priceLevel?: number;
  minRating?: number;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export const venueTypeLabels: Record<string, string> = {
  restaurant: 'Restaurant', bar: 'Bar', club: 'Nightclub', cafe: 'Café',
  brewery: 'Brewery', winery: 'Winery', museum: 'Museum', gallery: 'Art Gallery',
  theater: 'Theater', cinema: 'Cinema', park: 'Park', beach: 'Beach',
  nature_reserve: 'Nature Reserve', hiking_trail: 'Hiking Trail', spa: 'Spa',
  gym: 'Gym', sports_facility: 'Sports Facility', adventure_park: 'Adventure Park',
  tour_operator: 'Tour Operator', event_space: 'Event Space',
  conference_center: 'Conference Center', market: 'Market', shopping: 'Shopping',
  entertainment: 'Entertainment', other: 'Other',
};

export const experienceTypeLabels: Record<string, string> = {
  tour: 'Tour', activity: 'Activity', class: 'Class', workshop: 'Workshop',
  tasting: 'Tasting', adventure: 'Adventure', wellness: 'Wellness', sports: 'Sports',
  entertainment: 'Entertainment', food_experience: 'Food Experience', cultural: 'Cultural',
  nature: 'Nature', nightlife: 'Nightlife', event: 'Event', private_event: 'Private Event',
  other: 'Other',
};

export function useVenueSearch(params: VenueSearchParams) {
  return useQuery({
    queryKey: ['venues', 'search', params],
    queryFn: async () => {
      let query = (supabase.from('venues' as any).select('*').eq('is_active', true).eq('verification_status', 'verified') as any);
      if (params.city) query = query.ilike('city', `%${params.city}%`);
      if (params.venueType) query = query.eq('venue_type', params.venueType);
      if (params.categories?.length) query = query.contains('categories', params.categories);
      if (params.priceLevel) query = query.lte('price_level', params.priceLevel);
      if (params.minRating) query = query.gte('rating', params.minRating);
      const { data, error } = await query.order('is_featured', { ascending: false }).order('rating', { ascending: false });
      if (error) throw error;
      return (data || []) as Venue[];
    },
  });
}

export function useNearbyVenues(latitude: number, longitude: number, radiusKm = 10) {
  return useQuery({
    queryKey: ['venues', 'nearby', latitude, longitude, radiusKm],
    queryFn: async () => {
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
      const { data, error } = await (supabase.from('venues' as any).select('*').eq('is_active', true).eq('verification_status', 'verified').gte('latitude', latitude - latDelta).lte('latitude', latitude + latDelta).gte('longitude', longitude - lngDelta).lte('longitude', longitude + lngDelta) as any);
      if (error) throw error;
      return (data || []) as Venue[];
    },
    enabled: !!latitude && !!longitude,
  });
}

export function useFeaturedVenues(limit = 6) {
  return useQuery({
    queryKey: ['venues', 'featured', limit],
    queryFn: async () => {
      const { data, error } = await (supabase.from('venues' as any).select('*').eq('is_active', true).eq('is_featured', true).order('rating', { ascending: false }).limit(limit) as any);
      if (error) throw error;
      return (data || []) as Venue[];
    },
  });
}

export function useVenue(venueId: string) {
  return useQuery({
    queryKey: ['venue', venueId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('venues' as any).select('*').eq('id', venueId).single() as any);
      if (error) throw error;
      return data as Venue;
    },
    enabled: !!venueId,
  });
}

export function useVenueExperiences(venueId: string) {
  return useQuery({
    queryKey: ['venue-experiences', venueId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('experiences' as any).select('*').eq('venue_id', venueId).eq('is_active', true).order('is_featured', { ascending: false }).order('base_price', { ascending: true }) as any);
      if (error) throw error;
      return (data || []) as Experience[];
    },
    enabled: !!venueId,
  });
}

export function useExperienceSearch(params: { city?: string; experienceType?: string; minPrice?: number; maxPrice?: number; date?: string }) {
  return useQuery({
    queryKey: ['experiences', 'search', params],
    queryFn: async () => {
      let query = (supabase.from('experiences' as any).select(`*, venue:venues(id, name, city, main_image, rating)`).eq('is_active', true) as any);
      if (params.experienceType) query = query.eq('experience_type', params.experienceType);
      if (params.minPrice) query = query.gte('base_price', params.minPrice);
      if (params.maxPrice) query = query.lte('base_price', params.maxPrice);
      const { data, error } = await query.order('is_featured', { ascending: false }).order('rating', { ascending: false });
      if (error) throw error;
      let results = (data || []) as Experience[];
      if (params.city) results = results.filter(exp => exp.venue?.city?.toLowerCase().includes(params.city!.toLowerCase()));
      return results;
    },
  });
}

export function useExperience(experienceId: string) {
  return useQuery({
    queryKey: ['experience', experienceId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('experiences' as any).select(`*, venue:venues(*)`).eq('id', experienceId).single() as any);
      if (error) throw error;
      return data as Experience;
    },
    enabled: !!experienceId,
  });
}

export function useCreateExperienceBooking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: { experience_id: string; customer_name: string; customer_email: string; customer_phone?: string; booking_date: string; start_time: string; num_adults: number; num_children?: number; is_private?: boolean; unit_price: number; adult_total: number; child_total?: number; subtotal: number; taxes: number; fees: number; total: number; special_requests?: string }) => {
      const { data, error } = await (supabase.from('experience_bookings' as any).insert({ ...booking, customer_id: user?.id, num_children: booking.num_children || 0, child_total: booking.child_total || 0, is_private: booking.is_private || false, status: 'pending', payment_status: 'pending' }).select().single() as any);
      if (error) throw error;
      return data as ExperienceBooking;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-experience-bookings'] }); toast({ title: 'Booking Created', description: 'Your experience booking has been submitted.' }); },
    onError: (error: Error) => { toast({ title: 'Booking Failed', description: error.message, variant: 'destructive' }); },
  });
}

export function useMyExperienceBookings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-experience-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase.from('experience_bookings' as any).select(`*, experience:experiences(*, venue:venues(*))`).eq('customer_id', user.id).order('created_at', { ascending: false }) as any);
      if (error) throw error;
      return (data || []) as ExperienceBooking[];
    },
    enabled: !!user,
  });
}

export function calculateExperienceBookingTotal(unitPrice: number, numAdults: number, numChildren: number, childPrice: number | null, isPrivate: boolean, privateMultiplier: number, taxRate = 0.15) {
  let adultTotal = unitPrice * numAdults;
  let childTotal = (childPrice || unitPrice * 0.5) * numChildren;
  if (isPrivate) { adultTotal *= privateMultiplier; childTotal *= privateMultiplier; }
  const subtotal = adultTotal + childTotal;
  const taxes = subtotal * taxRate;
  const fees = 25;
  const total = subtotal + taxes + fees;
  return { adultTotal: Math.round(adultTotal * 100) / 100, childTotal: Math.round(childTotal * 100) / 100, subtotal: Math.round(subtotal * 100) / 100, taxes: Math.round(taxes * 100) / 100, fees, total: Math.round(total * 100) / 100 };
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}