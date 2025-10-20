import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreateRideRequest {
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  journey_mode: string;
  service_tier: string;
  estimated_distance_km: number;
  estimated_duration_minutes: number;
  special_instructions?: string;
}

export function useRides() {
  const queryClient = useQueryClient();

  const { data: rides, isLoading } = useQuery({
    queryKey: ['my-rides'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: rider } = await supabase
        .from('riders')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!rider) return [];

      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:drivers!rides_driver_id_fkey(
            id,
            vehicle_make,
            vehicle_model,
            vehicle_color,
            vehicle_license_plate,
            average_rating,
            user_id,
            profiles!drivers_user_id_fkey(full_name, phone, avatar_url)
          )
        `)
        .eq('rider_id', rider.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createRide = useMutation({
    mutationFn: async (rideData: CreateRideRequest) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get or create rider profile
      let { data: rider } = await supabase
        .from('riders')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!rider) {
        const { data: newRider, error: riderError } = await supabase
          .from('riders')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (riderError) throw riderError;
        rider = newRider;
      }

      const { data, error } = await supabase
        .from('rides')
        .insert({
          rider_id: rider.id,
          ...rideData,
          base_fare: 0, // Will be calculated by trigger
          subtotal: 0, // Will be calculated by trigger
          total: 0, // Will be calculated by trigger
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-rides'] });
      toast.success('Ride requested successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create ride: ${error.message}`);
    },
  });

  const updateRideStatus = useMutation({
    mutationFn: async ({ rideId, status, driverId }: { rideId: string; status: string; driverId?: string }) => {
      const updateData: any = { status };
      
      if (status === 'accepted' && driverId) {
        updateData.driver_id = driverId;
        updateData.accepted_at = new Date().toISOString();
      } else if (status === 'driver_arriving') {
        updateData.driver_arrived_at = new Date().toISOString();
      } else if (status === 'started') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('rides')
        .update(updateData)
        .eq('id', rideId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-rides'] });
      toast.success('Ride status updated');
    },
  });

  return {
    rides,
    isLoading,
    createRide,
    updateRideStatus,
  };
}
