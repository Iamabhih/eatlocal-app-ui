import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAdminActivityLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['admin-activity-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  const logActivityMutation = useMutation({
    mutationFn: async ({ 
      action, 
      target_type, 
      target_id, 
      details 
    }: { 
      action: string; 
      target_type: string; 
      target_id?: string; 
      details?: any 
    }) => {
      if (!user) return;
      
      const { error } = await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: user.id,
          action,
          target_type,
          target_id,
          details,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-activity-logs'] });
    },
  });

  return {
    activities,
    isLoading,
    logActivity: logActivityMutation.mutate,
  };
}
