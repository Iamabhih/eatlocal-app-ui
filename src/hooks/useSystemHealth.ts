import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subHours } from 'date-fns';

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const oneHourAgo = subHours(new Date(), 1);

      // Get error count in last hour
      const { data: recentErrors, error: errorsError } = await supabase
        .from('error_logs')
        .select('id, severity')
        .gte('created_at', oneHourAgo.toISOString());

      if (errorsError) throw errorsError;

      // Get failed API calls in last hour
      const { data: failedApiCalls, error: apiError } = await supabase
        .from('api_call_logs')
        .select('id, endpoint')
        .eq('success', false)
        .gte('created_at', oneHourAgo.toISOString());

      if (apiError) throw apiError;

      // Get failed actions in last hour
      const { data: failedActions, error: actionsError } = await supabase
        .from('system_logs')
        .select('id, action, component')
        .eq('success', false)
        .gte('created_at', oneHourAgo.toISOString());

      if (actionsError) throw actionsError;

      const criticalErrors = recentErrors?.filter(e => e.severity === 'critical').length || 0;
      const highErrors = recentErrors?.filter(e => e.severity === 'high').length || 0;

      const health = {
        status: criticalErrors > 5 ? 'critical' : highErrors > 10 ? 'warning' : 'healthy',
        recentErrors: recentErrors?.length || 0,
        criticalErrors,
        highErrors,
        failedApiCalls: failedApiCalls?.length || 0,
        failedActions: failedActions?.length || 0,
        lastChecked: new Date(),
      };

      return health;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });
}
