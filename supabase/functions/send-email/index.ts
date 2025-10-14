import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Simple fetch-based email sending (no external dependencies)
const sendEmail = async (to: string, subject: string, html: string) => {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "EatLocal <orders@eatlocal.app>",
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  type: 'order_confirmation' | 'order_status' | 'restaurant_alert' | 'delivery_assignment';
  data: any;
}

// Validation schemas
const EmailRequestSchema = z.object({
  to: z.string().email('Invalid email address').max(255, 'Email too long'),
  subject: z.string().min(1, 'Subject required').max(200, 'Subject too long'),
  type: z.enum(['order_confirmation', 'order_status', 'restaurant_alert', 'delivery_assignment']),
  data: z.record(z.any())
});

// Sanitize HTML to prevent XSS
function sanitizeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const getEmailTemplate = (type: string, data: any): string => {
  switch (type) {
    case 'order_confirmation':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ea384c;">Order Confirmed! 🎉</h1>
          <p>Hi ${sanitizeHtml(data.customerName)},</p>
          <p>Your order <strong>#${sanitizeHtml(data.orderNumber)}</strong> has been confirmed.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Order Details</h2>
            <p><strong>Restaurant:</strong> ${sanitizeHtml(data.restaurantName)}</p>
            <p><strong>Items:</strong></p>
            <ul>
              ${data.items.map((item: any) => `<li>${sanitizeHtml(String(item.quantity))}x ${sanitizeHtml(item.name)} - R${sanitizeHtml(String(item.price))}</li>`).join('')}
            </ul>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
            <p><strong>Subtotal:</strong> R${data.subtotal}</p>
            <p><strong>Delivery Fee:</strong> R${data.deliveryFee}</p>
            <p><strong>Service Fee:</strong> R${data.serviceFee}</p>
            <h3 style="color: #ea384c;">Total: R${data.total}</h3>
          </div>
          
          <p><strong>Delivery Address:</strong><br>${sanitizeHtml(data.deliveryAddress)}</p>
          <p><strong>Estimated Delivery:</strong> ${sanitizeHtml(String(data.estimatedDelivery))} mins</p>
          
          <p>Track your order in real-time in the app!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">
              Thank you for choosing EatLocal!<br>
              Questions? Contact us at support@eatlocal.app
            </p>
          </div>
        </div>
      `;
    
    case 'order_status':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ea384c;">Order Update 📦</h1>
          <p>Hi ${sanitizeHtml(data.customerName)},</p>
          <p>Your order <strong>#${sanitizeHtml(data.orderNumber)}</strong> status has been updated.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #ea384c; margin-top: 0;">${sanitizeHtml(data.status)}</h2>
            <p>${sanitizeHtml(data.statusMessage)}</p>
          </div>
          
          <p>Track your order in the app for live updates!</p>
        </div>
      `;
    
    case 'restaurant_alert':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ea384c;">New Order! 🔔</h1>
          <p>Hi ${sanitizeHtml(data.restaurantName)},</p>
          <p>You have a new order <strong>#${sanitizeHtml(data.orderNumber)}</strong></p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Order Details</h2>
            <p><strong>Customer:</strong> ${sanitizeHtml(data.customerName)}</p>
            <p><strong>Items:</strong></p>
            <ul>
              ${data.items.map((item: any) => `<li>${sanitizeHtml(String(item.quantity))}x ${sanitizeHtml(item.name)}</li>`).join('')}
            </ul>
            ${data.specialInstructions ? `<p><strong>Special Instructions:</strong> ${sanitizeHtml(data.specialInstructions)}</p>` : ''}
            <h3 style="color: #ea384c;">Order Total: R${sanitizeHtml(String(data.total))}</h3>
            <p><strong>Your Payout:</strong> R${sanitizeHtml(String(data.restaurantPayout))}</p>
          </div>
          
          <p><strong>Delivery Address:</strong><br>${sanitizeHtml(data.deliveryAddress)}</p>
          <p>Please confirm the order in your dashboard!</p>
        </div>
      `;
    
    case 'delivery_assignment':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ea384c;">New Delivery Assignment! 🚗</h1>
          <p>Hi ${sanitizeHtml(data.deliveryPartnerName)},</p>
          <p>You have been assigned delivery <strong>#${sanitizeHtml(data.orderNumber)}</strong></p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Delivery Details</h2>
            <p><strong>Restaurant:</strong> ${sanitizeHtml(data.restaurantName)}</p>
            <p><strong>Pick-up Address:</strong><br>${sanitizeHtml(data.pickupAddress)}</p>
            <p><strong>Delivery Address:</strong><br>${sanitizeHtml(data.deliveryAddress)}</p>
            <p><strong>Distance:</strong> ${sanitizeHtml(String(data.distance))} km</p>
            <h3 style="color: #ea384c;">Your Earnings: R${sanitizeHtml(String(data.earnings))}</h3>
          </div>
          
          <p>Open the app to view navigation and start delivery!</p>
        </div>
      `;
    
    default:
      return '<p>Email notification</p>';
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate input
    const validationResult = EmailRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { to, subject, type, data }: EmailRequest = validationResult.data;

    console.log(`Sending ${type} email to ${to}`);

    const html = getEmailTemplate(type, data);

    const emailResponse = await sendEmail(to, subject, html);

    console.log("Email sent successfully:", emailResponse);

    // Log to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('system_logs').insert({
      log_type: 'notification',
      action: 'email_sent',
      target: to,
      metadata: { type, subject, emailId: emailResponse.id },
      success: true,
      session_id: crypto.randomUUID(),
      page_url: '/api/send-email'
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
