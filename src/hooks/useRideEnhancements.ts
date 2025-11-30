import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface RidePool {
  id: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  max_passengers: number;
  current_passengers: number;
  max_detour_minutes: number;
  base_fare: number;
  per_passenger_discount: number;
  status: 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';
  departure_window_start: string;
  departure_window_end: string;
  actual_departure: string | null;
  driver_id: string | null;
  created_at: string;
}

export interface PoolParticipant {
  id: string;
  pool_id: string;
  user_id: string;
  ride_id: string | null;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  pickup_address: string | null;
  dropoff_address: string | null;
  pickup_sequence: number | null;
  dropoff_sequence: number | null;
  fare_amount: number | null;
  discount_applied: number | null;
  status: 'pending' | 'confirmed' | 'picked_up' | 'dropped_off' | 'cancelled';
  joined_at: string;
}

export interface ScheduledRide {
  id: string;
  user_id: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  scheduled_time: string;
  pickup_window_minutes: number;
  vehicle_type: string;
  passenger_count: number;
  women_only: boolean;
  estimated_fare: number | null;
  estimated_duration: number | null;
  status: 'scheduled' | 'confirmed' | 'driver_assigned' | 'in_progress' | 'completed' | 'cancelled';
  driver_id: string | null;
  ride_id: string | null;
  reminder_sent_24h: boolean;
  reminder_sent_1h: boolean;
  created_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
}

export interface SafetyPreferences {
  id: string;
  user_id: string;
  women_only_rides: boolean;
  share_trip_auto: boolean;
  emergency_contacts: { name: string; phone: string }[];
  gender_verified: boolean;
  verified_at: string | null;
}

/**
 * Get available ride pools
 */
export function useAvailableRidePools({
  originLat,
  originLng,
  destinationLat,
  destinationLng,
  departureTime,
}: {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  departureTime: Date;
}) {
  return useQuery({
    queryKey: ['ride-pools', originLat, originLng, destinationLat, destinationLng, departureTime.toISOString()],
    queryFn: async () => {
      // Find pools within reasonable distance and time
      const { data, error } = await supabase
        .from('ride_pools')
        .select(`
          *,
          participants:pool_participants(count)
        `)
        .eq('status', 'open')
        .gte('departure_window_end', new Date().toISOString())
        .lte('departure_window_start', new Date(departureTime.getTime() + 30 * 60 * 1000).toISOString());

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      // Filter by distance (simplified - in production use PostGIS)
      const maxDistanceKm = 2;
      return (data as RidePool[]).filter((pool) => {
        const originDist = getDistanceKm(
          pool.origin_lat,
          pool.origin_lng,
          originLat,
          originLng
        );
        const destDist = getDistanceKm(
          pool.destination_lat,
          pool.destination_lng,
          destinationLat,
          destinationLng
        );
        return originDist <= maxDistanceKm && destDist <= maxDistanceKm;
      });
    },
    enabled: !!(originLat && originLng && destinationLat && destinationLng),
  });
}

/**
 * Join a ride pool
 */
export function useJoinRidePool() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      poolId,
      pickupLat,
      pickupLng,
      pickupAddress,
      dropoffLat,
      dropoffLng,
      dropoffAddress,
    }: {
      poolId: string;
      pickupLat: number;
      pickupLng: number;
      pickupAddress: string;
      dropoffLat: number;
      dropoffLng: number;
      dropoffAddress: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Get pool to calculate fare
      const { data: pool } = await supabase
        .from('ride_pools')
        .select('base_fare, per_passenger_discount, current_passengers')
        .eq('id', poolId)
        .single();

      if (!pool) throw new Error('Pool not found');

      const discount = pool.base_fare * pool.per_passenger_discount * pool.current_passengers;
      const fareAmount = pool.base_fare - discount;

      const { data, error } = await supabase
        .from('pool_participants')
        .insert({
          pool_id: poolId,
          user_id: user.id,
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          pickup_address: pickupAddress,
          dropoff_lat: dropoffLat,
          dropoff_lng: dropoffLng,
          dropoff_address: dropoffAddress,
          fare_amount: fareAmount,
          discount_applied: discount,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Update pool passenger count
      await supabase
        .from('ride_pools')
        .update({ current_passengers: pool.current_passengers + 1 })
        .eq('id', poolId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ride-pools'] });
      queryClient.invalidateQueries({ queryKey: ['my-pool-rides'] });
      toast({
        title: 'Joined Pool',
        description: 'You have joined the ride pool. You will be notified when a driver is assigned.',
      });
    },
  });
}

/**
 * Get user's pool rides
 */
export function useMyPoolRides() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-pool-rides', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('pool_participants')
        .select(`
          *,
          pool:ride_pools(*)
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data;
    },
    enabled: !!user,
  });
}

/**
 * Get scheduled rides
 */
export function useScheduledRides() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['scheduled-rides', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('scheduled_rides')
        .select(`
          *,
          driver:drivers(
            id,
            user:profiles(full_name, avatar_url),
            vehicle_make,
            vehicle_model,
            vehicle_color,
            license_plate
          )
        `)
        .eq('user_id', user.id)
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as ScheduledRide[];
    },
    enabled: !!user,
  });
}

/**
 * Schedule a ride
 */
export function useScheduleRide() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pickupAddress,
      pickupLat,
      pickupLng,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
      scheduledTime,
      vehicleType,
      passengerCount,
      womenOnly,
    }: {
      pickupAddress: string;
      pickupLat: number;
      pickupLng: number;
      dropoffAddress: string;
      dropoffLat: number;
      dropoffLng: number;
      scheduledTime: Date;
      vehicleType?: string;
      passengerCount?: number;
      womenOnly?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Minimum 30 minutes in advance
      if (scheduledTime.getTime() < Date.now() + 30 * 60 * 1000) {
        throw new Error('Scheduled rides must be at least 30 minutes in advance');
      }

      // Estimate fare (simplified)
      const distance = getDistanceKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
      const estimatedFare = 25 + distance * 12; // Base + per km rate
      const estimatedDuration = Math.ceil(distance * 2); // ~30km/h average

      const { data, error } = await supabase
        .from('scheduled_rides')
        .insert({
          user_id: user.id,
          pickup_address: pickupAddress,
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          dropoff_address: dropoffAddress,
          dropoff_lat: dropoffLat,
          dropoff_lng: dropoffLng,
          scheduled_time: scheduledTime.toISOString(),
          vehicle_type: vehicleType || 'standard',
          passenger_count: passengerCount || 1,
          women_only: womenOnly || false,
          estimated_fare: estimatedFare,
          estimated_duration: estimatedDuration,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-rides'] });
      toast({
        title: 'Ride Scheduled',
        description: 'Your ride has been scheduled. We will notify you when a driver is assigned.',
      });
    },
  });
}

/**
 * Cancel scheduled ride
 */
export function useCancelScheduledRide() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rideId,
      reason,
    }: {
      rideId: string;
      reason?: string;
    }) => {
      const { error } = await supabase
        .from('scheduled_rides')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', rideId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-rides'] });
      toast({
        title: 'Ride Cancelled',
      });
    },
  });
}

/**
 * Get safety preferences
 */
export function useSafetyPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['safety-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('safety_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') return null;
        throw error;
      }

      return data as SafetyPreferences;
    },
    enabled: !!user,
  });
}

/**
 * Update safety preferences
 */
export function useUpdateSafetyPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<Omit<SafetyPreferences, 'id' | 'user_id' | 'gender_verified' | 'verified_at'>>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('safety_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-preferences'] });
      toast({
        title: 'Preferences Updated',
        description: 'Your safety preferences have been saved.',
      });
    },
  });
}

/**
 * Add emergency contact
 */
export function useAddEmergencyContact() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: { name: string; phone: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Get current preferences
      const { data: current } = await supabase
        .from('safety_preferences')
        .select('emergency_contacts')
        .eq('user_id', user.id)
        .single();

      const contacts = [...(current?.emergency_contacts || []), contact];

      const { error } = await supabase
        .from('safety_preferences')
        .upsert({
          user_id: user.id,
          emergency_contacts: contacts,
        });

      if (error) throw error;
      return contacts;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-preferences'] });
      toast({
        title: 'Contact Added',
        description: 'Emergency contact has been added.',
      });
    },
  });
}

// Helper function to calculate distance
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const VEHICLE_TYPES = [
  { value: 'standard', label: 'Standard', description: '4 passengers, budget-friendly' },
  { value: 'comfort', label: 'Comfort', description: '4 passengers, newer vehicles' },
  { value: 'xl', label: 'XL', description: '6 passengers, larger vehicles' },
  { value: 'premium', label: 'Premium', description: 'Luxury vehicles' },
] as const;

export const CANCELLATION_REASONS = [
  { value: 'plans_changed', label: 'Plans changed' },
  { value: 'found_alternative', label: 'Found alternative transport' },
  { value: 'price_too_high', label: 'Price too high' },
  { value: 'wait_too_long', label: 'Wait time too long' },
  { value: 'other', label: 'Other' },
] as const;
