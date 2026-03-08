/**
 * AI-Powered Chatbot Hook
 * Upgraded to use Lovable AI edge function for intelligent responses
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatSession {
  id: string;
  user_id: string | null;
  session_type: 'support' | 'order' | 'recommendation';
  status: 'active' | 'closed' | 'escalated';
  escalated_to: string | null;
  order_id: string | null;
  satisfaction_rating: number | null;
  resolution_time_seconds: number | null;
  created_at: string;
  closed_at: string | null;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: 'user' | 'bot' | 'agent';
  content: string;
  message_type: 'text' | 'image' | 'quick_reply' | 'card' | 'action';
  metadata: Record<string, any>;
  intent_detected: string | null;
  confidence_score: number | null;
  created_at: string;
}

export interface FAQEntry {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  helpful_count: number;
  not_helpful_count: number;
}

interface QuickReply {
  label: string;
  value: string;
}

/**
 * Get or create active chat session
 */
export function useChatSession() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chat-session', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: existing } = await (supabase as any)
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) return existing as ChatSession;

      const { data, error } = await (supabase as any)
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          session_type: 'support',
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') return null;
        throw error;
      }

      return data as ChatSession;
    },
    enabled: !!user,
  });
}

/**
 * Get chat messages for a session
 */
export function useChatMessages(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await (supabase as any)
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as ChatMessage[];
    },
    enabled: !!sessionId,
    refetchInterval: 3000,
  });
}

/**
 * Send a message using AI-powered chatbot
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      sessionId,
      content,
      messageType = 'text',
      metadata = {},
    }: {
      sessionId: string;
      content: string;
      messageType?: ChatMessage['message_type'];
      metadata?: Record<string, any>;
    }) => {
      // Save user message
      const { data: userMessage, error: userError } = await (supabase as any)
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_type: 'user',
          content,
          message_type: messageType,
          metadata,
        })
        .select()
        .single();

      if (userError) throw userError;

      // Call AI chatbot edge function
      try {
        const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-chatbot', {
          body: {
            message: content,
            session_id: sessionId,
            user_id: user?.id,
            context: {
              user_name: user?.user_metadata?.full_name,
            },
          },
        });

        if (aiError) throw aiError;

        // AI response is already saved by the edge function
        // Just return the response for UI
        return {
          userMessage,
          botMessage: {
            content: aiResponse?.content || "I'm processing your request...",
            quick_replies: aiResponse?.quick_replies || [],
            intent: aiResponse?.intent,
          },
        };
      } catch {
        // Fallback: save a basic response
        const fallbackContent = "I'm having trouble connecting right now. Please try again in a moment, or contact support at support@smashlocal.co.za";
        
        await (supabase as any)
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            sender_type: 'bot',
            content: fallbackContent,
            message_type: 'text',
          });

        return {
          userMessage,
          botMessage: { content: fallbackContent, quick_replies: [], intent: null },
        };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.sessionId] });
    },
  });
}

/**
 * Close chat session with rating
 */
export function useCloseSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, rating }: { sessionId: string; rating?: number }) => {
      const startTime = await (supabase as any)
        .from('chat_sessions')
        .select('created_at')
        .eq('id', sessionId)
        .single();

      const resolutionTime = startTime?.data
        ? Math.round((Date.now() - new Date(startTime.data.created_at).getTime()) / 1000)
        : null;

      const { error } = await (supabase as any)
        .from('chat_sessions')
        .update({
          status: 'closed',
          satisfaction_rating: rating,
          resolution_time_seconds: resolutionTime,
          closed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-session'] });
    },
  });
}

/**
 * Get FAQ entries by category
 */
export function useFAQ(category?: string) {
  return useQuery({
    queryKey: ['faq', category],
    queryFn: async () => {
      let query = (supabase as any)
        .from('faq_entries')
        .select('*')
        .eq('is_active', true)
        .order('helpful_count', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }
      return data as FAQEntry[];
    },
  });
}

/**
 * Rate FAQ helpfulness
 */
export function useRateFAQ() {
  return useMutation({
    mutationFn: async ({ faqId, helpful }: { faqId: string; helpful: boolean }) => {
      const column = helpful ? 'helpful_count' : 'not_helpful_count';
      await (supabase as any).rpc('increment_column', {
        p_table_name: 'faq_entries',
        p_column_name: column,
        p_row_id: faqId,
      });
    },
  });
}

export const FAQ_CATEGORIES = [
  { id: 'orders', label: 'Orders & Delivery' },
  { id: 'payment', label: 'Payment & Pricing' },
  { id: 'account', label: 'Account & Settings' },
  { id: 'support', label: 'Help & Support' },
];
