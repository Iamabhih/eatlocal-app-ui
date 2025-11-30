import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, RATE_LIMITS, addRateLimitHeaders } from "../_shared/rateLimiter.ts";
import { getCorsHeaders, verifyAuth, hasAnyRole, unauthorizedResponse, validateEnvVars } from "../_shared/auth.ts";

const corsHeaders = getCorsHeaders();

// Validate required environment variables at startup
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY'];

// Simple fetch-based email sending
const sendEmail = async (to: string, subject: string, html: string) => {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "EatLocal <noreply@eatlocal.co.za>";

  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return await response.json();
};

interface EmailRequest {
  to: string;
  subject: string;
  type: 'order_confirmation' | 'order_status' | 'restaurant_alert' | 'delivery_assignment' | 'welcome' | 'password_reset';
  data: Record<string, unknown>;
}

// Validation schemas
const EmailRequestSchema = z.object({
  to: z.string().email('Invalid email address').max(255, 'Email too long'),
  subject: z.string().min(1, 'Subject required').max(200, 'Subject too long'),
  type: z.enum(['order_confirmation', 'order_status', 'restaurant_alert', 'delivery_assignment', 'welcome', 'password_reset']),
  data: z.record(z.any())
});

// Sanitize HTML to prevent XSS
function sanitizeHtml(text: unknown): string {
  if (text === null || text === undefined) return '';
  const str = String(text);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const SUPPORT_EMAIL = Deno.env.get('SUPPORT_EMAIL') || 'support@eatlocal.co.za';
const BRAND_NAME = Deno.env.get('BRAND_NAME') || 'EatLocal';

const getEmailTemplate = (type: string, data: Record<string, unknown>): string => {
  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
      .container { max-width: 600px; margin: 0 auto; background: white; }
      .header { background: #ea384c; padding: 20px; text-align: center; }
      .header h1 { color: white; margin: 0; }
      .content { padding: 20px 30px; }
      .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; }
      .box { background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
      .button { display: inline-block; background: #ea384c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
    </style>
  `;

  switch (type) {
    case 'order_confirmation':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>Order Confirmed! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${sanitizeHtml(data.customerName)},</p>
            <p>Your order <strong>#${sanitizeHtml(data.orderNumber)}</strong> has been confirmed.</p>

            <div class="box">
              <h3 style="margin-top: 0;">Order Details</h3>
              <p><strong>Restaurant:</strong> ${sanitizeHtml(data.restaurantName)}</p>
              <p><strong>Items:</strong></p>
              <ul>
                ${Array.isArray(data.items) ? data.items.map((item: Record<string, unknown>) =>
                  `<li>${sanitizeHtml(item.quantity)}x ${sanitizeHtml(item.name)} - R${sanitizeHtml(item.price)}</li>`
                ).join('') : ''}
              </ul>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
              <p><strong>Subtotal:</strong> R${sanitizeHtml(data.subtotal)}</p>
              <p><strong>Delivery Fee:</strong> R${sanitizeHtml(data.deliveryFee)}</p>
              <p><strong>Service Fee:</strong> R${sanitizeHtml(data.serviceFee)}</p>
              <h3 style="color: #ea384c;">Total: R${sanitizeHtml(data.total)}</h3>
            </div>

            <p><strong>Delivery Address:</strong><br>${sanitizeHtml(data.deliveryAddress)}</p>
            <p><strong>Estimated Delivery:</strong> ${sanitizeHtml(data.estimatedDelivery)} mins</p>

            <p>Track your order in real-time in the app!</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing ${BRAND_NAME}!</p>
            <p>Questions? Contact us at ${SUPPORT_EMAIL}</p>
          </div>
        </div>
      `;

    case 'order_status':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>Order Update 📦</h1>
          </div>
          <div class="content">
            <p>Hi ${sanitizeHtml(data.customerName)},</p>
            <p>Your order <strong>#${sanitizeHtml(data.orderNumber)}</strong> status has been updated.</p>

            <div class="box">
              <h2 style="color: #ea384c; margin-top: 0;">${sanitizeHtml(data.status)}</h2>
              <p>${sanitizeHtml(data.statusMessage)}</p>
            </div>

            <p>Track your order in the app for live updates!</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing ${BRAND_NAME}!</p>
          </div>
        </div>
      `;

    case 'restaurant_alert':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>New Order! 🔔</h1>
          </div>
          <div class="content">
            <p>Hi ${sanitizeHtml(data.restaurantName)},</p>
            <p>You have a new order <strong>#${sanitizeHtml(data.orderNumber)}</strong></p>

            <div class="box">
              <h3 style="margin-top: 0;">Order Details</h3>
              <p><strong>Customer:</strong> ${sanitizeHtml(data.customerName)}</p>
              <p><strong>Items:</strong></p>
              <ul>
                ${Array.isArray(data.items) ? data.items.map((item: Record<string, unknown>) =>
                  `<li>${sanitizeHtml(item.quantity)}x ${sanitizeHtml(item.name)}</li>`
                ).join('') : ''}
              </ul>
              ${data.specialInstructions ? `<p><strong>Special Instructions:</strong> ${sanitizeHtml(data.specialInstructions)}</p>` : ''}
              <h3 style="color: #ea384c;">Order Total: R${sanitizeHtml(data.total)}</h3>
              <p><strong>Your Payout:</strong> R${sanitizeHtml(data.restaurantPayout)}</p>
            </div>

            <p><strong>Delivery Address:</strong><br>${sanitizeHtml(data.deliveryAddress)}</p>
            <p>Please confirm the order in your dashboard!</p>
          </div>
          <div class="footer">
            <p>${BRAND_NAME} Partner Portal</p>
          </div>
        </div>
      `;

    case 'delivery_assignment':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>New Delivery! 🚗</h1>
          </div>
          <div class="content">
            <p>Hi ${sanitizeHtml(data.deliveryPartnerName)},</p>
            <p>You have been assigned delivery <strong>#${sanitizeHtml(data.orderNumber)}</strong></p>

            <div class="box">
              <h3 style="margin-top: 0;">Delivery Details</h3>
              <p><strong>Restaurant:</strong> ${sanitizeHtml(data.restaurantName)}</p>
              <p><strong>Pick-up Address:</strong><br>${sanitizeHtml(data.pickupAddress)}</p>
              <p><strong>Delivery Address:</strong><br>${sanitizeHtml(data.deliveryAddress)}</p>
              <p><strong>Distance:</strong> ${sanitizeHtml(data.distance)} km</p>
              <h3 style="color: #ea384c;">Your Earnings: R${sanitizeHtml(data.earnings)}</h3>
            </div>

            <p>Open the app to view navigation and start delivery!</p>
          </div>
          <div class="footer">
            <p>${BRAND_NAME} Driver App</p>
          </div>
        </div>
      `;

    case 'welcome':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>Welcome to ${BRAND_NAME}! 👋</h1>
          </div>
          <div class="content">
            <p>Hi ${sanitizeHtml(data.name)},</p>
            <p>Thank you for joining ${BRAND_NAME}! We're excited to have you.</p>

            <div class="box">
              <h3 style="margin-top: 0;">Get Started</h3>
              <ul>
                <li>Browse restaurants near you</li>
                <li>Book rides to your destinations</li>
                <li>Discover hotels and experiences</li>
              </ul>
            </div>

            <p style="text-align: center;">
              <a href="${sanitizeHtml(data.appUrl)}" class="button">Open ${BRAND_NAME}</a>
            </p>
          </div>
          <div class="footer">
            <p>Questions? Contact us at ${SUPPORT_EMAIL}</p>
          </div>
        </div>
      `;

    case 'password_reset':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>Reset Your Password 🔐</h1>
          </div>
          <div class="content">
            <p>Hi,</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${sanitizeHtml(data.resetUrl)}" class="button">Reset Password</a>
            </p>

            <p>This link will expire in 1 hour.</p>
            <p style="color: #666; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>${BRAND_NAME} Security Team</p>
          </div>
        </div>
      `;

    default:
      return '<p>Email notification</p>';
  }
};

// Roles that can send emails
const ALLOWED_ROLES = ['admin', 'superadmin', 'restaurant', 'delivery_partner'];

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate required environment variables
  const envCheck = validateEnvVars(requiredEnvVars);
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

  // Check if this is an internal service call (from other edge functions)
  const isServiceCall = authHeader?.includes(supabaseKey);

  // Verify authentication for non-service calls
  let identifier: string;

  if (isServiceCall) {
    identifier = 'service';
  } else {
    const authResult = await verifyAuth(authHeader, supabase);

    if (!authResult.authenticated) {
      return unauthorizedResponse(authResult.error);
    }

    // Check if user has permission to send emails
    if (!hasAnyRole(authResult, ALLOWED_ROLES)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to send emails' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    identifier = authResult.userId!;
  }

  // Check rate limit
  const rateLimitResult = await checkRateLimit(
    identifier,
    RATE_LIMITS.sendEmail.limit,
    RATE_LIMITS.sendEmail.windowMs,
    'send-email'
  );

  const responseHeaders = new Headers(corsHeaders);
  addRateLimitHeaders(responseHeaders, rateLimitResult, RATE_LIMITS.sendEmail.limit);

  if (!rateLimitResult.allowed) {
    console.warn(`Rate limit exceeded for send-email from ${identifier}`);
    return new Response(
      JSON.stringify({ error: 'Too many email requests. Please try again later.' }),
      { status: 429, headers: { ...Object.fromEntries(responseHeaders), 'Content-Type': 'application/json' } }
    );
  }

  try {
    const requestBody = await req.json();

    // Validate input
    const validationResult = EmailRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { to, subject, type, data }: EmailRequest = validationResult.data;

    console.log(`Sending ${type} email to ${to}`);

    const html = getEmailTemplate(type, data);
    const emailResponse = await sendEmail(to, subject, html);

    console.log("Email sent successfully:", emailResponse);

    // Log to database
    await supabase.from('system_logs').insert({
      log_type: 'notification',
      action: 'email_sent',
      target: to,
      metadata: { type, subject, emailId: emailResponse.id, sender: identifier },
      success: true,
      session_id: crypto.randomUUID(),
      page_url: '/api/send-email'
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-email function:", error);

    // Log error
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    await supabase.from('error_logs').insert({
      error_type: 'email_send_failed',
      error_message: errorMessage,
      severity: 'medium',
      metadata: { identifier }
    }).catch(() => { /* ignore logging errors */ });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
