import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface FoodStory {
  id: string;
  user_id: string;
  order_id: string | null;
  restaurant_id: string | null;
  menu_item_id: string | null;
  story_type: 'photo' | 'video' | 'text' | 'review';
  media_url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  location_name: string | null;
  tags: string[];
  visibility: 'public' | 'followers' | 'private';
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  expires_at: string;
  is_highlight: boolean;
  created_at: string;
}

export interface StoryComment {
  id: string;
  story_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_edited: boolean;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface FeedStory extends FoodStory {
  user_name: string;
  user_avatar: string | null;
  restaurant_name: string | null;
  menu_item_name: string | null;
  has_liked: boolean;
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'active' | 'pending' | 'blocked';
  created_at: string;
}

export interface FoodCollection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  visibility: 'public' | 'private';
  item_count: number;
  created_at: string;
}

/**
 * Get user's feed (stories from followed users)
 */
export function useFeed(limit: number = 20) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['feed', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user) return { stories: [], nextOffset: null };

      const { data, error } = await supabase.rpc('get_user_feed', {
        p_user_id: user.id,
        p_limit: limit,
        p_offset: pageParam,
      });

      if (error) {
        if (error.code === '42883') return { stories: [], nextOffset: null };
        throw error;
      }

      return {
        stories: data as FeedStory[],
        nextOffset: data.length === limit ? pageParam + limit : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    enabled: !!user,
  });
}

/**
 * Get a single story
 */
export function useStory(storyId: string) {
  return useQuery({
    queryKey: ['story', storyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_stories')
        .select(`
          *,
          user:profiles(full_name, avatar_url),
          restaurant:restaurants(name),
          menu_item:menu_items(name)
        `)
        .eq('id', storyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!storyId,
  });
}

/**
 * Get user's own stories
 */
export function useMyStories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-stories', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('food_stories')
        .select(`
          *,
          restaurant:restaurants(name),
          menu_item:menu_items(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as FoodStory[];
    },
    enabled: !!user,
  });
}

/**
 * Get stories from a specific user
 */
export function useUserStories(userId: string) {
  return useQuery({
    queryKey: ['user-stories', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_stories')
        .select(`
          *,
          restaurant:restaurants(name),
          menu_item:menu_items(name)
        `)
        .eq('user_id', userId)
        .eq('visibility', 'public')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as FoodStory[];
    },
    enabled: !!userId,
  });
}

/**
 * Create a new story
 */
export function useCreateStory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storyType,
      mediaFile,
      caption,
      orderId,
      restaurantId,
      menuItemId,
      locationName,
      tags,
      visibility,
      isHighlight,
    }: {
      storyType: FoodStory['story_type'];
      mediaFile?: File;
      caption?: string;
      orderId?: string;
      restaurantId?: string;
      menuItemId?: string;
      locationName?: string;
      tags?: string[];
      visibility?: FoodStory['visibility'];
      isHighlight?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      let mediaUrl: string | null = null;
      let mediaStoragePath: string | null = null;

      // Upload media if provided
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        mediaStoragePath = `stories/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('user-content')
          .upload(mediaStoragePath, mediaFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('user-content')
          .getPublicUrl(mediaStoragePath);

        mediaUrl = urlData.publicUrl;
      }

      // Create story
      const { data, error } = await supabase
        .from('food_stories')
        .insert({
          user_id: user.id,
          story_type: storyType,
          media_url: mediaUrl,
          media_storage_path: mediaStoragePath,
          caption,
          order_id: orderId,
          restaurant_id: restaurantId,
          menu_item_id: menuItemId,
          location_name: locationName,
          tags: tags || [],
          visibility: visibility || 'public',
          is_highlight: isHighlight || false,
          expires_at: isHighlight
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year for highlights
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-stories'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast({
        title: 'Story Posted!',
        description: 'Your food story is now live.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Post Story',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a story
 */
export function useDeleteStory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await supabase
        .from('food_stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;
      return storyId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-stories'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast({
        title: 'Story Deleted',
      });
    },
  });
}

/**
 * Like a story
 */
export function useLikeStory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storyId,
      reactionType = 'like',
    }: {
      storyId: string;
      reactionType?: 'like' | 'love' | 'yummy' | 'fire';
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('story_likes')
        .insert({
          story_id: storyId,
          user_id: user.id,
          reaction_type: reactionType,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Already liked, unlike it
          await supabase
            .from('story_likes')
            .delete()
            .eq('story_id', storyId)
            .eq('user_id', user.id);
          return { liked: false };
        }
        throw error;
      }

      // Update like count
      await supabase.rpc('increment_column', {
        table_name: 'food_stories',
        column_name: 'like_count',
        row_id: storyId,
      });

      return { liked: true, data };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['story', variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

/**
 * Record story view
 */
export function useRecordStoryView() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      storyId,
      durationSeconds,
    }: {
      storyId: string;
      durationSeconds?: number;
    }) => {
      if (!user) return;

      await supabase.from('story_views').upsert(
        {
          story_id: storyId,
          viewer_id: user.id,
          duration_seconds: durationSeconds || 0,
          viewed_at: new Date().toISOString(),
        },
        { onConflict: 'story_id,viewer_id' }
      );

      // Increment view count
      await supabase.rpc('increment_column', {
        table_name: 'food_stories',
        column_name: 'view_count',
        row_id: storyId,
      });
    },
  });
}

/**
 * Get story comments
 */
export function useStoryComments(storyId: string) {
  return useQuery({
    queryKey: ['story-comments', storyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('story_comments')
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as StoryComment[];
    },
    enabled: !!storyId,
  });
}

/**
 * Add a comment to a story
 */
export function useAddComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storyId,
      content,
      parentId,
    }: {
      storyId: string;
      content: string;
      parentId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('story_comments')
        .insert({
          story_id: storyId,
          user_id: user.id,
          content,
          parent_id: parentId,
        })
        .select()
        .single();

      if (error) throw error;

      // Update comment count
      await supabase.rpc('increment_column', {
        table_name: 'food_stories',
        column_name: 'comment_count',
        row_id: storyId,
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['story-comments', variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ['story', variables.storyId] });
    },
  });
}

/**
 * Follow a user
 */
export function useFollowUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (followingId: string) => {
      if (!user) throw new Error('Not authenticated');
      if (user.id === followingId) throw new Error('Cannot follow yourself');

      const { data, error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: followingId,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Already following, unfollow
          await supabase
            .from('user_follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', followingId);
          return { following: false };
        }
        throw error;
      }

      return { following: true, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
    },
  });
}

/**
 * Get users I'm following
 */
export function useFollowing() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          *,
          following:profiles!user_follows_following_id_fkey(id, full_name, avatar_url)
        `)
        .eq('follower_id', user.id)
        .eq('status', 'active');

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data;
    },
    enabled: !!user,
  });
}

/**
 * Get my followers
 */
export function useFollowers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['followers', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          *,
          follower:profiles!user_follows_follower_id_fkey(id, full_name, avatar_url)
        `)
        .eq('following_id', user.id)
        .eq('status', 'active');

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data;
    },
    enabled: !!user,
  });
}

/**
 * Check if following a user
 */
export function useIsFollowing(userId: string) {
  const { data: following } = useFollowing();
  return following?.some(f => f.following_id === userId) || false;
}

/**
 * Get user's food collections
 */
export function useCollections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['collections', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('food_collections')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as FoodCollection[];
    },
    enabled: !!user,
  });
}

/**
 * Create a new collection
 */
export function useCreateCollection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      visibility,
    }: {
      name: string;
      description?: string;
      visibility?: 'public' | 'private';
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('food_collections')
        .insert({
          user_id: user.id,
          name,
          description,
          visibility: visibility || 'public',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast({
        title: 'Collection Created',
        description: 'Your new collection is ready.',
      });
    },
  });
}

/**
 * Add item to collection
 */
export function useAddToCollection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collectionId,
      menuItemId,
      restaurantId,
      notes,
    }: {
      collectionId: string;
      menuItemId: string;
      restaurantId?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('collection_items')
        .insert({
          collection_id: collectionId,
          menu_item_id: menuItemId,
          restaurant_id: restaurantId,
          notes,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') throw new Error('Already in collection');
        throw error;
      }

      // Update item count
      await supabase.rpc('increment_column', {
        table_name: 'food_collections',
        column_name: 'item_count',
        row_id: collectionId,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection-items'] });
      toast({
        title: 'Added to Collection',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Add',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export const REACTION_EMOJIS = {
  like: '👍',
  love: '❤️',
  yummy: '🤤',
  fire: '🔥',
};
