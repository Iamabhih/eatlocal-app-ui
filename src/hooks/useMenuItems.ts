import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  preparation_time: number;
  calories: number | null;
}

export interface MenuCategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

export function useMenuCategories(restaurantId: string) {
  return useQuery({
    queryKey: ['menu-categories', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as MenuCategory[];
    },
    enabled: !!restaurantId,
  });
}

export function useMenuItems(restaurantId: string) {
  return useQuery({
    queryKey: ['menu-items', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true);

      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!restaurantId,
  });
}

export function useRestaurantMenu(restaurantId: string) {
  const { data: categories, isLoading: categoriesLoading } = useMenuCategories(restaurantId);
  const { data: items, isLoading: itemsLoading } = useMenuItems(restaurantId);

  const menuWithItems: MenuCategoryWithItems[] = (categories || []).map(category => ({
    ...category,
    items: (items || []).filter(item => item.category_id === category.id),
  }));

  return {
    data: menuWithItems,
    isLoading: categoriesLoading || itemsLoading,
  };
}
