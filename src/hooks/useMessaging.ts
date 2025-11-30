import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'system';
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface Conversation {
  id: string;
  order_id: string;
  customer_id: string;
  participant_id: string;
  participant_type: 'restaurant' | 'driver';
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  order?: {
    order_number: string;
    status: string;
  };
  participant?: {
    full_name?: string;
    name?: string;
  };
}

/**
 * Hook to get all conversations for the current user
 */
export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get conversations where user is customer or participant
      const { data, error } = await (supabase
        .from('order_conversations' as any)
        .select(`
          *,
          order:orders(order_number, status)
        `)
        .or(`customer_id.eq.${user.id},participant_id.eq.${user.id}`)
        .eq('status', 'active')
        .order('updated_at', { ascending: false }) as any);

      if (error) {
        if (error.code === '42P01') return []; // Table doesn't exist
        throw error;
      }

      return (data || []) as Conversation[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

/**
 * Hook to get messages for a conversation
 */
export function useMessages(conversationId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await (supabase
        .from('order_messages' as any)
        .select(`
          *,
          sender:profiles(full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }) as any);

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return (data || []) as Message[];
    },
    enabled: !!conversationId && !!user,
  });
}

/**
 * Hook to send a message
 */
export function useSendMessage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      messageType = 'text',
    }: {
      conversationId: string;
      content: string;
      messageType?: 'text' | 'image' | 'system';
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase
        .from('order_messages' as any)
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: messageType,
        })
        .select()
        .single() as any);

      if (error) throw error;

      // Update conversation's last message
      await (supabase
        .from('order_conversations' as any)
        .update({
          last_message: content.substring(0, 100),
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId) as any);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => {
      toast({
        title: 'Failed to Send',
        description: 'Could not send your message. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to create or get a conversation for an order
 */
export function useGetOrCreateConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      participantId,
      participantType,
    }: {
      orderId: string;
      participantId: string;
      participantType: 'restaurant' | 'driver';
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Check if conversation already exists
      const { data: existing } = await (supabase
        .from('order_conversations' as any)
        .select('*')
        .eq('order_id', orderId)
        .eq('participant_type', participantType)
        .single() as any);

      if (existing) return existing as Conversation;

      // Create new conversation
      const { data, error } = await (supabase
        .from('order_conversations' as any)
        .insert({
          order_id: orderId,
          customer_id: user.id,
          participant_id: participantId,
          participant_type: participantType,
          status: 'active',
        })
        .select()
        .single() as any);

      if (error) throw error;
      return data as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/**
 * Hook to mark messages as read
 */
export function useMarkMessagesAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase
        .from('order_messages' as any)
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false) as any);

      if (error) throw error;
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
    },
  });
}

/**
 * Hook to get unread message count
 */
export function useUnreadMessageCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-message-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Get all conversation IDs where user is a participant
      const { data: conversations } = await (supabase
        .from('order_conversations' as any)
        .select('id')
        .or(`customer_id.eq.${user.id},participant_id.eq.${user.id}`)
        .eq('status', 'active') as any);

      if (!conversations?.length) return 0;

      const conversationIds = conversations.map((c: any) => c.id);

      // Count unread messages in those conversations
      const { count } = await (supabase
        .from('order_messages' as any)
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .eq('is_read', false) as any);

      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

/**
 * Hook for real-time message subscription
 */
export function useRealtimeMessages(conversationId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Add new message to cache
          queryClient.setQueryData<Message[]>(['messages', conversationId], (old) => {
            if (!old) return [payload.new as Message];
            // Avoid duplicates
            if (old.some(m => m.id === (payload.new as Message).id)) return old;
            return [...old, payload.new as Message];
          });

          // Show notification for messages from others
          if ((payload.new as Message).sender_id !== user.id) {
            toast({
              title: 'New Message',
              description: (payload.new as Message).content.substring(0, 50),
            });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, queryClient, toast]);

  return { isConnected };
}

/**
 * Hook to close a conversation
 */
export function useCloseConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase
        .from('order_conversations' as any)
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', conversationId) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/**
 * Format message timestamp
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  if (diffDays < 7) return date.toLocaleDateString('en-ZA', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}
