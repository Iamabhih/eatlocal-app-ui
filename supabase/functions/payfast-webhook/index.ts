import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, RATE_LIMITS, addRateLimitHeaders } from "../_shared/rateLimiter.ts";
import { getCorsHeaders, verifyPayFastSignature, isPayFastIP, validateEnvVars } from "../_shared/auth.ts";

const corsHeaders = getCorsHeaders();

// PayFast valid statuses
const VALID_STATUSES = ['COMPLETE', 'FAILED', 'CANCELLED', 'PENDING'] as const;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate required environment variables
  const envCheck = validateEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  if (!envCheck.valid) {
    console.error('Missing environment variables:', envCheck.missing);
    return new Response('OK', { status: 200, headers: corsHeaders }); // Don't expose config errors
  }

  // Get client IP for logging and security
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || 'unknown';

  // Initialize Supabase client for logging
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Log webhook attempt
  const logWebhook = async (success: boolean, orderId: string | null, error?: string) => {
    try {
      await supabase.from('system_logs').insert({
        log_type: 'webhook',
        action: 'payfast_webhook',
        target: orderId,
        metadata: { ip: clientIp, success, error },
        success,
        session_id: crypto.randomUUID(),
        page_url: '/api/payfast-webhook'
      });
    } catch (e) {
      console.error('Failed to log webhook:', e);
    }
  };

  // Verify IP is from PayFast (production security)
  if (!isPayFastIP(clientIp)) {
    console.warn(`PayFast webhook from unauthorized IP: ${clientIp}`);
    await logWebhook(false, null, `Unauthorized IP: ${clientIp}`);
    // Still return 200 to avoid revealing security measures
    return new Response('OK', { status: 200, headers: corsHeaders });
  }

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
    await logWebhook(false, null, 'Rate limit exceeded');
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429, headers: { ...Object.fromEntries(responseHeaders), 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse form data from PayFast
    const formData = await req.formData();
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Extract fields
    const orderId = data.m_payment_id;
    const paymentStatus = data.payment_status?.toUpperCase();
    const amountGross = data.amount_gross;
    const pfPaymentId = data.pf_payment_id;
    const signature = data.signature;

    // Validate required fields
    if (!orderId || !paymentStatus) {
      await logWebhook(false, orderId, 'Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: m_payment_id and payment_status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate payment status
    if (!VALID_STATUSES.includes(paymentStatus as typeof VALID_STATUSES[number])) {
      await logWebhook(false, orderId, `Invalid payment status: ${paymentStatus}`);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Verify PayFast signature (CRITICAL SECURITY CHECK)
    if (signature) {
      const isValidSignature = await verifyPayFastSignature(data, signature);
      if (!isValidSignature) {
        console.error(`Invalid PayFast signature for order ${orderId}`);
        await logWebhook(false, orderId, 'Invalid signature');
        // Return 200 to avoid revealing signature validation failure
        return new Response('OK', { status: 200, headers: corsHeaders });
      }
    } else if (Deno.env.get('PAYFAST_SANDBOX') !== 'true') {
      // In production, signature is required
      console.error(`Missing PayFast signature for order ${orderId}`);
      await logWebhook(false, orderId, 'Missing signature');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Verify amount matches order (prevent amount manipulation)
    if (amountGross) {
      const { data: orderData } = await supabase
        .from('orders')
        .select('total')
        .eq('id', orderId)
        .single();

      if (orderData) {
        const expectedAmount = parseFloat(orderData.total);
        const receivedAmount = parseFloat(amountGross);

        // Allow small rounding difference (1 cent)
        if (Math.abs(expectedAmount - receivedAmount) > 0.01) {
          console.error(`Amount mismatch for order ${orderId}: expected ${expectedAmount}, got ${receivedAmount}`);
          await logWebhook(false, orderId, `Amount mismatch: expected ${expectedAmount}, got ${receivedAmount}`);
          return new Response('OK', { status: 200, headers: corsHeaders });
        }
      }
    }

    // ATOMIC UPDATE: Only update if status is still 'pending' to prevent race conditions
    let orderStatus: string;
    let paymentRecordStatus: string;

    switch (paymentStatus) {
      case 'COMPLETE':
        orderStatus = 'confirmed';
        paymentRecordStatus = 'completed';
        break;
      case 'FAILED':
      case 'CANCELLED':
        orderStatus = 'cancelled';
        paymentRecordStatus = 'failed';
        break;
      case 'PENDING':
        // Acknowledge pending status but don't update order
        await logWebhook(true, orderId, 'Payment pending');
        return new Response('OK', { status: 200, headers: corsHeaders });
      default:
        await logWebhook(true, orderId, `Unknown status: ${paymentStatus}`);
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
      .select('id, customer_id, total')
      .single();

    if (updateError) {
      // If no rows updated, order was already processed
      if (updateError.code === 'PGRST116') {
        await logWebhook(true, orderId, 'Already processed');
        return new Response('OK - Already processed', { status: 200, headers: corsHeaders });
      }
      throw updateError;
    }

    // Only create payment record if order was successfully updated
    if (updatedOrder) {
      const { error: paymentError } = await supabase.from('payments').insert({
        order_id: orderId,
        amount: parseFloat(amountGross) || 0,
        status: paymentRecordStatus,
        payment_method: 'payfast',
        external_payment_id: pfPaymentId || `pf_${Date.now()}`,
        metadata: {
          pf_payment_id: pfPaymentId,
          payment_status: paymentStatus,
          verified_at: new Date().toISOString(),
          client_ip: clientIp
        },
        error_message: paymentRecordStatus === 'failed' ? `Payment ${paymentStatus.toLowerCase()}` : null
      });

      if (paymentError) {
        console.error('Failed to create payment record:', paymentError);
      }

      // Trigger order confirmation email (async, don't wait)
      if (paymentRecordStatus === 'completed') {
        fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            to: updatedOrder.customer_id, // Will be resolved by send-email
            type: 'order_confirmation',
            subject: `Order #${orderId.slice(0, 8)} Confirmed`,
            data: { orderId }
          })
        }).catch(e => console.error('Failed to trigger confirmation email:', e));
      }
    }

    await logWebhook(true, orderId);
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('PayFast webhook error:', error);
    await logWebhook(false, null, errorMessage);

    // Always return 200 to PayFast to prevent retries
    return new Response('OK', { status: 200, headers: corsHeaders });
  }
});
