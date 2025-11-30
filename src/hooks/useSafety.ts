import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type AllergenType =
  | 'gluten'
  | 'dairy'
  | 'eggs'
  | 'nuts'
  | 'peanuts'
  | 'soy'
  | 'fish'
  | 'shellfish'
  | 'sesame'
  | 'mustard'
  | 'celery'
  | 'lupin'
  | 'molluscs'
  | 'sulphites';

export interface FoodSafetyRating {
  id: string;
  restaurant_id: string;
  rating: 'A' | 'B' | 'C' | 'D' | 'F' | 'pending';
  score: number | null;
  inspection_date: string;
  inspector_name: string | null;
  inspection_type: 'routine' | 'follow_up' | 'complaint' | 'pre_opening';
  critical_violations: number;
  major_violations: number;
  minor_violations: number;
  violations_details: { code: string; description: string; severity: string }[];
  is_current: boolean;
  report_url: string | null;
  next_inspection_due: string | null;
  created_at: string;
}

export interface MenuItemAllergen {
  id: string;
  menu_item_id: string;
  allergen_type: AllergenType;
  severity: 'contains' | 'may_contain' | 'trace';
  notes: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface CarbonTracking {
  id: string;
  order_id: string | null;
  ride_id: string | null;
  distance_km: number;
  vehicle_type: string | null;
  emission_factor: number | null;
  carbon_kg: number;
  offset_purchased: boolean;
  offset_amount: number | null;
  offset_provider: string | null;
  created_at: string;
}

export interface UserCarbonSummary {
  id: string;
  user_id: string;
  year: number;
  month: number;
  total_orders: number;
  total_rides: number;
  total_distance_km: number;
  total_carbon_kg: number;
  carbon_offset_kg: number;
  vs_average_percentage: number | null;
  created_at: string;
}

/**
 * Get food safety rating for a restaurant
 */
export function useFoodSafetyRating(restaurantId: string) {
  return useQuery({
    queryKey: ['food-safety-rating', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_safety_ratings')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_current', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') return null;
        throw error;
      }

      return data as FoodSafetyRating;
    },
    enabled: !!restaurantId,
  });
}

/**
 * Get food safety history for a restaurant
 */
export function useFoodSafetyHistory(restaurantId: string) {
  return useQuery({
    queryKey: ['food-safety-history', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_safety_ratings')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('inspection_date', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as FoodSafetyRating[];
    },
    enabled: !!restaurantId,
  });
}

/**
 * Get allergens for a menu item
 */
export function useMenuItemAllergens(menuItemId: string) {
  return useQuery({
    queryKey: ['menu-item-allergens', menuItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_item_allergens')
        .select('*')
        .eq('menu_item_id', menuItemId);

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as MenuItemAllergen[];
    },
    enabled: !!menuItemId,
  });
}

/**
 * Get allergen-free menu items
 */
export function useAllergenFreeItems(restaurantId: string, excludeAllergens: AllergenType[]) {
  return useQuery({
    queryKey: ['allergen-free-items', restaurantId, excludeAllergens],
    queryFn: async () => {
      // Get all menu items
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('id, name, description, price, image_url')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true);

      if (itemsError) throw itemsError;
      if (!items) return [];

      // Get allergens for these items
      const { data: allergens, error: allergensError } = await supabase
        .from('menu_item_allergens')
        .select('menu_item_id, allergen_type, severity')
        .in(
          'menu_item_id',
          items.map((i) => i.id)
        );

      if (allergensError && allergensError.code !== '42P01') throw allergensError;

      // Filter out items with excluded allergens
      const itemsWithAllergens = new Set(
        (allergens || [])
          .filter(
            (a) =>
              excludeAllergens.includes(a.allergen_type as AllergenType) &&
              a.severity === 'contains'
          )
          .map((a) => a.menu_item_id)
      );

      return items.filter((item) => !itemsWithAllergens.has(item.id));
    },
    enabled: !!restaurantId && excludeAllergens.length > 0,
  });
}

/**
 * Add allergen to menu item
 */
export function useAddAllergen() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      menuItemId,
      allergenType,
      severity,
      notes,
    }: {
      menuItemId: string;
      allergenType: AllergenType;
      severity: MenuItemAllergen['severity'];
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('menu_item_allergens')
        .insert({
          menu_item_id: menuItemId,
          allergen_type: allergenType,
          severity,
          notes,
          verified: !!user,
          verified_by: user?.id,
          verified_at: user ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-item-allergens', variables.menuItemId] });
      toast({ title: 'Allergen Added' });
    },
  });
}

/**
 * Get user's carbon footprint summary
 */
export function useCarbonSummary(year?: number, month?: number) {
  const { user } = useAuth();
  const currentDate = new Date();
  const targetYear = year || currentDate.getFullYear();
  const targetMonth = month || currentDate.getMonth() + 1;

  return useQuery({
    queryKey: ['carbon-summary', user?.id, targetYear, targetMonth],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_carbon_summary')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', targetYear)
        .eq('month', targetMonth)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') return null;
        throw error;
      }

      return data as UserCarbonSummary;
    },
    enabled: !!user,
  });
}

/**
 * Get user's carbon footprint history
 */
export function useCarbonHistory(months: number = 12) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['carbon-history', user?.id, months],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_carbon_summary')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(months);

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as UserCarbonSummary[];
    },
    enabled: !!user,
  });
}

/**
 * Purchase carbon offset
 */
export function usePurchaseCarbonOffset() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      carbonKg,
      amount,
      provider,
    }: {
      carbonKg: number;
      amount: number;
      provider: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Record offset purchase (in real app, this would integrate with offset provider)
      const currentDate = new Date();

      // Update user's carbon summary
      const { data: existing } = await supabase
        .from('user_carbon_summary')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', currentDate.getFullYear())
        .eq('month', currentDate.getMonth() + 1)
        .single();

      if (existing) {
        await supabase
          .from('user_carbon_summary')
          .update({
            carbon_offset_kg: (existing.carbon_offset_kg || 0) + carbonKg,
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('user_carbon_summary').insert({
          user_id: user.id,
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
          carbon_offset_kg: carbonKg,
        });
      }

      return { carbonKg, amount, provider };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['carbon-summary'] });
      queryClient.invalidateQueries({ queryKey: ['carbon-history'] });
      toast({
        title: 'Offset Purchased',
        description: `You have offset ${result.carbonKg.toFixed(2)}kg of CO2. Thank you for helping the environment!`,
      });
    },
  });
}

/**
 * Calculate carbon footprint for a delivery
 */
export function calculateDeliveryCarbon(distanceKm: number, vehicleType: string): number {
  // Emission factors (kg CO2 per km)
  const emissionFactors: Record<string, number> = {
    bicycle: 0,
    electric_scooter: 0.01,
    motorcycle: 0.08,
    car: 0.12,
    electric_car: 0.05,
    van: 0.2,
  };

  const factor = emissionFactors[vehicleType] || 0.1;
  return distanceKm * factor;
}

/**
 * Get user's dietary preferences for allergens
 */
export function useUserAllergenPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-allergen-preferences', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data } = await supabase
        .from('user_taste_profiles')
        .select('dietary_restrictions')
        .eq('user_id', user.id)
        .single();

      // Map dietary restrictions to allergens
      const allergenMap: Record<string, AllergenType[]> = {
        'gluten-free': ['gluten'],
        'dairy-free': ['dairy'],
        vegan: ['dairy', 'eggs'],
        'nut-free': ['nuts', 'peanuts'],
      };

      const restrictions = data?.dietary_restrictions || [];
      const allergens = new Set<AllergenType>();

      restrictions.forEach((r: string) => {
        allergenMap[r]?.forEach((a) => allergens.add(a));
      });

      return Array.from(allergens);
    },
    enabled: !!user,
  });
}

// Allergen information
export const ALLERGENS = [
  { type: 'gluten', label: 'Gluten', icon: '🌾', description: 'Found in wheat, barley, rye' },
  { type: 'dairy', label: 'Dairy', icon: '🥛', description: 'Milk and milk products' },
  { type: 'eggs', label: 'Eggs', icon: '🥚', description: 'Eggs and egg products' },
  { type: 'nuts', label: 'Tree Nuts', icon: '🥜', description: 'Almonds, cashews, walnuts, etc.' },
  { type: 'peanuts', label: 'Peanuts', icon: '🥜', description: 'Peanuts and peanut products' },
  { type: 'soy', label: 'Soy', icon: '🫘', description: 'Soybeans and soy products' },
  { type: 'fish', label: 'Fish', icon: '🐟', description: 'Fish and fish products' },
  { type: 'shellfish', label: 'Shellfish', icon: '🦐', description: 'Crustaceans and molluscs' },
  { type: 'sesame', label: 'Sesame', icon: '🌱', description: 'Sesame seeds and oil' },
  { type: 'mustard', label: 'Mustard', icon: '🌿', description: 'Mustard seeds and products' },
  { type: 'celery', label: 'Celery', icon: '🥬', description: 'Celery and celeriac' },
  { type: 'lupin', label: 'Lupin', icon: '🌸', description: 'Lupin seeds and flour' },
  { type: 'molluscs', label: 'Molluscs', icon: '🦪', description: 'Squid, mussels, oysters' },
  { type: 'sulphites', label: 'Sulphites', icon: '🍷', description: 'Often in wine and dried fruit' },
] as const;

export const SAFETY_RATINGS = [
  { rating: 'A', label: 'Excellent', color: 'green', minScore: 90 },
  { rating: 'B', label: 'Good', color: 'blue', minScore: 80 },
  { rating: 'C', label: 'Satisfactory', color: 'yellow', minScore: 70 },
  { rating: 'D', label: 'Needs Improvement', color: 'orange', minScore: 60 },
  { rating: 'F', label: 'Failing', color: 'red', minScore: 0 },
] as const;

export const CARBON_OFFSET_PROVIDERS = [
  { id: 'gold-standard', name: 'Gold Standard', pricePerKg: 0.15 },
  { id: 'verra', name: 'Verra VCS', pricePerKg: 0.12 },
  { id: 'local-trees', name: 'Local Tree Planting', pricePerKg: 0.08 },
] as const;
