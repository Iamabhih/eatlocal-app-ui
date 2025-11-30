import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, RATE_LIMITS, addRateLimitHeaders } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayFastITN {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  item_name: string;
  item_description: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  merchant_id: string;
  signature: string;
}

// Validation schema for PayFast webhook data
const PayFastSchema = z.object({
  m_payment_id: z.string().uuid('Invalid order ID format'),
  pf_payment_id: z.string().min(1, 'Payment ID required'),
  payment_status: z.enum(['COMPLETE', 'FAILED', 'CANCELLED', 'PENDING']),
  amount_gross: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Invalid amount'),
  merchant_id: z.string().min(1, 'Merchant ID required'),
  signature: z.string().min(1, 'Signature required')
});

const validateSignature = async (data: Record<string, string>, passPhrase: string): Promise<boolean> => {
  // Remove signature from data
  const { signature, ...params } = data;
  
  // Create parameter string
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}=${encodeURIComponent(params[key]).replace(/%20/g, '+')}`)
    .join('&');
  
  // Add passphrase if provided
  const stringToHash = passPhrase ? `${paramString}&passphrase=${passPhrase}` : paramString;
  
  // Generate MD5 hash
  const encoder = new TextEncoder();
  const data_encoded = encoder.encode(stringToHash);
  
  const hash = await crypto.subtle.digest('MD5', data_encoded);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === signature;
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
    console.warn(`Rate limit exceeded for PayFast webhook from ${clientIp}`);
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      {
        status: 429,
        headers: { ...Object.fromEntries(responseHeaders), 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log('PayFast webhook received');

    // Parse form data from PayFast
    const formData = await req.formData();
    const data: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log('PayFast ITN data:', data);

    // Validate input data
    const validationResult = PayFastSchema.safeParse(data);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook data', details: validationResult.error.issues }),
        { status: 400, headers: corsHeaders }
      );
    }

    const isProduction = Deno.env.get('ENVIRONMENT') === 'production';
    const merchantId = Deno.env.get('PAYFAST_MERCHANT_ID');
    const passphrase = Deno.env.get('PAYFAST_PASSPHRASE');

    // CRITICAL: Always verify merchant ID
    if (!merchantId || data.merchant_id !== merchantId) {
      console.error('Invalid merchant ID - potential fraud attempt');
      return new Response('Unauthorized', { status: 401 });
    }

    // CRITICAL: Always validate signature in production
    if (isProduction) {
      const isValid = await validateSignature(data, passphrase || '');
      if (!isValid) {
        console.error('Invalid signature - potential fraud attempt');
        return new Response('Invalid signature', { status: 403 });
      }
    } else {
      console.warn('Running in sandbox mode - signature validation relaxed');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const orderId = data.m_payment_id;
    const paymentStatus = data.payment_status;

    // Initialize Supabase client
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (existingOrder && existingOrder.status !== 'pending') {
      console.log('Order already processed, ignoring duplicate webhook');
      return new Response('OK - Already processed', { status: 200 });
    }

    console.log(`Processing payment for order ${orderId}, status: ${paymentStatus}`);

    // Update order based on payment status
    let orderStatus: string;
    switch (paymentStatus) {
      case 'COMPLETE':
        orderStatus = 'confirmed';
        
        // Create payment record
        await supabase.from('payments').insert({
          order_id: orderId,
          amount: parseFloat(data.amount_gross),
          status: 'completed',
          payment_method: 'payfast',
          stripe_payment_intent_id: data.pf_payment_id
        });
        
        break;
      case 'FAILED':
      case 'CANCELLED':
        orderStatus = 'cancelled';
        
        // Create failed payment record
        await supabase.from('payments').insert({
          order_id: orderId,
          amount: parseFloat(data.amount_gross),
          status: 'failed',
          payment_method: 'payfast',
          error_message: `Payment ${paymentStatus.toLowerCase()}`
        });
        
        break;
      default:
        console.log(`Unhandled payment status: ${paymentStatus}`);
        return new Response('OK', { status: 200 });
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: orderStatus })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw updateError;
    }

    console.log(`Order ${orderId} updated to ${orderStatus}`);

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('PayFast webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
