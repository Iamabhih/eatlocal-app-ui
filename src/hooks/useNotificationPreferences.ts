import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  order_updates: boolean;
  promotional_offers: boolean;
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  delivery_updates: boolean;
  review_reminders: boolean;
  loyalty_updates: boolean;
  created_at: string;
  updated_at: string;
}

const defaultPreferences: Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  order_updates: true,
  promotional_offers: true,
  push_notifications: false,
  email_notifications: true,
  sms_notifications: false,
  delivery_updates: true,
  review_reminders: true,
  loyalty_updates: true,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await (supabase
        .from('notification_preferences' as any)
        .select('*')
        .eq('user_id', user.id)
        .single() as any);

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            ...defaultPreferences,
            id: '',
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as NotificationPreferences;
        }
        throw error;
      }

      return data as NotificationPreferences;
    },
    enabled: !!user,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await (supabase
        .from('notification_preferences' as any)
        .select('id')
        .eq('user_id', user.id)
        .single() as any);

      if (existing) {
        const { error } = await (supabase
          .from('notification_preferences' as any)
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id) as any);

        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from('notification_preferences' as any)
          .insert({
            user_id: user.id,
            ...defaultPreferences,
            ...updates,
          }) as any);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: 'Preferences Updated',
        description: 'Your notification preferences have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    preferences,
    isLoading,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
  };
}