import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem } from './useMenuItems';

export function useMenuMutations(restaurantId?: string) {
  const queryClient = useQueryClient();

  const createMenuItem = useMutation({
    mutationFn: async (data: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('menu_items')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-menu-items'] });
      if (restaurantId) {
        queryClient.invalidateQueries({ queryKey: ['menu-items', restaurantId] });
      }
    },
  });

  const updateMenuItem = useMutation({
    mutationFn: async ({ id, ...data }: Partial<MenuItem> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('menu_items')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-menu-items'] });
      if (restaurantId) {
        queryClient.invalidateQueries({ queryKey: ['menu-items', restaurantId] });
      }
    },
  });

  const deleteMenuItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-menu-items'] });
      if (restaurantId) {
        queryClient.invalidateQueries({ queryKey: ['menu-items', restaurantId] });
      }
    },
  });

  return {
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
  };
}