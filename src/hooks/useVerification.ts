import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type VerificationType = 'identity' | 'background' | 'vehicle' | 'insurance' | 'license';
export type VerificationStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'expired';

export interface VerificationRequest {
  id: string;
  user_id: string;
  verification_type: VerificationType;
  provider: string | null;
  provider_reference: string | null;
  status: VerificationStatus;
  documents: string[];
  result_data: Record<string, any> | null;
  rejection_reason: string | null;
  submitted_at: string;
  processed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface BackgroundCheck {
  id: string;
  user_id: string;
  verification_request_id: string | null;
  check_type: 'criminal' | 'driving' | 'employment' | 'education';
  provider: string;
  status: 'pending' | 'clear' | 'review' | 'fail';
  result_summary: string | null;
  full_report_url: string | null;
  checked_at: string | null;
  valid_until: string | null;
  created_at: string;
}

export interface VehicleInspection {
  id: string;
  driver_id: string;
  vehicle_id: string | null;
  inspection_type: 'initial' | 'annual' | 'spot_check' | 'post_accident';
  scheduled_date: string | null;
  scheduled_time: string | null;
  location: string | null;
  status: 'scheduled' | 'completed' | 'passed' | 'failed' | 'cancelled' | 'no_show';
  inspector_name: string | null;
  checklist_results: Record<string, any>;
  overall_score: number | null;
  pass_threshold: number;
  photos: string[];
  notes: string | null;
  inspected_at: string | null;
  next_inspection_due: string | null;
  created_at: string;
}

export interface InsuranceRecord {
  id: string;
  user_id: string;
  driver_id: string | null;
  insurance_type: 'vehicle' | 'liability' | 'cargo' | 'health';
  provider_name: string;
  policy_number: string;
  coverage_amount: number | null;
  deductible: number | null;
  coverage_details: Record<string, any> | null;
  effective_date: string;
  expiry_date: string;
  is_verified: boolean;
  verified_at: string | null;
  document_url: string | null;
  created_at: string;
}

/**
 * Get user's verification requests
 */
export function useVerificationRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['verification-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as VerificationRequest[];
    },
    enabled: !!user,
  });
}

/**
 * Get verification status summary
 */
export function useVerificationStatus() {
  const { data: requests } = useVerificationRequests();

  if (!requests) return null;

  const statusMap: Record<VerificationType, VerificationRequest | undefined> = {
    identity: requests.find((r) => r.verification_type === 'identity'),
    background: requests.find((r) => r.verification_type === 'background'),
    vehicle: requests.find((r) => r.verification_type === 'vehicle'),
    insurance: requests.find((r) => r.verification_type === 'insurance'),
    license: requests.find((r) => r.verification_type === 'license'),
  };

  const isFullyVerified = Object.values(statusMap).every(
    (r) => r?.status === 'approved' && (!r.expires_at || new Date(r.expires_at) > new Date())
  );

  return {
    requests: statusMap,
    isFullyVerified,
    pendingCount: requests.filter((r) => r.status === 'pending').length,
    expiringSoon: requests.filter(
      (r) =>
        r.expires_at &&
        new Date(r.expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ),
  };
}

/**
 * Submit verification request
 */
export function useSubmitVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      verificationType,
      documents,
    }: {
      verificationType: VerificationType;
      documents: File[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Upload documents
      const documentUrls: string[] = [];

      for (const file of documents) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}_${verificationType}_${Date.now()}.${fileExt}`;
        const storagePath = `verification-docs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('private-documents')
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        documentUrls.push(storagePath);
      }

      // Create verification request
      const { data, error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          verification_type: verificationType,
          documents: documentUrls,
          status: 'pending',
          provider: 'manual', // Could be 'veriff', 'checkr' for automated
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      toast({
        title: 'Verification Submitted',
        description: 'Your documents are being reviewed. This usually takes 1-2 business days.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get background checks
 */
export function useBackgroundChecks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['background-checks', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('background_checks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as BackgroundCheck[];
    },
    enabled: !!user,
  });
}

/**
 * Get vehicle inspections for a driver
 */
export function useVehicleInspections(driverId: string) {
  return useQuery({
    queryKey: ['vehicle-inspections', driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_inspections')
        .select('*')
        .eq('driver_id', driverId)
        .order('scheduled_date', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as VehicleInspection[];
    },
    enabled: !!driverId,
  });
}

/**
 * Schedule vehicle inspection
 */
export function useScheduleInspection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      driverId,
      vehicleId,
      inspectionType,
      scheduledDate,
      scheduledTime,
      location,
    }: {
      driverId: string;
      vehicleId?: string;
      inspectionType: VehicleInspection['inspection_type'];
      scheduledDate: string;
      scheduledTime?: string;
      location?: string;
    }) => {
      const { data, error } = await supabase
        .from('vehicle_inspections')
        .insert({
          driver_id: driverId,
          vehicle_id: vehicleId,
          inspection_type: inspectionType,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          location,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-inspections', variables.driverId] });
      toast({
        title: 'Inspection Scheduled',
        description: 'Your vehicle inspection has been booked.',
      });
    },
  });
}

/**
 * Get insurance records
 */
export function useInsuranceRecords() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['insurance-records', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('insurance_records')
        .select('*')
        .eq('user_id', user.id)
        .order('expiry_date', { ascending: true });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as InsuranceRecord[];
    },
    enabled: !!user,
  });
}

/**
 * Add insurance record
 */
export function useAddInsurance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      insuranceType,
      providerName,
      policyNumber,
      coverageAmount,
      deductible,
      effectiveDate,
      expiryDate,
      documentFile,
      driverId,
    }: {
      insuranceType: InsuranceRecord['insurance_type'];
      providerName: string;
      policyNumber: string;
      coverageAmount?: number;
      deductible?: number;
      effectiveDate: string;
      expiryDate: string;
      documentFile?: File;
      driverId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      let documentUrl: string | null = null;

      if (documentFile) {
        const fileExt = documentFile.name.split('.').pop();
        const fileName = `${user.id}_insurance_${Date.now()}.${fileExt}`;
        const storagePath = `insurance-docs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('private-documents')
          .upload(storagePath, documentFile);

        if (uploadError) throw uploadError;
        documentUrl = storagePath;
      }

      const { data, error } = await supabase
        .from('insurance_records')
        .insert({
          user_id: user.id,
          driver_id: driverId,
          insurance_type: insuranceType,
          provider_name: providerName,
          policy_number: policyNumber,
          coverage_amount: coverageAmount,
          deductible,
          effective_date: effectiveDate,
          expiry_date: expiryDate,
          document_url: documentUrl,
          is_verified: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-records'] });
      toast({
        title: 'Insurance Added',
        description: 'Your insurance record has been saved.',
      });
    },
  });
}

export const VERIFICATION_TYPES = [
  { value: 'identity', label: 'Identity Verification', description: 'Verify your ID or passport' },
  { value: 'background', label: 'Background Check', description: 'Criminal record check' },
  { value: 'vehicle', label: 'Vehicle Documents', description: 'Registration and roadworthy' },
  { value: 'insurance', label: 'Insurance', description: 'Vehicle and liability insurance' },
  { value: 'license', label: 'Driving License', description: "Valid driver's license" },
] as const;

export const INSURANCE_TYPES = [
  { value: 'vehicle', label: 'Vehicle Insurance' },
  { value: 'liability', label: 'Public Liability' },
  { value: 'cargo', label: 'Cargo Insurance' },
  { value: 'health', label: 'Health Insurance' },
] as const;

export const INSPECTION_CHECKLIST = [
  { id: 'lights', label: 'Lights working', category: 'exterior' },
  { id: 'tires', label: 'Tires in good condition', category: 'exterior' },
  { id: 'mirrors', label: 'Mirrors intact', category: 'exterior' },
  { id: 'brakes', label: 'Brakes functional', category: 'safety' },
  { id: 'seatbelts', label: 'Seatbelts working', category: 'safety' },
  { id: 'horn', label: 'Horn working', category: 'safety' },
  { id: 'interior_clean', label: 'Interior clean', category: 'interior' },
  { id: 'ac_working', label: 'AC/Heater working', category: 'interior' },
  { id: 'odometer', label: 'Odometer functional', category: 'dashboard' },
] as const;
