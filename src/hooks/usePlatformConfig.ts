import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ApiConfiguration {
  id: string;
  service_name: string;
  service_category: string;
  display_name: string;
  description: string | null;
  api_key: string | null;
  api_secret: string | null;
  webhook_url: string | null;
  webhook_secret: string | null;
  environment: 'sandbox' | 'production';
  is_enabled: boolean;
  config_json: Record<string, any>;
  last_tested_at: string | null;
  test_status: string | null;
  test_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommissionRate {
  id: string;
  entity_type: 'restaurant' | 'driver' | 'hotel' | 'venue';
  tier_name: string;
  commission_percentage: number;
  min_commission: number | null;
  max_commission: number | null;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformFee {
  id: string;
  fee_name: string;
  fee_type: 'percentage' | 'fixed' | 'tiered';
  fee_category: string;
  base_amount: number | null;
  percentage: number | null;
  min_amount: number | null;
  max_amount: number | null;
  tier_config: Record<string, any> | null;
  applies_to: string[];
  is_taxable: boolean;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  target_users: string[] | null;
  target_regions: string[] | null;
  target_user_types: string[] | null;
  config_json: Record<string, any>;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  display_name: string;
  description: string | null;
  is_sensitive: boolean;
  validation_rules: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalWorkflow {
  id: string;
  workflow_type: string;
  workflow_name: string;
  description: string | null;
  required_approvals: number;
  auto_approve_threshold: number | null;
  auto_reject_conditions: Record<string, any> | null;
  escalation_hours: number | null;
  escalation_to: string[] | null;
  notification_config: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApprovalQueueItem {
  id: string;
  workflow_type: string;
  entity_type: string;
  entity_id: string;
  requester_id: string | null;
  request_data: Record<string, any>;
  priority: number;
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'expired';
  assigned_to: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationRequirement {
  id: string;
  entity_type: string;
  requirement_type: string;
  is_mandatory: boolean;
  expiry_days: number | null;
  verification_provider: string | null;
  auto_approve_score: number | null;
  manual_review_score: number | null;
  rejection_score: number | null;
  cost: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OperationalLimit {
  id: string;
  limit_name: string;
  limit_type: string;
  limit_category: string;
  limit_value: number;
  time_window_minutes: number | null;
  applies_to: string[] | null;
  action_on_exceed: 'block' | 'warn' | 'queue' | 'throttle';
  notification_threshold: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceRegion {
  id: string;
  region_name: string;
  region_code: string;
  country_code: string;
  timezone: string;
  currency_code: string;
  center_lat: number | null;
  center_lng: number | null;
  boundary_polygon: Record<string, any> | null;
  services_available: string[];
  is_active: boolean;
  launch_date: string | null;
  operating_hours: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutConfig {
  id: string;
  entity_type: string;
  payout_frequency: string;
  payout_day: number | null;
  min_payout_amount: number;
  max_payout_amount: number | null;
  hold_period_days: number;
  auto_payout_enabled: boolean;
  payout_methods: string[];
  transaction_fee: number | null;
  transaction_fee_percentage: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConfigAuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'create' | 'update' | 'delete';
  changed_by: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SurgePricingConfig {
  id: string;
  service_type: string;
  trigger_type: string;
  trigger_conditions: Record<string, any>;
  multiplier_min: number;
  multiplier_max: number;
  increment_step: number;
  cooldown_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  template_key: string;
  template_name: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  subject: string | null;
  body_template: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportCategory {
  id: string;
  category_name: string;
  category_key: string;
  parent_id: string | null;
  priority: number;
  auto_response: string | null;
  routing_team: string | null;
  sla_hours: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// =============================================================================
// LEGACY PLATFORM CONFIG (for backward compatibility)
// =============================================================================

export interface PlatformConfig {
  food: {
    platformCommissionRate: number;
    serviceFeeRate: number;
    deliveryBaseFee: number;
    deliveryPerKmFee: number;
    minimumOrderDefault: number;
    taxRate: number;
    deliveryPartnerRate: number;
    deliveryPartnerPlatformFee: number;
  };
  hotels: {
    platformCommissionRate: number;
    serviceFeeFlat: number;
    vatRate: number;
    cancellationPeriodHours: number;
    instantBookingEnabled: boolean;
  };
  venues: {
    platformCommissionRate: number;
    experienceCommissionRate: number;
    serviceFeeRate: number;
    privateBookingMultiplier: number;
  };
  rides: {
    budgetBaseFare: number;
    budgetPerKmRate: number;
    enhancedBaseFare: number;
    enhancedPerKmRate: number;
    premiumBaseFare: number;
    premiumPerKmRate: number;
    luxuryBaseFare: number;
    luxuryPerKmRate: number;
    platformCommissionRate: number;
    surgePricingEnabled: boolean;
    surgePricingMultiplier: number;
  };
  loyalty: {
    pointsPerRand: number;
    pointValueInRand: number;
    bronzeThreshold: number;
    silverThreshold: number;
    goldThreshold: number;
    platinumThreshold: number;
    bronzeMultiplier: number;
    silverMultiplier: number;
    goldMultiplier: number;
    platinumMultiplier: number;
  };
  payments: {
    payfastMerchantId: string;
    payfastMerchantKey: string;
    payfastPassphrase: string;
    sandboxMode: boolean;
    walletEnabled: boolean;
    maxWalletBalance: number;
  };
  platform: {
    maintenanceMode: boolean;
    newRegistrationsEnabled: boolean;
    provinces: string[];
    supportEmail: string;
    supportPhone: string;
    emergencyNumbers: {
      saps: string;
      ambulance: string;
      universal: string;
    };
  };
}

const DEFAULT_CONFIG: PlatformConfig = {
  food: {
    platformCommissionRate: 15,
    serviceFeeRate: 4.5,
    deliveryBaseFee: 25,
    deliveryPerKmFee: 5,
    minimumOrderDefault: 50,
    taxRate: 15,
    deliveryPartnerRate: 85,
    deliveryPartnerPlatformFee: 15,
  },
  hotels: {
    platformCommissionRate: 12,
    serviceFeeFlat: 50,
    vatRate: 15,
    cancellationPeriodHours: 24,
    instantBookingEnabled: true,
  },
  venues: {
    platformCommissionRate: 10,
    experienceCommissionRate: 15,
    serviceFeeRate: 5,
    privateBookingMultiplier: 1.5,
  },
  rides: {
    budgetBaseFare: 15,
    budgetPerKmRate: 8.5,
    enhancedBaseFare: 20,
    enhancedPerKmRate: 10,
    premiumBaseFare: 30,
    premiumPerKmRate: 12.5,
    luxuryBaseFare: 50,
    luxuryPerKmRate: 18,
    platformCommissionRate: 20,
    surgePricingEnabled: false,
    surgePricingMultiplier: 1.5,
  },
  loyalty: {
    pointsPerRand: 0.1,
    pointValueInRand: 0.1,
    bronzeThreshold: 0,
    silverThreshold: 1000,
    goldThreshold: 5000,
    platinumThreshold: 10000,
    bronzeMultiplier: 1,
    silverMultiplier: 1.25,
    goldMultiplier: 1.5,
    platinumMultiplier: 2,
  },
  payments: {
    payfastMerchantId: '',
    payfastMerchantKey: '',
    payfastPassphrase: '',
    sandboxMode: true,
    walletEnabled: true,
    maxWalletBalance: 10000,
  },
  platform: {
    maintenanceMode: false,
    newRegistrationsEnabled: true,
    provinces: [
      'Gauteng',
      'Western Cape',
      'KwaZulu-Natal',
      'Eastern Cape',
      'Free State',
      'Limpopo',
      'Mpumalanga',
      'Northern Cape',
      'North West',
    ],
    supportEmail: 'support@eatlocal.co.za',
    supportPhone: '0800 123 456',
    emergencyNumbers: {
      saps: '10111',
      ambulance: '10177',
      universal: '112',
    },
  },
};

// =============================================================================
// API CONFIGURATIONS
// =============================================================================

export function useApiConfigurations(category?: string) {
  return useQuery({
    queryKey: ['api-configurations', category],
    queryFn: async () => {
      let query = (supabase as any)
        .from('api_configurations')
        .select('*')
        .order('service_category', { ascending: true });

      if (category) {
        query = query.eq('service_category', category);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as ApiConfiguration[];
    },
  });
}

export function useUpdateApiConfiguration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<ApiConfiguration, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await (supabase as any)
        .from('api_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-configurations'] });
      toast({ title: 'API Configuration Updated' });
    },
  });
}

export function useTestApiConnection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (serviceId: string) => {
      // In production, this would call an edge function to test the connection
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const testResult = Math.random() > 0.2;

      await (supabase as any)
        .from('api_configurations')
        .update({
          last_tested_at: new Date().toISOString(),
          test_status: testResult ? 'success' : 'failed',
          test_message: testResult ? 'Connection successful' : 'Connection failed - check credentials',
        })
        .eq('id', serviceId);

      return { success: testResult };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['api-configurations'] });
      toast({
        title: result.success ? 'Connection Successful' : 'Connection Failed',
        variant: result.success ? 'default' : 'destructive',
      });
    },
  });
}

// =============================================================================
// COMMISSION RATES
// =============================================================================

export function useCommissionRates(entityType?: string) {
  return useQuery({
    queryKey: ['commission-rates', entityType],
    queryFn: async () => {
      let query = (supabase as any)
        .from('commission_rates')
        .select('*')
        .eq('is_active', true)
        .order('entity_type', { ascending: true });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as CommissionRate[];
    },
  });
}

export function useUpdateCommissionRate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<CommissionRate, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await (supabase as any)
        .from('commission_rates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rates'] });
      toast({ title: 'Commission Rate Updated' });
    },
  });
}

export function useCreateCommissionRate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rate: Omit<CommissionRate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any).from('commission_rates').insert(rate).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rates'] });
      toast({ title: 'Commission Rate Created' });
    },
  });
}

// =============================================================================
// PLATFORM FEES
// =============================================================================

export function usePlatformFees(category?: string) {
  return useQuery({
    queryKey: ['platform-fees', category],
    queryFn: async () => {
      let query = (supabase as any).from('platform_fees').select('*').order('fee_category', { ascending: true });

      if (category) {
        query = query.eq('fee_category', category);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as PlatformFee[];
    },
  });
}

export function useUpdatePlatformFee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<PlatformFee, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await (supabase as any).from('platform_fees').update(updates).eq('id', id).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-fees'] });
      toast({ title: 'Platform Fee Updated' });
    },
  });
}

export function useCreatePlatformFee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fee: Omit<PlatformFee, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any).from('platform_fees').insert(fee).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-fees'] });
      toast({ title: 'Platform Fee Created' });
    },
  });
}

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('feature_flags').select('*').order('flag_name', { ascending: true });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as FeatureFlag[];
    },
  });
}

export function useFeatureFlag(flagKey: string) {
  return useQuery({
    queryKey: ['feature-flag', flagKey],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('feature_flags').select('*').eq('flag_key', flagKey).maybeSingle();

      if (error) {
        if (error.code === '42P01') return null;
        throw error;
      }

      return data as FeatureFlag | null;
    },
    enabled: !!flagKey,
  });
}

export function useUpdateFeatureFlag() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<FeatureFlag, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await (supabase as any).from('feature_flags').update(updates).eq('id', id).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['feature-flag'] });
      toast({ title: 'Feature Flag Updated' });
    },
  });
}

export function useCreateFeatureFlag() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flag: Omit<FeatureFlag, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any).from('feature_flags').insert(flag).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast({ title: 'Feature Flag Created' });
    },
  });
}

export function useIsFeatureEnabled(flagKey: string) {
  const { user } = useAuth();
  const { data: flag } = useFeatureFlag(flagKey);

  if (!flag) return false;
  if (!flag.is_enabled) return false;

  if (flag.rollout_percentage < 100) {
    if (!user) return false;
    const hash = user.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const bucket = Math.abs(hash) % 100;
    if (bucket >= flag.rollout_percentage) return false;
  }

  if (flag.target_users && flag.target_users.length > 0) {
    if (!user || !flag.target_users.includes(user.id)) return false;
  }

  return true;
}

// =============================================================================
// SYSTEM SETTINGS
// =============================================================================

export function useSystemSettings(category?: string) {
  return useQuery({
    queryKey: ['system-settings', category],
    queryFn: async () => {
      let query = (supabase as any).from('system_settings').select('*').order('category', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as SystemSetting[];
    },
  });
}

export function useSystemSetting(key: string) {
  return useQuery({
    queryKey: ['system-setting', key],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('system_settings').select('*').eq('setting_key', key).maybeSingle();

      if (error) {
        if (error.code === '42P01') return null;
        throw error;
      }

      return data as SystemSetting | null;
    },
    enabled: !!key,
  });
}

export function useUpdateSystemSetting() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data, error } = await (supabase as any)
        .from('system_settings')
        .update({ setting_value: value })
        .eq('setting_key', key)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['system-setting'] });
      toast({ title: 'Setting Updated' });
    },
  });
}

// =============================================================================
// APPROVAL WORKFLOWS
// =============================================================================

export function useApprovalWorkflows() {
  return useQuery({
    queryKey: ['approval-workflows'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('approval_workflows')
        .select('*')
        .order('workflow_name', { ascending: true });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as ApprovalWorkflow[];
    },
  });
}

export function useUpdateApprovalWorkflow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<ApprovalWorkflow, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await (supabase as any)
        .from('approval_workflows')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
      toast({ title: 'Workflow Updated' });
    },
  });
}

// =============================================================================
// APPROVAL QUEUE
// =============================================================================

export function useApprovalQueue(status?: string) {
  return useQuery({
    queryKey: ['approval-queue', status],
    queryFn: async () => {
      let query = (supabase as any)
        .from('approval_queue')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as ApprovalQueueItem[];
    },
  });
}

export function useApproveRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('approval_queue')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
      toast({ title: 'Request Approved' });
    },
  });
}

export function useRejectRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('approval_queue')
        .update({
          status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
      toast({ title: 'Request Rejected' });
    },
  });
}

// =============================================================================
// VERIFICATION REQUIREMENTS
// =============================================================================

export function useVerificationRequirements(entityType?: string) {
  return useQuery({
    queryKey: ['verification-requirements', entityType],
    queryFn: async () => {
      let query = (supabase as any)
        .from('verification_requirements')
        .select('*')
        .order('entity_type', { ascending: true });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as VerificationRequirement[];
    },
  });
}

export function useUpdateVerificationRequirement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<VerificationRequirement, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await (supabase as any)
        .from('verification_requirements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-requirements'] });
      toast({ title: 'Verification Requirement Updated' });
    },
  });
}

// =============================================================================
// OPERATIONAL LIMITS
// =============================================================================

export function useOperationalLimits(category?: string) {
  return useQuery({
    queryKey: ['operational-limits', category],
    queryFn: async () => {
      let query = (supabase as any)
        .from('operational_limits')
        .select('*')
        .order('limit_category', { ascending: true });

      if (category) {
        query = query.eq('limit_category', category);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as OperationalLimit[];
    },
  });
}

export function useUpdateOperationalLimit() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<OperationalLimit, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await (supabase as any)
        .from('operational_limits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-limits'] });
      toast({ title: 'Operational Limit Updated' });
    },
  });
}

// =============================================================================
// SERVICE REGIONS
// =============================================================================

export function useServiceRegions(activeOnly = true) {
  return useQuery({
    queryKey: ['service-regions', activeOnly],
    queryFn: async () => {
      let query = (supabase as any).from('service_regions').select('*').order('region_name', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as ServiceRegion[];
    },
  });
}

export function useUpdateServiceRegion() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<ServiceRegion, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await (supabase as any).from('service_regions').update(updates).eq('id', id).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-regions'] });
      toast({ title: 'Service Region Updated' });
    },
  });
}

export function useCreateServiceRegion() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (region: Omit<ServiceRegion, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any).from('service_regions').insert(region).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-regions'] });
      toast({ title: 'Service Region Created' });
    },
  });
}

// =============================================================================
// PAYOUT CONFIGURATION
// =============================================================================

export function usePayoutConfigs() {
  return useQuery({
    queryKey: ['payout-configs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('payout_config')
        .select('*')
        .order('entity_type', { ascending: true });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as PayoutConfig[];
    },
  });
}

export function useUpdatePayoutConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<PayoutConfig, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await (supabase as any).from('payout_config').update(updates).eq('id', id).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-configs'] });
      toast({ title: 'Payout Configuration Updated' });
    },
  });
}

// =============================================================================
// SURGE PRICING
// =============================================================================

export function useSurgePricingConfigs() {
  return useQuery({
    queryKey: ['surge-pricing-configs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('surge_pricing_config')
        .select('*')
        .order('service_type', { ascending: true });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as SurgePricingConfig[];
    },
  });
}

export function useUpdateSurgePricing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<SurgePricingConfig, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await (supabase as any)
        .from('surge_pricing_config')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surge-pricing-configs'] });
      toast({ title: 'Surge Pricing Updated' });
    },
  });
}

// =============================================================================
// NOTIFICATION TEMPLATES
// =============================================================================

export function useNotificationTemplates(channel?: string) {
  return useQuery({
    queryKey: ['notification-templates', channel],
    queryFn: async () => {
      let query = (supabase as any)
        .from('notification_templates')
        .select('*')
        .order('template_name', { ascending: true });

      if (channel) {
        query = query.eq('channel', channel);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as NotificationTemplate[];
    },
  });
}

export function useUpdateNotificationTemplate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await (supabase as any)
        .from('notification_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast({ title: 'Template Updated' });
    },
  });
}

// =============================================================================
// SUPPORT CATEGORIES
// =============================================================================

export function useSupportCategories() {
  return useQuery({
    queryKey: ['support-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('support_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as SupportCategory[];
    },
  });
}

// =============================================================================
// CONFIG AUDIT LOG
// =============================================================================

export function useConfigAuditLog(tableName?: string, limit = 100) {
  return useQuery({
    queryKey: ['config-audit-log', tableName, limit],
    queryFn: async () => {
      let query = (supabase as any)
        .from('config_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as ConfigAuditLog[];
    },
  });
}

// =============================================================================
// DASHBOARD STATS
// =============================================================================

export function usePlatformOverview() {
  return useQuery({
    queryKey: ['platform-overview'],
    queryFn: async () => {
      const [pendingApprovals, activeFeatures, enabledServices, activeRegions] = await Promise.all([
        (supabase as any).from('approval_queue').select('id', { count: 'exact' }).eq('status', 'pending'),
        (supabase as any).from('feature_flags').select('id', { count: 'exact' }).eq('is_enabled', true),
        (supabase as any).from('api_configurations').select('id', { count: 'exact' }).eq('is_enabled', true),
        (supabase as any).from('service_regions').select('id', { count: 'exact' }).eq('is_active', true),
      ]);

      return {
        pendingApprovals: pendingApprovals.count || 0,
        activeFeatures: activeFeatures.count || 0,
        enabledServices: enabledServices.count || 0,
        activeRegions: activeRegions.count || 0,
      };
    },
  });
}

// =============================================================================
// LEGACY PLATFORM CONFIG (backward compatibility)
// =============================================================================

const CONFIG_KEY = 'eatlocal-platform-config';

const loadConfig = (): PlatformConfig => {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        food: { ...DEFAULT_CONFIG.food, ...parsed.food },
        hotels: { ...DEFAULT_CONFIG.hotels, ...parsed.hotels },
        venues: { ...DEFAULT_CONFIG.venues, ...parsed.venues },
        rides: { ...DEFAULT_CONFIG.rides, ...parsed.rides },
        loyalty: { ...DEFAULT_CONFIG.loyalty, ...parsed.loyalty },
        payments: { ...DEFAULT_CONFIG.payments, ...parsed.payments },
        platform: { ...DEFAULT_CONFIG.platform, ...parsed.platform },
      };
    }
  } catch {
    console.error('Failed to load platform config');
  }
  return DEFAULT_CONFIG;
};

const saveConfig = (config: PlatformConfig): void => {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    console.error('Failed to save platform config');
  }
};

export function usePlatformConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery({
    queryKey: ['platform-config'],
    queryFn: loadConfig,
    staleTime: Infinity,
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (updates: Partial<PlatformConfig>) => {
      const current = loadConfig();
      const newConfig = {
        ...current,
        ...updates,
        food: { ...current.food, ...(updates.food || {}) },
        hotels: { ...current.hotels, ...(updates.hotels || {}) },
        venues: { ...current.venues, ...(updates.venues || {}) },
        rides: { ...current.rides, ...(updates.rides || {}) },
        loyalty: { ...current.loyalty, ...(updates.loyalty || {}) },
        payments: { ...current.payments, ...(updates.payments || {}) },
        platform: { ...current.platform, ...(updates.platform || {}) },
      };
      saveConfig(newConfig);
      return newConfig;
    },
    onSuccess: (newConfig) => {
      queryClient.setQueryData(['platform-config'], newConfig);
      toast({ title: 'Configuration saved successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to save configuration', variant: 'destructive' });
    },
  });

  const resetConfigMutation = useMutation({
    mutationFn: async () => {
      saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    },
    onSuccess: (defaultConfig) => {
      queryClient.setQueryData(['platform-config'], defaultConfig);
      toast({ title: 'Configuration reset to defaults' });
    },
  });

  return {
    config: config || DEFAULT_CONFIG,
    isLoading,
    updateConfig: updateConfigMutation.mutate,
    resetConfig: resetConfigMutation.mutate,
    isUpdating: updateConfigMutation.isPending,
    DEFAULT_CONFIG,
  };
}

// Utility hooks for specific service configs
export function useFoodConfig() {
  const { config } = usePlatformConfig();
  return config.food;
}

export function useHotelConfig() {
  const { config } = usePlatformConfig();
  return config.hotels;
}

export function useVenueConfig() {
  const { config } = usePlatformConfig();
  return config.venues;
}

export function useRidesConfig() {
  const { config } = usePlatformConfig();
  return config.rides;
}

export function useLoyaltyConfig() {
  const { config } = usePlatformConfig();
  return config.loyalty;
}

export function usePaymentConfig() {
  const { config } = usePlatformConfig();
  return config.payments;
}

export function usePlatformSettings() {
  const { config } = usePlatformConfig();
  return config.platform;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const API_SERVICE_CATEGORIES = [
  { value: 'payment', label: 'Payment Gateways', icon: 'CreditCard' },
  { value: 'sms', label: 'SMS & Messaging', icon: 'MessageSquare' },
  { value: 'email', label: 'Email Services', icon: 'Mail' },
  { value: 'maps', label: 'Maps & Geolocation', icon: 'MapPin' },
  { value: 'analytics', label: 'Analytics & Monitoring', icon: 'BarChart' },
  { value: 'storage', label: 'File Storage', icon: 'Database' },
  { value: 'ai', label: 'AI & ML Services', icon: 'Brain' },
  { value: 'notifications', label: 'Push Notifications', icon: 'Bell' },
] as const;

export const FEE_CATEGORIES = [
  { value: 'delivery', label: 'Delivery Fees' },
  { value: 'service', label: 'Service Fees' },
  { value: 'payment', label: 'Payment Processing' },
  { value: 'subscription', label: 'Subscription Fees' },
  { value: 'cancellation', label: 'Cancellation Fees' },
] as const;

export const ENTITY_TYPES = [
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'driver', label: 'Drivers' },
  { value: 'hotel', label: 'Hotels' },
  { value: 'venue', label: 'Venues' },
] as const;

export const SETTING_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'security', label: 'Security' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'limits', label: 'Limits & Thresholds' },
  { value: 'appearance', label: 'Appearance' },
] as const;

export const APPROVAL_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'escalated', label: 'Escalated', color: 'orange' },
  { value: 'expired', label: 'Expired', color: 'gray' },
] as const;

export const PAYOUT_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

export const LIMIT_ACTIONS = [
  { value: 'block', label: 'Block Request' },
  { value: 'warn', label: 'Warn User' },
  { value: 'queue', label: 'Queue for Review' },
  { value: 'throttle', label: 'Throttle/Rate Limit' },
] as const;
