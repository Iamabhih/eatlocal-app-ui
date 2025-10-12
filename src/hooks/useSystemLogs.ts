import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, startOfDay, endOfDay } from 'date-fns';

export function useSystemLogs(dateRange: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['system-logs', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .gte('created_at', startOfDay(dateRange.from).toISOString())
        .lte('created_at', endOfDay(dateRange.to).toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data;
    },
  });
}

export function useApiCallLogs(dateRange: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['api-call-logs', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_call_logs')
        .select('*')
        .gte('created_at', startOfDay(dateRange.from).toISOString())
        .lte('created_at', endOfDay(dateRange.to).toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data;
    },
  });
}

export function useErrorLogs(dateRange: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['error-logs', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .gte('created_at', startOfDay(dateRange.from).toISOString())
        .lte('created_at', endOfDay(dateRange.to).toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data;
    },
  });
}

export function useInteractionLogs(dateRange: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['interaction-logs', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_interaction_logs')
        .select('*')
        .gte('created_at', startOfDay(dateRange.from).toISOString())
        .lte('created_at', endOfDay(dateRange.to).toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data;
    },
  });
}

export function useLogStats(dateRange: { from: Date; to: Date }) {
  const { data: systemLogs } = useSystemLogs(dateRange);
  const { data: apiLogs } = useApiCallLogs(dateRange);
  const { data: errorLogs } = useErrorLogs(dateRange);
  const { data: interactionLogs } = useInteractionLogs(dateRange);

  const stats = {
    totalLogs: (systemLogs?.length || 0) + (apiLogs?.length || 0) + (interactionLogs?.length || 0),
    totalErrors: errorLogs?.length || 0,
    failedApiCalls: apiLogs?.filter(log => !log.success).length || 0,
    failedActions: systemLogs?.filter(log => !log.success).length || 0,
    errorRate: errorLogs?.length ? ((errorLogs.length / ((systemLogs?.length || 0) + 1)) * 100).toFixed(2) : '0',
    apiSuccessRate: apiLogs?.length ? (((apiLogs.filter(log => log.success).length) / apiLogs.length) * 100).toFixed(2) : '100',
  };

  return stats;
}
