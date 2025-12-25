import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CorporateAccount {
  id: string;
  company_name: string;
  company_size: 'small' | 'medium' | 'large' | 'enterprise';
  industry: string | null;
  billing_email: string;
  billing_address: Record<string, any> | null;
  tax_number: string | null;
  logo_url: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  monthly_budget: number | null;
  per_order_limit: number | null;
  allowed_restaurants: string[];
  blocked_restaurants: string[];
  meal_allowance_type: 'per_day' | 'per_week' | 'per_month';
  meal_allowance_amount: number;
  require_approval_above: number | null;
  approval_workflow: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface CorporateEmployee {
  id: string;
  corporate_id: string;
  user_id: string;
  employee_id: string | null;
  department: string | null;
  role: 'employee' | 'manager' | 'admin' | 'finance';
  cost_center: string | null;
  monthly_spent: number;
  remaining_allowance: number | null;
  is_active: boolean;
  joined_at: string;
  corporate?: CorporateAccount;
}

export interface CorporateOrder {
  id: string;
  order_id: string;
  corporate_id: string;
  employee_id: string | null;
  department: string | null;
  cost_center: string | null;
  approval_status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  approved_by: string | null;
  approved_at: string | null;
  expense_category: string | null;
  notes: string | null;
  created_at: string;
}

export interface CorporateInvoice {
  id: string;
  corporate_id: string;
  invoice_number: string;
  billing_period_start: string;
  billing_period_end: string;
  subtotal: number;
  service_fees: number;
  delivery_fees: number;
  tax: number;
  total: number;
  order_count: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  pdf_url: string | null;
  created_at: string;
}

export interface APIKey {
  id: string;
  corporate_id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  last_used_at: string | null;
  request_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Check if current user is a corporate employee
 */
export function useCorporateMembership() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['corporate-membership', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await (supabase as any)
        .from('corporate_employees')
        .select(`
          *,
          corporate:corporate_accounts(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') return null;
        throw error;
      }

      return data as CorporateEmployee;
    },
    enabled: !!user,
  });
}

/**
 * Get corporate account details (for admins)
 */
export function useCorporateAccount(corporateId: string | undefined) {
  return useQuery({
    queryKey: ['corporate-account', corporateId],
    queryFn: async () => {
      if (!corporateId) return null;

      const { data, error } = await (supabase as any)
        .from('corporate_accounts')
        .select('*')
        .eq('id', corporateId)
        .single();

      if (error) throw error;
      return data as CorporateAccount;
    },
    enabled: !!corporateId,
  });
}

/**
 * Get corporate employees (for managers/admins)
 */
export function useCorporateEmployees(corporateId: string | undefined) {
  return useQuery({
    queryKey: ['corporate-employees', corporateId],
    queryFn: async () => {
      if (!corporateId) return [];

      const { data, error } = await (supabase as any)
        .from('corporate_employees')
        .select(`
          *,
          user:profiles(full_name, email, avatar_url)
        `)
        .eq('corporate_id', corporateId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data;
    },
    enabled: !!corporateId,
  });
}

/**
 * Get corporate orders (for finance/admin)
 */
export function useCorporateOrders(
  corporateId: string | undefined,
  options?: {
    startDate?: Date;
    endDate?: Date;
    department?: string;
    status?: CorporateOrder['approval_status'];
  }
) {
  return useQuery({
    queryKey: ['corporate-orders', corporateId, options],
    queryFn: async () => {
      if (!corporateId) return [];

      let query = (supabase as any)
        .from('corporate_orders')
        .select(`
          *,
          order:orders(
            id,
            order_number,
            total,
            status,
            created_at,
            restaurant:restaurants(name)
          ),
          employee:corporate_employees(
            user:profiles(full_name)
          )
        `)
        .eq('corporate_id', corporateId)
        .order('created_at', { ascending: false });

      if (options?.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }
      if (options?.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }
      if (options?.department) {
        query = query.eq('department', options.department);
      }
      if (options?.status) {
        query = query.eq('approval_status', options.status);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data;
    },
    enabled: !!corporateId,
  });
}

/**
 * Get corporate invoices
 */
export function useCorporateInvoices(corporateId: string | undefined) {
  return useQuery({
    queryKey: ['corporate-invoices', corporateId],
    queryFn: async () => {
      if (!corporateId) return [];

      const { data, error } = await (supabase as any)
        .from('corporate_invoices')
        .select('*')
        .eq('corporate_id', corporateId)
        .order('billing_period_start', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as CorporateInvoice[];
    },
    enabled: !!corporateId,
  });
}

/**
 * Get spending summary for corporate dashboard
 */
export function useCorporateSpendingSummary(corporateId: string | undefined) {
  return useQuery({
    queryKey: ['corporate-spending', corporateId],
    queryFn: async () => {
      if (!corporateId) return null;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get this month's orders
      const { data: orders, error } = await (supabase as any)
        .from('corporate_orders')
        .select(`
          order:orders(total, status)
        `)
        .eq('corporate_id', corporateId)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (error) {
        if (error.code === '42P01') return null;
        throw error;
      }

      const totalSpent = orders?.reduce((sum: number, o: any) => sum + (o.order?.total || 0), 0) || 0;
      const orderCount = orders?.length || 0;

      // Get department breakdown
      const { data: deptOrders } = await (supabase as any)
        .from('corporate_orders')
        .select(`
          department,
          order:orders(total)
        `)
        .eq('corporate_id', corporateId)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const departmentBreakdown: Record<string, number> = {};
      deptOrders?.forEach((o: any) => {
        const dept = o.department || 'Unassigned';
        departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + (o.order?.total || 0);
      });

      // Get account for budget info
      const { data: account } = await (supabase as any)
        .from('corporate_accounts')
        .select('monthly_budget')
        .eq('id', corporateId)
        .single();

      return {
        totalSpent,
        orderCount,
        averageOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
        monthlyBudget: account?.monthly_budget || 0,
        budgetUsedPercent: account?.monthly_budget ? (totalSpent / account.monthly_budget) * 100 : 0,
        departmentBreakdown,
        periodStart: monthStart,
        periodEnd: monthEnd,
      };
    },
    enabled: !!corporateId,
  });
}

/**
 * Approve or reject corporate order (for managers)
 */
export function useApproveOrder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      approved,
      notes,
    }: {
      orderId: string;
      approved: boolean;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('corporate_orders')
        .update({
          approval_status: approved ? 'approved' : 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          notes,
        })
        .eq('order_id', orderId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['corporate-orders'] });
      toast({
        title: variables.approved ? 'Order Approved' : 'Order Rejected',
      });
    },
  });
}

/**
 * Update employee allowance
 */
export function useUpdateEmployeeAllowance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employeeId,
      remainingAllowance,
    }: {
      employeeId: string;
      remainingAllowance: number;
    }) => {
      const { error } = await (supabase as any)
        .from('corporate_employees')
        .update({ remaining_allowance: remainingAllowance })
        .eq('id', employeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-employees'] });
      toast({
        title: 'Allowance Updated',
      });
    },
  });
}

/**
 * Get API keys for corporate account
 */
export function useAPIKeys(corporateId: string | undefined) {
  return useQuery({
    queryKey: ['api-keys', corporateId],
    queryFn: async () => {
      if (!corporateId) return [];

      const { data, error } = await (supabase as any)
        .from('api_keys')
        .select('*')
        .eq('corporate_id', corporateId)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as APIKey[];
    },
    enabled: !!corporateId,
  });
}

/**
 * Create new API key
 */
export function useCreateAPIKey() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      corporateId,
      name,
      permissions,
      rateLimitPerMinute,
      rateLimitPerDay,
      expiresAt,
    }: {
      corporateId: string;
      name: string;
      permissions?: string[];
      rateLimitPerMinute?: number;
      rateLimitPerDay?: number;
      expiresAt?: Date;
    }) => {
      // Generate API key
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const fullKey = 'el_' + Array.from(keyBytes, b => b.toString(16).padStart(2, '0')).join('');
      const keyPrefix = fullKey.substring(0, 11); // el_XXXXXXXX

      // Hash the key for storage
      const encoder = new TextEncoder();
      const data = encoder.encode(fullKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const keyHash = Array.from(new Uint8Array(hashBuffer), b => b.toString(16).padStart(2, '0')).join('');

      const { data: apiKey, error } = await (supabase as any)
        .from('api_keys')
        .insert({
          corporate_id: corporateId,
          name,
          key_prefix: keyPrefix,
          key_hash: keyHash,
          permissions: permissions || ['read'],
          rate_limit_per_minute: rateLimitPerMinute || 60,
          rate_limit_per_day: rateLimitPerDay || 10000,
          expires_at: expiresAt?.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Return full key only once (will not be stored)
      return { ...apiKey, fullKey };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({
        title: 'API Key Created',
        description: 'Make sure to copy the key now. It will not be shown again.',
      });
    },
  });
}

/**
 * Revoke API key
 */
export function useRevokeAPIKey() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await (supabase as any)
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({
        title: 'API Key Revoked',
      });
    },
  });
}

/**
 * Get employee's remaining allowance
 */
export function useMyAllowance() {
  const { data: membership } = useCorporateMembership();

  if (!membership) return null;

  return {
    remaining: membership.remaining_allowance ?? membership.corporate?.meal_allowance_amount ?? 0,
    total: membership.corporate?.meal_allowance_amount ?? 0,
    type: membership.corporate?.meal_allowance_type ?? 'per_day',
    monthlySpent: membership.monthly_spent,
    perOrderLimit: membership.corporate?.per_order_limit,
  };
}

export const EXPENSE_CATEGORIES = [
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'team_meal', label: 'Team Meal' },
  { value: 'client_entertainment', label: 'Client Entertainment' },
  { value: 'working_late', label: 'Working Late' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
];

export const COMPANY_SIZES = [
  { value: 'small', label: 'Small (1-50 employees)', description: 'Startups and small businesses' },
  { value: 'medium', label: 'Medium (51-200 employees)', description: 'Growing companies' },
  { value: 'large', label: 'Large (201-1000 employees)', description: 'Established enterprises' },
  { value: 'enterprise', label: 'Enterprise (1000+ employees)', description: 'Large corporations' },
];
