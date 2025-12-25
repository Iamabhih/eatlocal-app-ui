import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, verifyAuth, validateEnvVars } from "../_shared/auth.ts";

const corsHeaders = getCorsHeaders();

interface NotificationJob {
  id: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  template_id: string | null;
  channel: 'email' | 'sms' | 'push' | 'in_app' | 'whatsapp';
  subject: string | null;
  body: string;
  data: Record<string, unknown>;
  scheduled_for: string;
  priority: number;
  status: string;
  attempts: number;
  max_attempts: number;
}

// Template variable replacement
function renderTemplate(template: string, data: Record<string, unknown>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(data)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value ?? ''));
  }
  return rendered;
}

// Send email via Resend
async function sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('FROM_EMAIL') || 'EatLocal <noreply@eatlocal.co.za>';

  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html: body,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || `Email failed: ${response.status}` };
    }

    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Send SMS via Twilio
async function sendSms(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: 'Twilio credentials not configured' };
  }

  try {
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
        Body: body,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || `SMS failed: ${response.status}` };
    }

    return { success: true, sid: data.sid };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Create in-app notification
async function createInAppNotification(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message: body,
      type: data.type || 'general',
      is_read: false,
      action_url: data.link || null,
      metadata: data,
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, id: notification?.id };
}

// Process a batch of notifications
async function processNotifications(supabase: any, batchSize: number = 50): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Get pending notifications that are due
  const { data: jobs, error: fetchError } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('priority', { ascending: true })
    .order('scheduled_for', { ascending: true })
    .limit(batchSize);

  if (fetchError) {
    results.errors.push(`Fetch error: ${fetchError.message}`);
    return results;
  }

  if (!jobs || jobs.length === 0) {
    return results;
  }

  for (const job of jobs as NotificationJob[]) {
    results.processed++;

    // Mark as processing
    await supabase
      .from('notification_queue')
      .update({
        status: 'processing',
        last_attempt_at: new Date().toISOString(),
        attempts: job.attempts + 1,
      })
      .eq('id', job.id);

    // Render body with data
    const renderedBody = renderTemplate(job.body, job.data);
    const renderedSubject = job.subject ? renderTemplate(job.subject, job.data) : undefined;

    let result: { success: boolean; id?: string; sid?: string; error?: string };

    try {
      switch (job.channel) {
        case 'email':
          let emailAddress = job.email;
          if (!emailAddress && job.user_id) {
            // Get user email
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', job.user_id)
              .single();
            emailAddress = profile?.email;
          }

          if (!emailAddress) {
            result = { success: false, error: 'No email address' };
          } else {
            result = await sendEmail(emailAddress, renderedSubject || 'Notification', renderedBody);
          }
          break;

        case 'sms':
          let phoneNumber = job.phone;
          if (!phoneNumber && job.user_id) {
            // Get user phone
            const { data: profile } = await supabase
              .from('profiles')
              .select('phone')
              .eq('id', job.user_id)
              .single();
            phoneNumber = profile?.phone;
          }

          if (!phoneNumber) {
            result = { success: false, error: 'No phone number' };
          } else {
            result = await sendSms(phoneNumber, renderedBody);
          }
          break;

        case 'in_app':
          if (!job.user_id) {
            result = { success: false, error: 'No user ID for in-app notification' };
          } else {
            result = await createInAppNotification(
              supabase,
              job.user_id,
              renderedSubject || 'Notification',
              renderedBody,
              job.data
            );
          }
          break;

        case 'push':
          // Push notifications would require FCM/APNS integration
          result = { success: false, error: 'Push notifications not yet implemented' };
          break;

        case 'whatsapp':
          // WhatsApp Business API integration
          result = { success: false, error: 'WhatsApp not yet implemented' };
          break;

        default:
          result = { success: false, error: `Unknown channel: ${job.channel}` };
      }
    } catch (error) {
      result = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Update job status
    if (result.success) {
      results.succeeded++;
      await supabase
        .from('notification_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          external_id: result.id || result.sid,
        })
        .eq('id', job.id);
    } else {
      results.failed++;
      results.errors.push(`Job ${job.id}: ${result.error}`);

      // Check if should retry
      if (job.attempts + 1 < job.max_attempts) {
        // Schedule retry with exponential backoff
        const retryDelayMs = Math.pow(2, job.attempts) * 60000; // 1, 2, 4 minutes
        const nextRetry = new Date(Date.now() + retryDelayMs);

        await supabase
          .from('notification_queue')
          .update({
            status: 'pending', // Allow retry
            error_message: result.error,
            next_retry_at: nextRetry.toISOString(),
          })
          .eq('id', job.id);
      } else {
        // Max retries exceeded
        await supabase
          .from('notification_queue')
          .update({
            status: 'failed',
            error_message: result.error,
          })
          .eq('id', job.id);
      }
    }
  }

  return results;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate required environment variables
  const envCheck = validateEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
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

  // Verify this is a service call or admin request
  const authHeader = req.headers.get('authorization');
  const isServiceCall = authHeader?.includes(supabaseKey);

  if (!isServiceCall) {
    const authResult = await verifyAuth(authHeader, supabase as any);

    if (!authResult.authenticated) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only admins can trigger notification processing
    if (!authResult.roles?.includes('admin') && !authResult.roles?.includes('superadmin')) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  try {
    // Parse request body for batch size
    let batchSize = 50;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        batchSize = Math.min(body.batch_size || 50, 100); // Max 100
      } catch {
        // Use default
      }
    }

    console.log(`Processing notification queue (batch size: ${batchSize})`);

    const results = await processNotifications(supabase, batchSize);

    // Log results
    await supabase.from('system_logs').insert({
      log_type: 'background_job',
      action: 'process_notifications',
      metadata: results,
      success: results.failed === 0,
      session_id: crypto.randomUUID(),
      page_url: '/api/process-notifications',
    }).then(() => {}, () => { /* ignore */ });

    console.log(`Processed: ${results.processed}, Succeeded: ${results.succeeded}, Failed: ${results.failed}`);

    return new Response(
      JSON.stringify(results),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing notifications:', error);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
