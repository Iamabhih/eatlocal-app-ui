import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, RATE_LIMITS, addRateLimitHeaders } from "../_shared/rateLimiter.ts";
import { getCorsHeaders, verifyAuth, hasAnyRole, unauthorizedResponse, validateEnvVars } from "../_shared/auth.ts";

const corsHeaders = getCorsHeaders();

// Validation schema for SMS request
const SmsRequestSchema = z.object({
  to: z.string().regex(/^\+27[0-9]{9}$/, 'Invalid South African phone number (format: +27XXXXXXXXX)'),
  message: z.string().min(1, 'Message required').max(1600, 'Message too long (max 1600 chars)'),
  template_name: z.string().optional(),
  template_data: z.record(z.any()).optional(),
});

// Twilio SMS sending function
async function sendTwilioSms(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured');
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: to,
      From: fromNumber,
      Body: message,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.message || `Twilio error: ${response.status}`,
    };
  }

  return {
    success: true,
    sid: data.sid,
  };
}

// Replace template variables
function renderTemplate(template: string, data: Record<string, unknown>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(data)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value ?? ''));
  }
  return rendered;
}

// Roles that can send SMS
const ALLOWED_ROLES = ['admin', 'superadmin', 'restaurant', 'delivery_partner'];

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate required environment variables
  const envCheck = validateEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER']);
  if (!envCheck.valid) {
    console.error('Missing environment variables:', envCheck.missing);
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get authorization header
  const authHeader = req.headers.get('authorization');

  // Check if this is an internal service call
  const isServiceCall = authHeader?.includes(supabaseKey);

  // Verify authentication for non-service calls
  let identifier: string;

  if (isServiceCall) {
    identifier = 'service';
  } else {
    const authResult = await verifyAuth(authHeader, supabase as any);

    if (!authResult.authenticated) {
      return unauthorizedResponse(authResult.error);
    }

    // Check if user has permission to send SMS
    if (!hasAnyRole(authResult, ALLOWED_ROLES)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to send SMS' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    identifier = authResult.userId!;
  }

  // Check rate limit (stricter for SMS due to cost)
  const rateLimitResult = await checkRateLimit(
    identifier,
    10, // 10 SMS per minute
    60000,
    'send-sms'
  );

  const responseHeaders = new Headers(corsHeaders);
  addRateLimitHeaders(responseHeaders, rateLimitResult, 10);

  if (!rateLimitResult.allowed) {
    console.warn(`Rate limit exceeded for send-sms from ${identifier}`);
    return new Response(
      JSON.stringify({ error: 'Too many SMS requests. Please try again later.' }),
      { status: 429, headers: { ...Object.fromEntries(responseHeaders), 'Content-Type': 'application/json' } }
    );
  }

  try {
    const requestBody = await req.json();

    // Validate input
    const validationResult = SmsRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let { to, message } = validationResult.data;
    const { template_name, template_data } = validationResult.data;

    // If template is specified, load and render it
    if (template_name) {
      const { data: template, error: templateError } = await supabase
        .from('notification_templates')
        .select('sms_body')
        .eq('name', template_name)
        .eq('supports_sms', true)
        .eq('is_active', true)
        .single();

      if (templateError || !template?.sms_body) {
        return new Response(
          JSON.stringify({ error: `Template '${template_name}' not found or does not support SMS` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      message = renderTemplate(template.sms_body, template_data || {});
    }

    console.log(`Sending SMS to ${to.substring(0, 6)}...`);

    // Send via Twilio
    const smsResult = await sendTwilioSms(to, message);

    // Calculate SMS segments (GSM-7: 160 chars, Unicode: 70 chars)
    const isUnicode = /[^\x00-\x7F]/.test(message);
    const charsPerSegment = isUnicode ? 70 : 160;
    const segments = Math.ceil(message.length / charsPerSegment);

    // Log SMS
    const { error: logError } = await supabase.from('sms_logs').insert({
      phone: to,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''), // Truncate for privacy
      provider: 'twilio',
      external_id: smsResult.sid,
      status: smsResult.success ? 'sent' : 'failed',
      segments,
      error_message: smsResult.error,
      sent_at: smsResult.success ? new Date().toISOString() : null,
    });

    if (logError) {
      console.error('Failed to log SMS:', logError);
    }

    // Also log to system_logs
    await supabase.from('system_logs').insert({
      log_type: 'notification',
      action: 'sms_sent',
      target: to.substring(0, 6) + '***',
      metadata: {
        template: template_name,
        segments,
        success: smsResult.success,
        sender: identifier,
      },
      success: smsResult.success,
      session_id: crypto.randomUUID(),
      page_url: '/api/send-sms'
    }).then(() => {}, () => { /* ignore */ });

    if (!smsResult.success) {
      return new Response(
        JSON.stringify({ error: smsResult.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        sid: smsResult.sid,
        segments,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-sms function:', error);

    // Log error
    await supabase.from('error_logs').insert({
      error_type: 'sms_send_failed',
      error_message: errorMessage,
      severity: 'medium',
      metadata: { identifier }
    }).then(() => {}, () => { /* ignore */ });

    return new Response(
      JSON.stringify({ error: 'Failed to send SMS' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
