import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, RATE_LIMITS, addRateLimitHeaders } from "../_shared/rateLimiter.ts";
import { getCorsHeaders, verifyAuth, unauthorizedResponse, validateEnvVars } from "../_shared/auth.ts";

const corsHeaders = getCorsHeaders();

// Input validation schema
const MatchRideRequestSchema = z.object({
  pickup_latitude: z.number().min(-90).max(90),
  pickup_longitude: z.number().min(-180).max(180),
  dropoff_latitude: z.number().min(-90).max(90),
  dropoff_longitude: z.number().min(-180).max(180),
  pickup_address: z.string().min(1).max(500).optional(),
  dropoff_address: z.string().min(1).max(500).optional(),
  journey_mode: z.enum(['budget', 'standard', 'premium', 'business', 'night_out', 'family']).optional().default('standard'),
  service_tier: z.enum(['economy', 'comfort', 'premium', 'luxury']).optional().default('economy')
});

serve(async (req) => {
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

  // Get authorization header
  const authHeader = req.headers.get('authorization');

  // Verify authentication - users must be logged in to request rides
  const authResult = await verifyAuth(authHeader, supabase);

  if (!authResult.authenticated) {
    return unauthorizedResponse(authResult.error);
  }

  const identifier = authResult.userId!;

  // Check rate limit for API calls
  const rateLimitResult = await checkRateLimit(
    identifier,
    RATE_LIMITS.api.limit,
    RATE_LIMITS.api.windowMs,
    'match-ride'
  );

  const responseHeaders = new Headers(corsHeaders);
  addRateLimitHeaders(responseHeaders, rateLimitResult, RATE_LIMITS.api.limit);

  if (!rateLimitResult.allowed) {
    console.warn(`Rate limit exceeded for match-ride from ${identifier}`);
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: { ...Object.fromEntries(responseHeaders), 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const requestBody = await req.json();

    // Validate input with Zod schema
    const validationResult = MatchRideRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      pickup_latitude,
      pickup_longitude,
      dropoff_latitude,
      dropoff_longitude,
      pickup_address,
      dropoff_address,
      journey_mode,
      service_tier
    } = validationResult.data;

    // Validate coordinates are not at (0,0) which often indicates missing data
    if ((pickup_latitude === 0 && pickup_longitude === 0) || (dropoff_latitude === 0 && dropoff_longitude === 0)) {
      return new Response(
        JSON.stringify({ error: 'Coordinates cannot be at origin (0,0). Please provide valid location data.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate distance using Haversine formula (simplified for demo)
    const R = 6371; // Earth's radius in km
    const dLat = (dropoff_latitude - pickup_latitude) * Math.PI / 180;
    const dLon = (dropoff_longitude - pickup_longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pickup_latitude * Math.PI / 180) * Math.cos(dropoff_latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const estimated_distance_km = R * c;
    const estimated_duration_minutes = Math.round(estimated_distance_km / 0.6); // ~40km/h avg speed

    // Find nearby available drivers using spatial query
    const { data: nearbyDrivers, error: driversError } = await supabase
      .rpc('find_nearby_drivers', {
        pickup_lat: pickup_latitude,
        pickup_lng: pickup_longitude,
        max_distance_km: 10,
        required_tier: service_tier
      });

    if (driversError) {
      console.error('Error finding drivers:', driversError);
    }

    // Get tier configuration for pricing
    const { data: tierConfig } = await supabase
      .from('ride_service_tiers')
      .select('*')
      .eq('tier', service_tier)
      .single();

    const drivers = nearbyDrivers || [];

    // Sort drivers based on journey mode preferences
    let sortedDrivers = [...drivers];
    switch(journey_mode) {
      case 'budget':
        sortedDrivers.sort((a, b) => a.estimated_fare - b.estimated_fare);
        break;
      case 'night_out':
        sortedDrivers.sort((a, b) => b.average_rating - a.average_rating);
        break;
      case 'family':
        sortedDrivers = sortedDrivers.filter(d => d.vehicle_type === 'suv' || d.vehicle_type === 'van');
        break;
      case 'business':
      case 'premium':
        sortedDrivers.sort((a, b) => b.average_rating - a.average_rating);
        break;
      default:
        sortedDrivers.sort((a, b) => a.distance_km - b.distance_km);
    }

    // Log successful ride match request
    await supabase.from('system_logs').insert({
      log_type: 'api',
      action: 'match_ride_request',
      target: identifier,
      metadata: {
        pickup: { lat: pickup_latitude, lng: pickup_longitude },
        dropoff: { lat: dropoff_latitude, lng: dropoff_longitude },
        journey_mode,
        service_tier,
        drivers_found: sortedDrivers.length,
        estimated_distance_km,
        estimated_duration_minutes
      },
      success: true,
      session_id: crypto.randomUUID(),
      page_url: '/api/match-ride'
    }).then(() => {}, () => { /* ignore logging errors */ });

    return new Response(
      JSON.stringify({
        drivers: sortedDrivers.slice(0, 5),
        estimated_distance_km,
        estimated_duration_minutes,
        tier_config: tierConfig
      }),
      {
        headers: { ...Object.fromEntries(responseHeaders), 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    console.error('Error in match-ride function:', error);

    // Log error
    await supabase.from('error_logs').insert({
      error_type: 'match_ride_failed',
      error_message: errorMessage,
      severity: 'medium',
      metadata: { userId: identifier }
    }).then(() => {}, () => { /* ignore logging errors */ });

    return new Response(
      JSON.stringify({ error: 'Failed to match ride. Please try again.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
