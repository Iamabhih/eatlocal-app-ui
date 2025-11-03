import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    // Check database connectivity
    const { error: dbError } = await supabase
      .from('restaurants')
      .select('count')
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
