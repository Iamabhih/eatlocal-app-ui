/**
 * AI-Powered Chatbot Edge Function
 * Uses Lovable AI (Gemini) for intelligent customer support
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM_PROMPT = `You are the AI support assistant for "Smash Local", a South African super-app for food delivery, ride-sharing, hotel bookings, and venue experiences. 

Key facts:
- Currency is South African Rand (ZAR/R)
- Payment via PayFast (cards, EFT, instant EFT)
- Operating in South Africa (Johannesburg, Cape Town, Durban, etc.)
- Delivery fee varies by restaurant and distance
- Orders can be cancelled within 2 minutes for full refund
- After restaurant starts preparing, partial refund applies
- Support hours: Mon-Sun, 8am-10pm SAST
- Loyalty points earned on every order (1 point per R10 spent)

Your tone: Friendly, professional, empathetic, and solution-oriented. Use South African English naturally.
Keep responses concise (2-4 sentences max) and actionable.
If the user needs human support, acknowledge and offer to escalate.
Never make up order details or claim to have access to the user's specific order data unless provided.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { message, session_id, user_id, context } = await req.json();

    if (!message || !session_id) {
      return new Response(
        JSON.stringify({ error: 'message and session_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get conversation history for context
    const { data: history } = await supabase
      .from('chat_messages')
      .select('sender_type, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(10);

    const conversationHistory = (history || []).map((msg: any) => ({
      role: msg.sender_type === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    // Build context with user info
    let contextPrompt = '';
    if (context?.recent_orders) {
      contextPrompt += `\nUser's recent orders: ${JSON.stringify(context.recent_orders)}`;
    }
    if (context?.user_name) {
      contextPrompt += `\nUser's name: ${context.user_name}`;
    }

    // Call Lovable AI (Gemini)
    const aiResponse = await fetch('https://lovable-ai.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + contextPrompt },
          ...conversationHistory,
          { role: 'user', content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    let botContent: string;
    let intent: string | null = null;
    let confidence = 0.9;

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      botContent = aiData.choices?.[0]?.message?.content || "I'm having trouble processing that. Could you rephrase your question?";
    } else {
      // Fallback to keyword-based responses
      botContent = getFallbackResponse(message);
      confidence = 0.6;
    }

    // Detect if escalation needed
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('human') || lowerMsg.includes('agent') || lowerMsg.includes('real person')) {
      intent = 'escalation';
      botContent += "\n\nI'll connect you with a human agent. Our support team is available Mon-Sun, 8am-10pm SAST.";
      await supabase
        .from('chat_sessions')
        .update({ status: 'escalated' })
        .eq('id', session_id);
    }

    // Save bot response to database
    await supabase.from('chat_messages').insert({
      session_id,
      sender_type: 'bot',
      content: botContent,
      message_type: 'text',
      intent_detected: intent,
      confidence_score: confidence,
    });

    // Detect quick reply suggestions
    const quickReplies = generateQuickReplies(botContent, message);

    return new Response(
      JSON.stringify({
        content: botContent,
        intent,
        confidence,
        quick_replies: quickReplies,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Chatbot error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('track') || lower.includes('order')) {
    return "You can track your order in real-time from the Orders tab. You'll see the driver's live location once they've picked up your food.";
  }
  if (lower.includes('cancel')) {
    return "You can cancel within 2 minutes of placing for a full refund. After that, partial charges may apply. Go to Orders > tap your order > Cancel.";
  }
  if (lower.includes('refund')) {
    return "Refunds are processed within 3-5 business days to your original payment method. Report any issues through the order page.";
  }
  if (lower.includes('pay') || lower.includes('card')) {
    return "We accept Visa, Mastercard, and EFT via PayFast. If payment failed, check your card details and try again.";
  }
  return "I'm here to help! Could you tell me more about what you need? I can assist with orders, payments, account issues, and more.";
}

function generateQuickReplies(botContent: string, userMessage: string): Array<{ label: string; value: string }> {
  const lower = userMessage.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return [
      { label: 'Track my order', value: 'Where is my order?' },
      { label: 'Report an issue', value: 'I have a problem with my order' },
      { label: 'Payment help', value: 'I need help with payment' },
    ];
  }
  if (lower.includes('order') || lower.includes('track')) {
    return [
      { label: 'View my orders', value: 'Show me my recent orders' },
      { label: 'Cancel order', value: 'I want to cancel my order' },
    ];
  }
  return [
    { label: 'Talk to human', value: 'I want to talk to a real person' },
    { label: 'Something else', value: 'I have another question' },
  ];
}
