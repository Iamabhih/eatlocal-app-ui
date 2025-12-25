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

      // Check for existing active session
      const { data: existing, error: fetchError } = await (supabase as any)
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) return existing as ChatSession;

      // Create new session if none exists
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
    refetchInterval: 3000, // Poll for new messages
  });
}

/**
 * Send a message in the chat
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

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

      // Process message and get bot response
      const botResponse = await processBotResponse(content, sessionId);

      // Save bot response
      const { data: botMessage, error: botError } = await (supabase as any)
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_type: 'bot',
          content: botResponse.content,
          message_type: botResponse.messageType,
          metadata: botResponse.metadata,
          intent_detected: botResponse.intent,
          confidence_score: botResponse.confidence,
        })
        .select()
        .single();

      if (botError) throw botError;

      return { userMessage, botMessage };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.sessionId] });
    },
  });
}

/**
 * Process user message and generate bot response
 */
async function processBotResponse(
  message: string,
  sessionId: string
): Promise<{
  content: string;
  messageType: ChatMessage['message_type'];
  metadata: Record<string, any>;
  intent: string | null;
  confidence: number;
}> {
  const lowerMessage = message.toLowerCase();

  // Intent detection with keywords
  const intents = [
    { intent: 'track_order', keywords: ['track', 'where', 'order', 'status', 'delivery'], confidence: 0.9 },
    { intent: 'cancel_order', keywords: ['cancel', 'stop', 'abort'], confidence: 0.85 },
    { intent: 'refund', keywords: ['refund', 'money back', 'return'], confidence: 0.85 },
    { intent: 'wrong_order', keywords: ['wrong', 'incorrect', 'mistake', 'not what'], confidence: 0.8 },
    { intent: 'late_delivery', keywords: ['late', 'taking long', 'delay', 'slow'], confidence: 0.8 },
    { intent: 'payment', keywords: ['pay', 'payment', 'card', 'charge'], confidence: 0.85 },
    { intent: 'promo_code', keywords: ['promo', 'discount', 'coupon', 'voucher', 'code'], confidence: 0.9 },
    { intent: 'account', keywords: ['account', 'password', 'login', 'sign'], confidence: 0.85 },
    { intent: 'greeting', keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon'], confidence: 0.95 },
    { intent: 'thanks', keywords: ['thank', 'thanks', 'cheers', 'appreciated'], confidence: 0.95 },
    { intent: 'human_agent', keywords: ['human', 'agent', 'person', 'real', 'talk to someone'], confidence: 0.9 },
  ];

  let detectedIntent: string | null = null;
  let maxConfidence = 0;

  for (const { intent, keywords, confidence } of intents) {
    const matches = keywords.filter(kw => lowerMessage.includes(kw)).length;
    if (matches > 0) {
      const adjustedConfidence = confidence * (matches / keywords.length);
      if (adjustedConfidence > maxConfidence) {
        maxConfidence = adjustedConfidence;
        detectedIntent = intent;
      }
    }
  }

  // Generate response based on intent
  let response = {
    content: '',
    messageType: 'text' as ChatMessage['message_type'],
    metadata: {} as Record<string, any>,
    intent: detectedIntent,
    confidence: maxConfidence,
  };

  switch (detectedIntent) {
    case 'greeting':
      response.content = "Hello! Welcome to EatLocal support. How can I help you today?";
      response.messageType = 'quick_reply';
      response.metadata = {
        quickReplies: [
          { label: 'Track my order', value: 'track_order' },
          { label: 'Report an issue', value: 'report_issue' },
          { label: 'Payment help', value: 'payment' },
          { label: 'Other', value: 'other' },
        ],
      };
      break;

    case 'track_order':
      response.content = "I can help you track your order! Please check the Orders tab in the app where you'll see real-time updates including driver location. Would you like me to show you your active orders?";
      response.messageType = 'quick_reply';
      response.metadata = {
        quickReplies: [
          { label: 'View active orders', value: 'view_orders' },
          { label: 'Order not showing', value: 'order_missing' },
        ],
        action: 'navigate',
        route: '/orders',
      };
      break;

    case 'cancel_order':
      response.content = "I understand you'd like to cancel your order. You can cancel within 2 minutes of placing it for a full refund. After the restaurant starts preparing, cancellation may incur a partial charge. Would you like to proceed?";
      response.messageType = 'quick_reply';
      response.metadata = {
        quickReplies: [
          { label: 'Yes, cancel order', value: 'confirm_cancel' },
          { label: 'No, keep order', value: 'keep_order' },
        ],
      };
      break;

    case 'refund':
      response.content = "I'm sorry you're having an issue. For refunds, please go to your order in the Orders tab and select 'Report Issue'. Our team reviews all requests within 24 hours and will process eligible refunds to your original payment method.";
      break;

    case 'wrong_order':
    case 'late_delivery':
      response.content = "I'm really sorry about that! Please report this issue through the app by going to your order and selecting 'Report Issue'. Include photos if applicable. Our team will review and process a refund or credit if applicable.";
      response.messageType = 'quick_reply';
      response.metadata = {
        quickReplies: [
          { label: 'Report issue now', value: 'report_issue' },
          { label: 'Talk to agent', value: 'human_agent' },
        ],
      };
      break;

    case 'payment':
      response.content = "For payment questions: We accept all major credit/debit cards and EFT via PayFast. If your payment failed, please ensure your card details are correct and has sufficient funds. Need more specific help?";
      response.messageType = 'quick_reply';
      response.metadata = {
        quickReplies: [
          { label: 'Payment failed', value: 'payment_failed' },
          { label: 'Add payment method', value: 'add_payment' },
          { label: 'Refund status', value: 'refund' },
        ],
      };
      break;

    case 'promo_code':
      response.content = "To apply a promo code: Add items to your cart, go to checkout, and look for the 'Add Promo Code' field. Enter your code and the discount will apply automatically. Note: Some codes have minimum order requirements or specific restaurant restrictions.";
      break;

    case 'account':
      response.content = "For account help: Go to Profile > Settings where you can update your details, change password, manage addresses, and adjust notification preferences. For password reset, use the 'Forgot Password' link on the login page.";
      break;

    case 'human_agent':
      response.content = "I'll connect you with a human agent. Our support team is available Mon-Sun, 8am-10pm. You can also email support@eatlocal.co.za or call 0800-EAT-LOCAL for immediate assistance.";
      response.metadata = {
        escalate: true,
      };
      // Escalate session
      await (supabase as any)
        .from('chat_sessions')
        .update({ status: 'escalated' })
        .eq('id', sessionId);
      break;

    case 'thanks':
      response.content = "You're welcome! Is there anything else I can help you with?";
      response.messageType = 'quick_reply';
      response.metadata = {
        quickReplies: [
          { label: 'No, all done', value: 'close' },
          { label: 'Yes, another question', value: 'continue' },
        ],
      };
      break;

    default:
      // Search FAQ for answer
      const faqAnswer = await searchFAQ(message);
      if (faqAnswer) {
        response.content = faqAnswer;
        response.intent = 'faq';
        response.confidence = 0.7;
      } else {
        response.content = "I'm not quite sure I understand. Could you please rephrase that, or select one of the options below?";
        response.messageType = 'quick_reply';
        response.metadata = {
          quickReplies: [
            { label: 'Track order', value: 'track_order' },
            { label: 'Payment issue', value: 'payment' },
            { label: 'Report problem', value: 'report_issue' },
            { label: 'Talk to human', value: 'human_agent' },
          ],
        };
      }
  }

  return response;
}

/**
 * Search FAQ for relevant answer
 */
async function searchFAQ(query: string): Promise<string | null> {
  const { data, error } = await (supabase as any)
    .from('faq_entries')
    .select('*')
    .eq('is_active', true);

  if (error || !data) return null;

  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/);

  let bestMatch: { entry: FAQEntry; score: number } | null = null;

  for (const entry of data as FAQEntry[]) {
    let score = 0;

    // Check keywords
    for (const keyword of entry.keywords || []) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }

    // Check question similarity
    const questionWords = entry.question.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (questionWords.includes(word)) {
        score += 1;
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { entry, score };
    }
  }

  return bestMatch && bestMatch.score >= 2 ? bestMatch.entry.answer : null;
}

/**
 * Close chat session with rating
 */
export function useCloseSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      rating,
    }: {
      sessionId: string;
      rating?: number;
    }) => {
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
    mutationFn: async ({
      faqId,
      helpful,
    }: {
      faqId: string;
      helpful: boolean;
    }) => {
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
