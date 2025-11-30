import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimitMemory, addRateLimitHeaders } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Health check specific rate limit (higher for monitoring tools)
const HEALTH_CHECK_LIMIT = 60; // 60 per minute
const HEALTH_CHECK_WINDOW = 60000; // 1 minute

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get client IP for rate limiting
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || 'unknown';

  // Use memory-based rate limit (lighter weight for health checks)
  const rateLimitResult = checkRateLimitMemory(
    `health:${clientIp}`,
    HEALTH_CHECK_LIMIT,
    HEALTH_CHECK_WINDOW
  );

  const responseHeaders = new Headers(corsHeaders);
  addRateLimitHeaders(responseHeaders, rateLimitResult, HEALTH_CHECK_LIMIT);

  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many health check requests' }),
      {
        status: 429,
        headers: { ...Object.fromEntries(responseHeaders), 'Content-Type': 'application/json' }
      }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    database: false,
    auth: false,
  };
  
  try {
    // Check database connectivity - select single row to verify connection
    const { error: dbError } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1);
    checks.database = !dbError;
    
    // Check auth service
    const { error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });
    checks.auth = !authError;
    
  } catch (error) {
    console.error('Health check failed:', error);
    checks.status = 'unhealthy';
  }
  
  const allHealthy = checks.database && checks.auth;
  checks.status = allHealthy ? 'healthy' : 'degraded';
  
  return new Response(JSON.stringify(checks), {
    status: allHealthy ? 200 : 503,
    headers: { 
      'Content-Type': 'application/json',
      ...corsHeaders 
    }
  });
});
