import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, RATE_LIMITS, addRateLimitHeaders } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get client identifier from auth header or IP
  const authHeader = req.headers.get('authorization');
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || 'unknown';

  // Use user ID if authenticated, otherwise IP
  let identifier = clientIp;
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.sub) {
        identifier = payload.sub;
      }
    } catch {
      // Use IP if token parsing fails
    }
  }

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      pickup_latitude,
      pickup_longitude,
      dropoff_latitude,
      dropoff_longitude,
      pickup_address,
      dropoff_address,
      journey_mode,
      service_tier
    } = await req.json();

    // GPS coordinate validation
    const isValidLatitude = (lat: unknown): lat is number =>
      typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;

    const isValidLongitude = (lng: unknown): lng is number =>
      typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;

    if (!isValidLatitude(pickup_latitude) || !isValidLongitude(pickup_longitude)) {
      return new Response(
        JSON.stringify({ error: 'Invalid pickup coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidLatitude(dropoff_latitude) || !isValidLongitude(dropoff_longitude)) {
      return new Response(
        JSON.stringify({ error: 'Invalid dropoff coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    return new Response(
      JSON.stringify({ 
        drivers: sortedDrivers.slice(0, 5),
        estimated_distance_km,
        estimated_duration_minutes,
        tier_config: tierConfig
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    console.error('Error in match-ride function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
