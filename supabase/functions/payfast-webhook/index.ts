import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

  try {
    console.log('PayFast webhook received');

    // Parse form data from PayFast
    const formData = await req.formData();
    const data: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log('PayFast ITN data:', data);

    const merchantId = Deno.env.get('PAYFAST_MERCHANT_ID');
    const passphrase = Deno.env.get('PAYFAST_PASSPHRASE');

    // Verify merchant ID
    if (data.merchant_id !== merchantId) {
      console.error('Invalid merchant ID');
      return new Response('Invalid merchant ID', { status: 400 });
    }

    // Validate signature (production security)
    const isValid = await validateSignature(data, passphrase || '');
    if (!isValid) {
      console.error('Invalid signature');
      return new Response('Invalid signature', { status: 400 });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const orderId = data.m_payment_id;
    const paymentStatus = data.payment_status;

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
