import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DailyMetrics {
  id: string;
  metric_date: string;
  entity_type: 'platform' | 'restaurant' | 'driver' | 'region';
  entity_id: string | null;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  gross_revenue: number;
  net_revenue: number;
  delivery_fees: number;
  service_fees: number;
  refunds: number;
  avg_order_value: number | null;
  avg_delivery_time: number | null;
  avg_prep_time: number | null;
  new_customers: number;
  returning_customers: number;
  avg_rating: number | null;
  review_count: number;
  created_at: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  description: string | null;
  report_type: 'sales' | 'orders' | 'customers' | 'drivers' | 'restaurants' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  day_of_week: number | null;
  day_of_month: number | null;
  time_of_day: string;
  timezone: string;
  recipients: string[];
  filters: Record<string, any>;
  date_range: string;
  format: 'pdf' | 'csv' | 'xlsx';
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ABExperiment {
  id: string;
  name: string;
  description: string | null;
  target_audience: string;
  target_percentage: number;
  variants: { name: string; weight: number }[];
  primary_metric: string;
  secondary_metrics: string[];
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  start_date: string | null;
  end_date: string | null;
  winner_variant: string | null;
  statistical_significance: number | null;
  results_summary: Record<string, any> | null;
  created_by: string | null;
  created_at: string;
}

export interface ExperimentAssignment {
  id: string;
  experiment_id: string;
  user_id: string;
  variant: string;
  assigned_at: string;
  converted: boolean;
  converted_at: string | null;
  conversion_value: number | null;
}

/**
 * Get daily metrics for an entity
 */
export function useDailyMetrics({
  entityType,
  entityId,
  startDate,
  endDate,
}: {
  entityType: DailyMetrics['entity_type'];
  entityId?: string;
  startDate: Date;
  endDate: Date;
}) {
  return useQuery({
    queryKey: ['daily-metrics', entityType, entityId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('daily_metrics')
        .select('*')
        .eq('entity_type', entityType)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .lte('metric_date', endDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: true });

      if (entityId) {
        query = query.eq('entity_id', entityId);
      } else {
        query = query.is('entity_id', null);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as DailyMetrics[];
    },
  });
}

/**
 * Get summary metrics for a period
 */
export function useMetricsSummary({
  entityType,
  entityId,
  startDate,
  endDate,
}: {
  entityType: DailyMetrics['entity_type'];
  entityId?: string;
  startDate: Date;
  endDate: Date;
}) {
  const { data: metrics } = useDailyMetrics({ entityType, entityId, startDate, endDate });

  if (!metrics || metrics.length === 0) {
    return null;
  }

  return {
    totalOrders: metrics.reduce((sum, m) => sum + m.total_orders, 0),
    completedOrders: metrics.reduce((sum, m) => sum + m.completed_orders, 0),
    cancelledOrders: metrics.reduce((sum, m) => sum + m.cancelled_orders, 0),
    grossRevenue: metrics.reduce((sum, m) => sum + m.gross_revenue, 0),
    netRevenue: metrics.reduce((sum, m) => sum + m.net_revenue, 0),
    deliveryFees: metrics.reduce((sum, m) => sum + m.delivery_fees, 0),
    serviceFees: metrics.reduce((sum, m) => sum + m.service_fees, 0),
    refunds: metrics.reduce((sum, m) => sum + m.refunds, 0),
    avgOrderValue: metrics.reduce((sum, m) => sum + (m.avg_order_value || 0), 0) / metrics.length,
    avgDeliveryTime: metrics.reduce((sum, m) => sum + (m.avg_delivery_time || 0), 0) / metrics.length,
    newCustomers: metrics.reduce((sum, m) => sum + m.new_customers, 0),
    returningCustomers: metrics.reduce((sum, m) => sum + m.returning_customers, 0),
    avgRating: metrics.reduce((sum, m) => sum + (m.avg_rating || 0), 0) / metrics.filter(m => m.avg_rating).length || 0,
    reviewCount: metrics.reduce((sum, m) => sum + m.review_count, 0),
    completionRate: metrics.reduce((sum, m) => sum + m.completed_orders, 0) / metrics.reduce((sum, m) => sum + m.total_orders, 0) * 100,
  };
}

/**
 * Get scheduled reports
 */
export function useScheduledReports() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['scheduled-reports', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as ScheduledReport[];
    },
    enabled: !!user,
  });
}

/**
 * Create scheduled report
 */
export function useCreateScheduledReport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: Omit<ScheduledReport, 'id' | 'created_by' | 'created_at' | 'last_run_at' | 'next_run_at'>) => {
      if (!user) throw new Error('Not authenticated');

      // Calculate next run time
      const now = new Date();
      let nextRun = new Date();

      if (report.frequency === 'daily') {
        nextRun.setDate(now.getDate() + 1);
      } else if (report.frequency === 'weekly') {
        const daysUntilNext = ((report.day_of_week || 1) - now.getDay() + 7) % 7 || 7;
        nextRun.setDate(now.getDate() + daysUntilNext);
      } else if (report.frequency === 'monthly') {
        nextRun.setMonth(now.getMonth() + 1);
        nextRun.setDate(report.day_of_month || 1);
      }

      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert({
          ...report,
          created_by: user.id,
          next_run_at: nextRun.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({
        title: 'Report Scheduled',
        description: 'Your report has been scheduled.',
      });
    },
  });
}

/**
 * Get A/B experiments
 */
export function useExperiments(status?: ABExperiment['status']) {
  return useQuery({
    queryKey: ['experiments', status],
    queryFn: async () => {
      let query = supabase
        .from('ab_experiments')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as ABExperiment[];
    },
  });
}

/**
 * Get user's experiment assignment
 */
export function useExperimentAssignment(experimentId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['experiment-assignment', experimentId, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('experiment_assignments')
        .select('*')
        .eq('experiment_id', experimentId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') return null;
        throw error;
      }

      return data as ExperimentAssignment;
    },
    enabled: !!user && !!experimentId,
  });
}

/**
 * Assign user to experiment variant
 */
export function useAssignToExperiment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (experimentId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Get experiment to determine variant
      const { data: experiment } = await supabase
        .from('ab_experiments')
        .select('variants')
        .eq('id', experimentId)
        .single();

      if (!experiment) throw new Error('Experiment not found');

      // Weighted random selection
      const variants = experiment.variants as { name: string; weight: number }[];
      const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedVariant = variants[0].name;

      for (const variant of variants) {
        random -= variant.weight;
        if (random <= 0) {
          selectedVariant = variant.name;
          break;
        }
      }

      const { data, error } = await supabase
        .from('experiment_assignments')
        .insert({
          experiment_id: experimentId,
          user_id: user.id,
          variant: selectedVariant,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, experimentId) => {
      queryClient.invalidateQueries({ queryKey: ['experiment-assignment', experimentId] });
    },
  });
}

/**
 * Track experiment conversion
 */
export function useTrackConversion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      conversionValue,
    }: {
      assignmentId: string;
      conversionValue?: number;
    }) => {
      const { error } = await supabase
        .from('experiment_assignments')
        .update({
          converted: true,
          converted_at: new Date().toISOString(),
          conversion_value: conversionValue,
        })
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiment-assignment'] });
    },
  });
}

/**
 * Export data to CSV
 */
export function useExportToCSV() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      data,
      filename,
    }: {
      data: Record<string, any>[];
      filename: string;
    }) => {
      if (data.length === 0) throw new Error('No data to export');

      // Get headers from first row
      const headers = Object.keys(data[0]);

      // Convert to CSV
      const csvRows = [
        headers.join(','),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              // Escape quotes and wrap in quotes if contains comma
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value ?? '';
            })
            .join(',')
        ),
      ];

      const csv = csvRows.join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      return { filename, rowCount: data.length };
    },
    onSuccess: (result) => {
      toast({
        title: 'Export Complete',
        description: `Exported ${result.rowCount} rows to ${result.filename}.csv`,
      });
    },
  });
}

export const REPORT_TYPES = [
  { value: 'sales', label: 'Sales Report', description: 'Revenue and order statistics' },
  { value: 'orders', label: 'Orders Report', description: 'Order details and status' },
  { value: 'customers', label: 'Customer Report', description: 'Customer activity and retention' },
  { value: 'drivers', label: 'Driver Report', description: 'Driver performance metrics' },
  { value: 'restaurants', label: 'Restaurant Report', description: 'Restaurant performance' },
  { value: 'custom', label: 'Custom Report', description: 'Custom data export' },
] as const;

export const REPORT_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
] as const;

export const METRIC_TYPES = [
  { key: 'conversion_rate', label: 'Conversion Rate', unit: '%' },
  { key: 'order_value', label: 'Average Order Value', unit: 'R' },
  { key: 'retention', label: 'Retention Rate', unit: '%' },
  { key: 'engagement', label: 'Engagement', unit: '' },
] as const;
