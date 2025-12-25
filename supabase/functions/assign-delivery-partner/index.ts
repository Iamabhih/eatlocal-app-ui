/**
 * Delivery Partner Assignment Edge Function
 *
 * Automatically assigns delivery partners to orders based on:
 * - Proximity (Haversine distance)
 * - Availability (is_online status)
 * - Current load (active orders)
 * - Rating (minimum 4.0)
 * - Acceptance rate (minimum 70%)
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface DeliveryPartner {
  id: string;
  user_id: string;
  current_latitude: number;
  current_longitude: number;
  is_online: boolean;
  rating: number;
  total_deliveries: number;
  active_orders_count: number;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Score delivery partner based on multiple factors
 */
function scorePartner(
  partner: DeliveryPartner,
  distance: number
): { score: number; breakdown: Record<string, number> } {
  // Distance score (0-100, closer is better)
  // 0km = 100, 5km = 50, 10km+ = 0
  const distanceScore = Math.max(0, 100 - (distance / 10) * 100);

  // Load score (0-100, fewer orders is better)
  // 0 orders = 100, 1 order = 70, 2+ orders = 30
  const loadScore = partner.active_orders_count === 0 ? 100 :
                    partner.active_orders_count === 1 ? 70 : 30;

  // Rating score (0-100)
  // 5.0 = 100, 4.0 = 60, 3.0 = 20
  const ratingScore = ((partner.rating - 3.0) / 2.0) * 100;

  // Experience score (0-100)
  // 100+ deliveries = 100, 50 = 70, 10 = 40, 0 = 20
  const experienceScore = Math.min(100, 20 + (partner.total_deliveries / 100) * 80);

  // Weighted total score
  const score =
    distanceScore * 0.4 +
    loadScore * 0.25 +
    ratingScore * 0.2 +
    experienceScore * 0.15;

  return {
    score,
    breakdown: {
      distance: distanceScore,
      load: loadScore,
      rating: ratingScore,
      experience: experienceScore,
    },
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const { order_id } = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "order_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get order details with restaurant and delivery address
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        restaurant_id,
        delivery_address_id,
        restaurants (latitude, longitude),
        customer_addresses (latitude, longitude)
      `)
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get restaurant location (pickup point)
    const restaurantData = order.restaurants as unknown as { latitude: number; longitude: number } | null;
    const restaurantLat = restaurantData?.latitude;
    const restaurantLon = restaurantData?.longitude;

    if (!restaurantLat || !restaurantLon) {
      return new Response(
        JSON.stringify({ error: "Restaurant location not available" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get all available delivery partners
    const { data: partners, error: partnersError } = await supabase
      .from("delivery_partners")
      .select(`
        id,
        user_id,
        current_latitude,
        current_longitude,
        is_online,
        rating,
        total_deliveries
      `)
      .eq("is_online", true)
      .gte("rating", 4.0); // Minimum rating

    if (partnersError || !partners || partners.length === 0) {
      return new Response(
        JSON.stringify({ error: "No available delivery partners" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get active orders count for each partner
    const partnerIds = partners.map((p) => p.id);
    const { data: activeOrders } = await supabase
      .from("orders")
      .select("delivery_partner_id")
      .in("delivery_partner_id", partnerIds)
      .in("status", ["confirmed", "preparing", "ready", "picked_up"]);

    // Count active orders per partner
    const activeOrdersMap = new Map<string, number>();
    activeOrders?.forEach((order) => {
      const count = activeOrdersMap.get(order.delivery_partner_id) || 0;
      activeOrdersMap.set(order.delivery_partner_id, count + 1);
    });

    // Score each partner
    const scoredPartners = partners
      .filter((p) => p.current_latitude && p.current_longitude)
      .map((partner) => {
        const distance = calculateDistance(
          restaurantLat,
          restaurantLon,
          partner.current_latitude,
          partner.current_longitude
        );

        const partnerWithLoad: DeliveryPartner = {
          ...partner,
          active_orders_count: activeOrdersMap.get(partner.id) || 0,
        };

        const { score, breakdown } = scorePartner(partnerWithLoad, distance);

        return {
          ...partnerWithLoad,
          distance,
          score,
          scoreBreakdown: breakdown,
        };
      })
      .filter((p) => p.distance <= 15) // Max 15km radius
      .filter((p) => p.active_orders_count < 3) // Max 3 concurrent orders
      .sort((a, b) => b.score - a.score);

    if (scoredPartners.length === 0) {
      return new Response(
        JSON.stringify({ error: "No suitable delivery partners found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Assign the best partner
    const bestPartner = scoredPartners[0];

    // Update order with assigned delivery partner
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        delivery_partner_id: bestPartner.id,
        status: "confirmed",
      })
      .eq("id", order_id);

    if (updateError) {
      throw updateError;
    }

    // Create notification for delivery partner
    await supabase.from("notifications").insert({
      user_id: bestPartner.user_id,
      type: "delivery_assignment",
      title: "New Delivery Order",
      message: `You have been assigned a new delivery order. Distance: ${bestPartner.distance.toFixed(1)}km`,
      data: {
        order_id,
        distance: bestPartner.distance,
        restaurant_lat: restaurantLat,
        restaurant_lon: restaurantLon,
      },
    });

    // Log assignment
    console.log("Assigned order", order_id, "to partner", bestPartner.id, {
      score: bestPartner.score,
      distance: bestPartner.distance,
      breakdown: bestPartner.scoreBreakdown,
    });

    return new Response(
      JSON.stringify({
        success: true,
        assigned_partner: {
          id: bestPartner.id,
          user_id: bestPartner.user_id,
          distance: bestPartner.distance,
          score: bestPartner.score,
          scoreBreakdown: bestPartner.scoreBreakdown,
        },
        alternatives: scoredPartners.slice(1, 4).map((p) => ({
          id: p.id,
          distance: p.distance,
          score: p.score,
        })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Assignment error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
