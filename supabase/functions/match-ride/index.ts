import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    console.log('Matching ride request:', { pickup_latitude, pickup_longitude, journey_mode, service_tier });

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

  } catch (error) {
    console.error('Error in match-ride function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
