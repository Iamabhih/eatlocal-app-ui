import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, RATE_LIMITS, addRateLimitHeaders } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get client identifier (IP or forwarded IP)
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || 'unknown';

  // Check rate limit for webhooks
  const rateLimitResult = await checkRateLimit(
    clientIp,
    RATE_LIMITS.webhook.limit,
    RATE_LIMITS.webhook.windowMs,
    'payfast-webhook'
  );

  const responseHeaders = new Headers(corsHeaders);
  addRateLimitHeaders(responseHeaders, rateLimitResult, RATE_LIMITS.webhook.limit);

  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      {
        status: 429,
        headers: { ...Object.fromEntries(responseHeaders), 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Parse form data from PayFast (simple HTML form submission)
    const formData = await req.formData();
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Basic validation - just check required fields exist
    const orderId = data.m_payment_id;
    const paymentStatus = data.payment_status;
    const amountGross = data.amount_gross;
    const pfPaymentId = data.pf_payment_id || `pf_${Date.now()}`;

    if (!orderId || !paymentStatus) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: m_payment_id and payment_status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ATOMIC UPDATE: Only update if status is still 'pending' to prevent race conditions
    // This ensures idempotency - if two webhooks arrive simultaneously, only one succeeds
    let orderStatus: string;
    let paymentRecordStatus: string;

    switch (paymentStatus.toUpperCase()) {
      case 'COMPLETE':
        orderStatus = 'confirmed';
        paymentRecordStatus = 'completed';
        break;
      case 'FAILED':
      case 'CANCELLED':
        orderStatus = 'cancelled';
        paymentRecordStatus = 'failed';
        break;
      default:
        // For PENDING or unknown statuses, acknowledge but don't update
        return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Atomic update - only updates if order is still pending
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('status', 'pending') // Only update if still pending (prevents double processing)
      .select('id')
      .single();

    if (updateError) {
      // If no rows updated, order was already processed
      if (updateError.code === 'PGRST116') {
        return new Response('OK - Already processed', { status: 200, headers: corsHeaders });
      }
      throw updateError;
    }

    // Only create payment record if order was successfully updated
    if (updatedOrder) {
      await supabase.from('payments').insert({
        order_id: orderId,
        amount: parseFloat(amountGross) || 0,
        status: paymentRecordStatus,
        payment_method: 'payfast',
        stripe_payment_intent_id: pfPaymentId,
        error_message: paymentRecordStatus === 'failed' ? `Payment ${paymentStatus.toLowerCase()}` : null
      });
    }

    return new Response('OK', {
      status: 200,
      headers: corsHeaders
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
