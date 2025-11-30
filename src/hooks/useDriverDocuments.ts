import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  expiry_date: string | null;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  validityMonths: number | null;
  icon: string;
}

// Standard document types for drivers
export const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'drivers_license',
    name: "Driver's License",
    description: 'Valid South African driver\'s license (PrDP if applicable)',
    required: true,
    validityMonths: null, // Validity varies
    icon: 'id-card',
  },
  {
    id: 'id_document',
    name: 'ID Document',
    description: 'South African ID or passport',
    required: true,
    validityMonths: null,
    icon: 'credit-card',
  },
  {
    id: 'vehicle_registration',
    name: 'Vehicle Registration',
    description: 'Vehicle registration document',
    required: true,
    validityMonths: 12,
    icon: 'car',
  },
  {
    id: 'vehicle_license_disc',
    name: 'Vehicle License Disc',
    description: 'Current vehicle license disc',
    required: true,
    validityMonths: 12,
    icon: 'badge-check',
  },
  {
    id: 'roadworthy_certificate',
    name: 'Roadworthy Certificate',
    description: 'Valid roadworthy certificate',
    required: true,
    validityMonths: 12,
    icon: 'shield-check',
  },
  {
    id: 'insurance_certificate',
    name: 'Insurance Certificate',
    description: 'Comprehensive vehicle insurance',
    required: true,
    validityMonths: 12,
    icon: 'file-shield',
  },
  {
    id: 'police_clearance',
    name: 'Police Clearance',
    description: 'SAPS police clearance certificate',
    required: true,
    validityMonths: 24,
    icon: 'fingerprint',
  },
  {
    id: 'proof_of_address',
    name: 'Proof of Address',
    description: 'Utility bill or bank statement (less than 3 months old)',
    required: true,
    validityMonths: 3,
    icon: 'home',
  },
  {
    id: 'profile_photo',
    name: 'Profile Photo',
    description: 'Clear photo of your face',
    required: true,
    validityMonths: null,
    icon: 'user',
  },
  {
    id: 'vehicle_photo_front',
    name: 'Vehicle Photo (Front)',
    description: 'Clear front photo of your vehicle',
    required: true,
    validityMonths: null,
    icon: 'camera',
  },
  {
    id: 'vehicle_photo_interior',
    name: 'Vehicle Photo (Interior)',
    description: 'Interior photo showing cleanliness',
    required: false,
    validityMonths: null,
    icon: 'camera',
  },
];

export interface DocumentStatus {
  type: DocumentType;
  document: DriverDocument | null;
  status: 'missing' | 'pending' | 'approved' | 'rejected' | 'expiring' | 'expired';
  daysUntilExpiry: number | null;
}

/**
 * Hook to get driver's document status
 */
export function useDriverDocuments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['driver-documents', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get driver ID
      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!driver) return [];

      const { data, error } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_id', driver.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return (data || []) as DriverDocument[];
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Hook to get comprehensive document status
 */
export function useDocumentStatus() {
  const { data: documents = [], isLoading } = useDriverDocuments();

  const status: DocumentStatus[] = DOCUMENT_TYPES.map((type) => {
    // Get the most recent document of this type
    const doc = documents.find((d) => d.document_type === type.id);

    let docStatus: DocumentStatus['status'] = 'missing';
    let daysUntilExpiry: number | null = null;

    if (doc) {
      if (doc.status === 'pending') {
        docStatus = 'pending';
      } else if (doc.status === 'rejected') {
        docStatus = 'rejected';
      } else if (doc.status === 'approved') {
        if (doc.expiry_date) {
          const expiry = new Date(doc.expiry_date);
          const today = new Date();
          const diffTime = expiry.getTime() - today.getTime();
          daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (daysUntilExpiry <= 0) {
            docStatus = 'expired';
          } else if (daysUntilExpiry <= 30) {
            docStatus = 'expiring';
          } else {
            docStatus = 'approved';
          }
        } else {
          docStatus = 'approved';
        }
      }
    }

    return {
      type,
      document: doc || null,
      status: docStatus,
      daysUntilExpiry,
    };
  });

  // Calculate summary stats
  const summary = {
    total: DOCUMENT_TYPES.filter((t) => t.required).length,
    approved: status.filter((s) => s.type.required && s.status === 'approved').length,
    pending: status.filter((s) => s.status === 'pending').length,
    expiring: status.filter((s) => s.status === 'expiring').length,
    expired: status.filter((s) => s.status === 'expired').length,
    missing: status.filter((s) => s.type.required && s.status === 'missing').length,
    rejected: status.filter((s) => s.status === 'rejected').length,
  };

  const isComplete = summary.approved === summary.total && summary.expired === 0;
  const hasUrgentItems = summary.expiring > 0 || summary.expired > 0 || summary.rejected > 0;

  return {
    documents: status,
    summary,
    isComplete,
    hasUrgentItems,
    isLoading,
  };
}

/**
 * Hook to upload a new document
 */
export function useUploadDocument() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentType,
      file,
      expiryDate,
    }: {
      documentType: string;
      file: File;
      expiryDate?: Date;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Get driver ID
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (driverError || !driver) {
        throw new Error('Driver profile not found');
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${driver.id}/${documentType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('driver-documents')
        .getPublicUrl(fileName);

      // Create document record
      const { data, error } = await supabase
        .from('driver_documents')
        .insert({
          driver_id: driver.id,
          document_type: documentType,
          document_url: urlData.publicUrl,
          expiry_date: expiryDate?.toISOString().split('T')[0] || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-documents'] });
      toast({
        title: 'Document Uploaded',
        description: 'Your document has been submitted for review.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete a document
 */
export function useDeleteDocument() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('driver_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-documents'] });
      toast({
        title: 'Document Deleted',
        description: 'The document has been removed.',
      });
    },
    onError: () => {
      toast({
        title: 'Delete Failed',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for admin to verify documents
 */
export function useVerifyDocument() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      action,
      rejectionReason,
    }: {
      documentId: string;
      action: 'approve' | 'reject';
      rejectionReason?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const updates: Partial<DriverDocument> = {
        status: action === 'approve' ? 'approved' : 'rejected',
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        ...(action === 'reject' && { rejection_reason: rejectionReason }),
      };

      const { error } = await supabase
        .from('driver_documents')
        .update(updates)
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['driver-documents'] });
      queryClient.invalidateQueries({ queryKey: ['pending-documents'] });
      toast({
        title: variables.action === 'approve' ? 'Document Approved' : 'Document Rejected',
        description:
          variables.action === 'approve'
            ? 'The document has been verified.'
            : 'The driver has been notified.',
      });
    },
    onError: () => {
      toast({
        title: 'Verification Failed',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to get pending documents for admin review
 */
export function usePendingDocuments() {
  return useQuery({
    queryKey: ['pending-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_documents')
        .select(`
          *,
          driver:drivers(
            id,
            user_id,
            vehicle_make,
            vehicle_model,
            profile:profiles!drivers_user_id_fkey(full_name, email)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data || [];
    },
    refetchInterval: 30000,
  });
}

/**
 * Hook to get documents expiring soon
 */
export function useExpiringDocuments(daysAhead: number = 30) {
  return useQuery({
    queryKey: ['expiring-documents', daysAhead],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await supabase
        .from('driver_documents')
        .select(`
          *,
          driver:drivers(
            id,
            user_id,
            profile:profiles!drivers_user_id_fkey(full_name, email)
          )
        `)
        .eq('status', 'approved')
        .not('expiry_date', 'is', null)
        .lte('expiry_date', futureDate.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data || [];
    },
    refetchInterval: 60000,
  });
}

/**
 * Hook to send expiry reminders (admin function)
 */
export function useSendExpiryReminders() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (documentIds: string[]) => {
      // In a real implementation, this would call an edge function
      // to send email/push notifications
      const { error } = await supabase.functions.invoke('send-document-reminders', {
        body: { documentIds },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Reminders Sent',
        description: 'Expiry reminders have been sent to drivers.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to Send Reminders',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for automatic expiry checking with notifications
 */
export function useExpiryAlerts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { documents, hasUrgentItems } = useDocumentStatus();

  useEffect(() => {
    if (!user || !hasUrgentItems) return;

    // Check for expired documents
    const expired = documents.filter((d) => d.status === 'expired');
    const expiring = documents.filter((d) => d.status === 'expiring');

    if (expired.length > 0) {
      toast({
        title: 'Documents Expired!',
        description: `${expired.length} document(s) have expired. Please upload new documents to continue driving.`,
        variant: 'destructive',
      });
    } else if (expiring.length > 0) {
      toast({
        title: 'Documents Expiring Soon',
        description: `${expiring.length} document(s) will expire within 30 days. Please renew them soon.`,
      });
    }
  }, [user, hasUrgentItems]);
}

/**
 * Format document type for display
 */
export function getDocumentTypeInfo(typeId: string): DocumentType | undefined {
  return DOCUMENT_TYPES.find((t) => t.id === typeId);
}

/**
 * Get status badge color
 */
export function getStatusColor(status: DocumentStatus['status']): string {
  switch (status) {
    case 'approved':
      return 'bg-green-500';
    case 'pending':
      return 'bg-yellow-500';
    case 'expiring':
      return 'bg-orange-500';
    case 'expired':
      return 'bg-red-500';
    case 'rejected':
      return 'bg-red-500';
    case 'missing':
    default:
      return 'bg-gray-400';
  }
}

/**
 * Format expiry date for display
 */
export function formatExpiryDate(dateStr: string | null): string {
  if (!dateStr) return 'No expiry';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
