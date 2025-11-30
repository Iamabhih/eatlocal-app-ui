import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PricingRule {
  id: string;
  entity_type: 'hotel' | 'venue' | 'restaurant';
  entity_id: string;
  rule_name: string;
  rule_type: 'time_based' | 'demand_based' | 'event_based' | 'occupancy_based';
  conditions: Record<string, any>;
  adjustment_type: 'percentage' | 'fixed';
  adjustment_value: number;
  min_price: number | null;
  max_price: number | null;
  priority: number;
  is_active: boolean;
  valid_from: string | null;
  valid_to: string | null;
  created_at: string;
}

export interface PackageDeal {
  id: string;
  name: string;
  description: string | null;
  components: { type: string; id: string; nights?: number }[];
  individual_price: number;
  package_price: number;
  savings_amount: number;
  available_from: string | null;
  available_to: string | null;
  max_bookings: number | null;
  current_bookings: number;
  image_url: string | null;
  gallery: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface VirtualTour {
  id: string;
  entity_type: 'hotel' | 'venue' | 'restaurant';
  entity_id: string;
  tour_name: string;
  tour_type: '360' | 'video' | 'interactive';
  tour_url: string;
  thumbnail_url: string | null;
  hotspots: { position: { x: number; y: number; z: number }; label: string; link?: string }[];
  view_count: number;
  avg_duration_seconds: number | null;
  is_active: boolean;
  created_at: string;
}

export interface DigitalCheckin {
  id: string;
  booking_id: string;
  guest_id: string | null;
  arrival_time: string | null;
  special_requests: string | null;
  id_document_url: string | null;
  id_verified: boolean;
  status: 'pending' | 'submitted' | 'approved' | 'checked_in' | 'checked_out';
  room_number: string | null;
  room_key_type: 'physical' | 'mobile' | 'qr' | null;
  mobile_key_token: string | null;
  qr_code_url: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  created_at: string;
}

/**
 * Get pricing rules for an entity
 */
export function usePricingRules(entityType: PricingRule['entity_type'], entityId: string) {
  return useQuery({
    queryKey: ['pricing-rules', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('priority', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as PricingRule[];
    },
    enabled: !!entityId,
  });
}

/**
 * Calculate dynamic price
 */
export function useCalculateDynamicPrice(
  entityType: PricingRule['entity_type'],
  entityId: string,
  basePrice: number,
  context?: { date?: Date; occupancy?: number; eventType?: string }
) {
  const { data: rules } = usePricingRules(entityType, entityId);

  if (!rules || rules.length === 0) return basePrice;

  let adjustedPrice = basePrice;
  const now = context?.date || new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();

  for (const rule of rules.filter((r) => r.is_active)) {
    // Check validity period
    if (rule.valid_from && new Date(rule.valid_from) > now) continue;
    if (rule.valid_to && new Date(rule.valid_to) < now) continue;

    let applies = false;

    // Check conditions based on rule type
    if (rule.rule_type === 'time_based') {
      const { days_of_week, hours } = rule.conditions;
      if (days_of_week?.includes(dayOfWeek)) applies = true;
      if (hours?.some((h: number[]) => hour >= h[0] && hour <= h[1])) applies = true;
    } else if (rule.rule_type === 'demand_based' && context?.occupancy) {
      const { occupancy_above, occupancy_below } = rule.conditions;
      if (occupancy_above && context.occupancy >= occupancy_above) applies = true;
      if (occupancy_below && context.occupancy <= occupancy_below) applies = true;
    } else if (rule.rule_type === 'event_based' && context?.eventType) {
      const { event_types } = rule.conditions;
      if (event_types?.includes(context.eventType)) applies = true;
    }

    if (applies) {
      if (rule.adjustment_type === 'percentage') {
        adjustedPrice *= 1 + rule.adjustment_value / 100;
      } else {
        adjustedPrice += rule.adjustment_value;
      }

      // Apply limits
      if (rule.min_price && adjustedPrice < rule.min_price) {
        adjustedPrice = rule.min_price;
      }
      if (rule.max_price && adjustedPrice > rule.max_price) {
        adjustedPrice = rule.max_price;
      }
    }
  }

  return Math.round(adjustedPrice * 100) / 100;
}

/**
 * Create pricing rule
 */
export function useCreatePricingRule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Omit<PricingRule, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['pricing-rules', variables.entity_type, variables.entity_id],
      });
      toast({ title: 'Pricing Rule Created' });
    },
  });
}

/**
 * Get package deals
 */
export function usePackageDeals(featured?: boolean) {
  return useQuery({
    queryKey: ['package-deals', featured],
    queryFn: async () => {
      let query = supabase
        .from('package_deals')
        .select('*')
        .eq('is_active', true)
        .or('available_from.is.null,available_from.lte.' + new Date().toISOString())
        .or('available_to.is.null,available_to.gte.' + new Date().toISOString())
        .order('savings_amount', { ascending: false });

      if (featured) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as PackageDeal[];
    },
  });
}

/**
 * Get package deal details
 */
export function usePackageDeal(packageId: string) {
  return useQuery({
    queryKey: ['package-deal', packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('package_deals')
        .select('*')
        .eq('id', packageId)
        .single();

      if (error) throw error;
      return data as PackageDeal;
    },
    enabled: !!packageId,
  });
}

/**
 * Get virtual tours for an entity
 */
export function useVirtualTours(entityType: VirtualTour['entity_type'], entityId: string) {
  return useQuery({
    queryKey: ['virtual-tours', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('virtual_tours')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('is_active', true);

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as VirtualTour[];
    },
    enabled: !!entityId,
  });
}

/**
 * Track virtual tour view
 */
export function useTrackTourView() {
  return useMutation({
    mutationFn: async ({
      tourId,
      durationSeconds,
    }: {
      tourId: string;
      durationSeconds?: number;
    }) => {
      // Increment view count
      const { data: tour } = await supabase
        .from('virtual_tours')
        .select('view_count, avg_duration_seconds')
        .eq('id', tourId)
        .single();

      if (!tour) return;

      const newViewCount = (tour.view_count || 0) + 1;
      let newAvgDuration = tour.avg_duration_seconds;

      if (durationSeconds && tour.avg_duration_seconds) {
        newAvgDuration =
          (tour.avg_duration_seconds * tour.view_count + durationSeconds) / newViewCount;
      } else if (durationSeconds) {
        newAvgDuration = durationSeconds;
      }

      await supabase
        .from('virtual_tours')
        .update({
          view_count: newViewCount,
          avg_duration_seconds: newAvgDuration,
        })
        .eq('id', tourId);
    },
  });
}

/**
 * Get digital check-in for a booking
 */
export function useDigitalCheckin(bookingId: string) {
  return useQuery({
    queryKey: ['digital-checkin', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_checkins')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') return null;
        throw error;
      }

      return data as DigitalCheckin;
    },
    enabled: !!bookingId,
  });
}

/**
 * Submit digital check-in
 */
export function useSubmitDigitalCheckin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      arrivalTime,
      specialRequests,
      idDocument,
    }: {
      bookingId: string;
      arrivalTime?: Date;
      specialRequests?: string;
      idDocument?: File;
    }) => {
      if (!user) throw new Error('Not authenticated');

      let idDocumentUrl: string | null = null;

      if (idDocument) {
        const fileExt = idDocument.name.split('.').pop();
        const fileName = `${user.id}_${bookingId}_id.${fileExt}`;
        const storagePath = `checkin-docs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('private-documents')
          .upload(storagePath, idDocument);

        if (uploadError) throw uploadError;
        idDocumentUrl = storagePath;
      }

      const { data, error } = await supabase
        .from('digital_checkins')
        .upsert({
          booking_id: bookingId,
          guest_id: user.id,
          arrival_time: arrivalTime?.toISOString(),
          special_requests: specialRequests,
          id_document_url: idDocumentUrl,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['digital-checkin', variables.bookingId] });
      toast({
        title: 'Check-in Submitted',
        description: 'Your check-in request is being processed. You will receive your room key shortly.',
      });
    },
  });
}

/**
 * Get mobile room key
 */
export function useMobileRoomKey(bookingId: string) {
  const { data: checkin } = useDigitalCheckin(bookingId);

  if (!checkin || checkin.status !== 'checked_in') {
    return null;
  }

  return {
    roomNumber: checkin.room_number,
    keyType: checkin.room_key_type,
    mobileKeyToken: checkin.mobile_key_token,
    qrCodeUrl: checkin.qr_code_url,
    checkedInAt: checkin.checked_in_at,
  };
}

export const PRICING_RULE_TYPES = [
  { value: 'time_based', label: 'Time-Based', description: 'Adjust based on day/time' },
  { value: 'demand_based', label: 'Demand-Based', description: 'Adjust based on occupancy' },
  { value: 'event_based', label: 'Event-Based', description: 'Adjust for special events' },
  { value: 'occupancy_based', label: 'Occupancy-Based', description: 'Adjust based on availability' },
] as const;

export const ROOM_KEY_TYPES = [
  { value: 'physical', label: 'Physical Key Card', description: 'Collect at reception' },
  { value: 'mobile', label: 'Mobile Key', description: 'Use your phone to unlock' },
  { value: 'qr', label: 'QR Code', description: 'Scan at door' },
] as const;
