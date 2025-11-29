import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DeliveryPartnerStatus {
  id: string;
  partner_id: string;
  is_online: boolean;
  last_online_at: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  available_for_orders: boolean;
  max_concurrent_orders: number;
  current_order_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderOffer {
  id: string;
  order_id: string;
  partner_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  offered_at: string;
  responded_at: string | null;
  expires_at: string;
  estimated_earnings: number;
  order?: {
    id: string;
    order_number: string;
    total: number;
    delivery_fee: number;
    restaurant: {
      name: string;
      street_address: string;
      city: string;
    };
    delivery_address: {
      street_address: string;
      city: string;
    };
  };
}

// Hook to get and manage partner online status
export function useDeliveryPartnerStatus() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['delivery-partner-status', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await (supabase
        .from('delivery_partner_status' as any)
        .select('*')
        .eq('partner_id', user.id)
        .single() as any);

      if (error) {
        if (error.code === 'PGRST116') {
          // Create default status
          const { data: newStatus, error: createError } = await (supabase
            .from('delivery_partner_status' as any)
            .insert({
              partner_id: user.id,
              is_online: false,
              available_for_orders: true,
              max_concurrent_orders: 3,
              current_order_count: 0,
            })
            .select()
            .single() as any);

          if (createError) throw createError;
          return newStatus as DeliveryPartnerStatus;
        }
        throw error;
      }

      return data as DeliveryPartnerStatus;
    },
    enabled: !!user,
  });

  const toggleOnline = useMutation({
    mutationFn: async (isOnline: boolean) => {
      if (!user) throw new Error('Not authenticated');

      const updates: Partial<DeliveryPartnerStatus> = {
        is_online: isOnline,
        updated_at: new Date().toISOString(),
      };

      if (isOnline) {
        updates.last_online_at = new Date().toISOString();
      }

      const { error } = await (supabase
        .from('delivery_partner_status' as any)
        .update(updates)
        .eq('partner_id', user.id) as any);

      if (error) throw error;

      return isOnline;
    },
    onSuccess: (isOnline) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-partner-status'] });
      toast({
        title: isOnline ? 'You are now online' : 'You are now offline',
        description: isOnline
          ? 'You will receive order offers'
          : 'You will not receive new orders',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateLocation = useMutation({
    mutationFn: async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase
        .from('delivery_partner_status' as any)
        .update({
          current_latitude: latitude,
          current_longitude: longitude,
          updated_at: new Date().toISOString(),
        })
        .eq('partner_id', user.id) as any);

      if (error) throw error;
    },
  });

  return {
    status,
    isLoading,
    isOnline: status?.is_online ?? false,
    toggleOnline: toggleOnline.mutate,
    isTogglingOnline: toggleOnline.isPending,
    updateLocation: updateLocation.mutate,
  };
}

// Hook to get pending order offers
export function useOrderOffers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['order-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase
        .from('order_offers' as any)
        .select(`
          *,
          order:orders(
            id,
            order_number,
            total,
            delivery_fee,
            restaurant:restaurants(name, street_address, city),
            delivery_address:customer_addresses(street_address, city)
          )
        `)
        .eq('partner_id', user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('offered_at', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as OrderOffer[];
    },
    enabled: !!user,
    refetchInterval: 10000, // Check every 10 seconds
  });

  const respondToOffer = useMutation({
    mutationFn: async ({
      offerId,
      response,
      rejectionReason,
    }: {
      offerId: string;
      response: 'accepted' | 'rejected';
      rejectionReason?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: offer, error: offerError } = await (supabase
        .from('order_offers' as any)
        .select('order_id')
        .eq('id', offerId)
        .single() as any);

      if (offerError) throw offerError;

      // Update offer status
      const { error: updateError } = await (supabase
        .from('order_offers' as any)
        .update({
          status: response,
          responded_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', offerId) as any);

      if (updateError) throw updateError;

      // If accepted, assign order to partner
      if (response === 'accepted') {
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            delivery_partner_id: user.id,
            status: 'confirmed',
          })
          .eq('id', (offer as any).order_id);

        if (orderError) throw orderError;

        // Increment partner's current order count
        await (supabase.rpc as any)('increment_order_count', { p_partner_id: user.id });
      }

      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['order-offers'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-partner-status'] });

      toast({
        title: response === 'accepted' ? 'Order Accepted' : 'Order Declined',
        description:
          response === 'accepted'
            ? 'The order has been assigned to you'
            : 'The offer has been declined',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Action Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    offers,
    isLoading,
    pendingCount: offers.length,
    acceptOffer: (offerId: string) =>
      respondToOffer.mutate({ offerId, response: 'accepted' }),
    rejectOffer: (offerId: string, reason?: string) =>
      respondToOffer.mutate({ offerId, response: 'rejected', rejectionReason: reason }),
    isResponding: respondToOffer.isPending,
  };
}