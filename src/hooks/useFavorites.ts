import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY = 'eatlocal_favorites';

export function useFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from localStorage or database
  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true);

      if (user) {
        // Load from database for authenticated users
        try {
          const { data, error } = await supabase
            .from('user_favorites')
            .select('restaurant_id')
            .eq('user_id', user.id);

          if (error) throw error;
          setFavorites(data?.map(f => f.restaurant_id) || []);
        } catch (error) {
          console.error('Error loading favorites:', error);
          // Fallback to localStorage
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) {
            setFavorites(JSON.parse(stored));
          }
        }
      } else {
        // Load from localStorage for guests
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      }

      setIsLoading(false);
    };

    loadFavorites();
  }, [user]);

  // Sync localStorage for guests
  useEffect(() => {
    if (!user) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, user]);

  const toggleFavorite = useCallback(async (restaurantId: string) => {
    const isFav = favorites.includes(restaurantId);

    // Optimistic update
    setFavorites(prev =>
      isFav
        ? prev.filter(id => id !== restaurantId)
        : [...prev, restaurantId]
    );

    if (user) {
      try {
        if (isFav) {
          // Remove from database
          const { error } = await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('restaurant_id', restaurantId);

          if (error) throw error;
        } else {
          // Add to database
          const { error } = await supabase
            .from('user_favorites')
            .insert({
              user_id: user.id,
              restaurant_id: restaurantId,
            });

          if (error) throw error;
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
        // Revert on error
        setFavorites(prev =>
          isFav
            ? [...prev, restaurantId]
            : prev.filter(id => id !== restaurantId)
        );
        toast({
          title: 'Error',
          description: 'Failed to update favorites',
          variant: 'destructive',
        });
      }
    }

    toast({
      title: isFav ? 'Removed from favorites' : 'Added to favorites',
      description: isFav
        ? 'Restaurant removed from your favorites'
        : 'Restaurant added to your favorites',
    });
  }, [favorites, user, toast]);

  const isFavorite = useCallback((restaurantId: string) => {
    return favorites.includes(restaurantId);
  }, [favorites]);

  const clearFavorites = useCallback(async () => {
    if (user) {
      try {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error clearing favorites:', error);
        toast({
          title: 'Error',
          description: 'Failed to clear favorites',
          variant: 'destructive',
        });
        return;
      }
    }

    setFavorites([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast({
      title: 'Favorites cleared',
      description: 'All favorites have been removed',
    });
  }, [user, toast]);

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  };
}
