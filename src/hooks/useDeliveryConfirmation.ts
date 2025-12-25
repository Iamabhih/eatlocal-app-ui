import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DeliveryConfirmation {
  id: string;
  order_id: string;
  delivery_partner_id: string;
  confirmation_type: 'photo' | 'signature' | 'code' | 'contactless';
  photo_url: string | null;
  signature_url: string | null;
  verification_code: string | null;
  code_verified: boolean;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  distance_from_address: number | null;
  recipient_name: string | null;
  recipient_relationship: string | null;
  delivery_notes: string | null;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
}

export interface DeliveryIssue {
  id: string;
  order_id: string;
  confirmation_id: string | null;
  reported_by: string;
  reporter_type: 'customer' | 'restaurant' | 'driver' | 'admin';
  issue_type: string;
  description: string;
  evidence_photos: string[];
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution: string | null;
  outcome: string | null;
  refund_amount: number | null;
  created_at: string;
}

/**
 * Get delivery confirmation for an order (customer view)
 */
export function useDeliveryConfirmation(orderId: string | undefined) {
  return useQuery({
    queryKey: ['delivery-confirmation', orderId],
    queryFn: async () => {
      if (!orderId) return null;

      const { data, error } = await (supabase as any)
        .from('delivery_confirmations')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') return null;
        throw error;
      }

      return data as DeliveryConfirmation;
    },
    enabled: !!orderId,
  });
}

/**
 * Create delivery confirmation (driver)
 */
export function useCreateDeliveryConfirmation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      confirmationType,
      photoFile,
      recipientName,
      recipientRelationship,
      deliveryNotes,
      latitude,
      longitude,
    }: {
      orderId: string;
      confirmationType: DeliveryConfirmation['confirmation_type'];
      photoFile?: File;
      recipientName?: string;
      recipientRelationship?: string;
      deliveryNotes?: string;
      latitude?: number;
      longitude?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      let photoUrl: string | null = null;
      let photoStoragePath: string | null = null;

      // Upload photo if provided
      if (photoFile && confirmationType === 'photo') {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${orderId}_${Date.now()}.${fileExt}`;
        photoStoragePath = `delivery-confirmations/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('delivery-photos')
          .upload(photoStoragePath, photoFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('delivery-photos')
          .getPublicUrl(photoStoragePath);

        photoUrl = urlData.publicUrl;
      }

      // Calculate distance from delivery address
      let distanceFromAddress: number | null = null;
      if (latitude && longitude) {
        const { data: order } = await supabase
          .from('orders')
          .select('delivery_address_id')
          .eq('id', orderId)
          .single();

        if (order?.delivery_address_id) {
          const { data: address } = await supabase
            .from('customer_addresses')
            .select('latitude, longitude')
            .eq('id', order.delivery_address_id)
            .single();

          if (address?.latitude && address?.longitude) {
            // Haversine formula
            const R = 6371000; // Earth radius in meters
            const lat1 = latitude * Math.PI / 180;
            const lat2 = address.latitude * Math.PI / 180;
            const dLat = (address.latitude - latitude) * Math.PI / 180;
            const dLon = (address.longitude - longitude) * Math.PI / 180;

            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            distanceFromAddress = Math.round(R * c);
          }
        }
      }

      // Create confirmation
      const { data, error } = await (supabase as any)
        .from('delivery_confirmations')
        .insert({
          order_id: orderId,
          delivery_partner_id: user.id,
          confirmation_type: confirmationType,
          photo_url: photoUrl,
          photo_storage_path: photoStoragePath,
          recipient_name: recipientName,
          recipient_relationship: recipientRelationship,
          delivery_notes: deliveryNotes,
          delivery_latitude: latitude,
          delivery_longitude: longitude,
          distance_from_address: distanceFromAddress,
          verified: confirmationType === 'contactless', // Auto-verify contactless
          verified_at: confirmationType === 'contactless' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update order status to delivered
      await supabase
        .from('orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-confirmation', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });

      toast({
        title: 'Delivery Confirmed! ✓',
        description: 'Thank you for completing this delivery.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Confirmation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Verify delivery with code (customer confirms)
 */
export function useVerifyDeliveryCode() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, code }: { orderId: string; code: string }) => {
      const { data: confirmation, error: fetchError } = await (supabase as any)
        .from('delivery_confirmations')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (fetchError) throw fetchError;
      if (confirmation.confirmation_type !== 'code') {
        throw new Error('This delivery does not require code verification');
      }
      if (confirmation.verification_code !== code.toUpperCase()) {
        throw new Error('Invalid verification code');
      }

      const { error } = await (supabase as any)
        .from('delivery_confirmations')
        .update({
          code_verified: true,
          verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);

      if (error) throw error;
      return { orderId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-confirmation', data.orderId] });
      toast({
        title: 'Delivery Verified!',
        description: 'Thank you for confirming your delivery.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Report a delivery issue
 */
export function useReportDeliveryIssue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      issueType,
      description,
      evidencePhotos,
    }: {
      orderId: string;
      issueType: string;
      description: string;
      evidencePhotos?: File[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Upload evidence photos
      const photoUrls: string[] = [];
      if (evidencePhotos && evidencePhotos.length > 0) {
        for (const photo of evidencePhotos) {
          const fileExt = photo.name.split('.').pop();
          const fileName = `issue_${orderId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          const storagePath = `delivery-issues/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('delivery-photos')
            .upload(storagePath, photo);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('delivery-photos')
              .getPublicUrl(storagePath);
            photoUrls.push(urlData.publicUrl);
          }
        }
      }

      // Get confirmation ID if exists
      const { data: confirmation } = await (supabase as any)
        .from('delivery_confirmations')
        .select('id')
        .eq('order_id', orderId)
        .single();

      // Create issue
      const { data, error } = await (supabase as any)
        .from('delivery_issues')
        .insert({
          order_id: orderId,
          confirmation_id: confirmation?.id,
          reported_by: user.id,
          reporter_type: 'customer',
          issue_type: issueType,
          description,
          evidence_photos: photoUrls,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-issues'] });
      toast({
        title: 'Issue Reported',
        description: 'Our team will review this and get back to you within 24 hours.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Report Issue',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get user's reported delivery issues
 */
export function useDeliveryIssues() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['delivery-issues', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from('delivery_issues')
        .select(`
          *,
          order:orders(order_number, restaurant:restaurants(name))
        `)
        .eq('reported_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as (DeliveryIssue & { order: { order_number: string; restaurant: { name: string } } })[];
    },
    enabled: !!user,
  });
}

/**
 * Get issue status display info
 */
export function getIssueStatusInfo(status: DeliveryIssue['status']): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'open':
      return { label: 'Open', color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
    case 'investigating':
      return { label: 'Under Investigation', color: 'text-blue-700', bgColor: 'bg-blue-100' };
    case 'resolved':
      return { label: 'Resolved', color: 'text-green-700', bgColor: 'bg-green-100' };
    case 'closed':
      return { label: 'Closed', color: 'text-gray-700', bgColor: 'bg-gray-100' };
    default:
      return { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
  }
}

export const ISSUE_TYPES = [
  { value: 'not_delivered', label: 'Order Not Delivered', description: 'I never received my order' },
  { value: 'wrong_location', label: 'Wrong Location', description: 'Order was delivered to wrong address' },
  { value: 'damaged', label: 'Damaged Items', description: 'Items arrived damaged or spilled' },
  { value: 'missing_items', label: 'Missing Items', description: 'Some items were missing from my order' },
  { value: 'wrong_order', label: 'Wrong Order', description: 'I received someone else\'s order' },
  { value: 'late', label: 'Extremely Late', description: 'Order arrived significantly later than estimated' },
  { value: 'unprofessional', label: 'Unprofessional Driver', description: 'Driver was rude or unprofessional' },
  { value: 'other', label: 'Other Issue', description: 'Other issue not listed above' },
];
