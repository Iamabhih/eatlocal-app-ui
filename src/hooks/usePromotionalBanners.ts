import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePromotionalBanners() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: banners, isLoading } = useQuery({
    queryKey: ['promotional-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const createBannerMutation = useMutation({
    mutationFn: async (bannerData: any) => {
      const { error } = await supabase
        .from('promotional_banners')
        .insert(bannerData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
      toast({ title: 'Banner created successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create banner', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('promotional_banners')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
      toast({ title: 'Banner updated successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update banner', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promotional_banners')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
      toast({ title: 'Banner deleted successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to delete banner', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  return {
    banners,
    isLoading,
    createBanner: createBannerMutation.mutate,
    updateBanner: updateBannerMutation.mutate,
    deleteBanner: deleteBannerMutation.mutate,
  };
}
