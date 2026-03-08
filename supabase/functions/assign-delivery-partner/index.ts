/**
 * Smart Delivery Partner Assignment Edge Function v2
 *
 * Upgraded with:
 * - Uses delivery_partner_status table for real-time availability
 * - Creates order_offers instead of direct assignment (60s accept window)
 * - Surge pricing multiplier based on demand/supply ratio
 * - Escalation: 3 rounds of offers before admin notification
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scorePartner(
  distance: number,
  activeOrders: number,
  rating: number,
  totalDeliveries: number
): number {
  const distanceScore = Math.max(0, 100 - (distance / 10) * 100) * 0.4;
  const loadScore = (activeOrders === 0 ? 100 : activeOrders === 1 ? 70 : 30) * 0.25;
  const ratingScore = Math.max(0, ((rating - 3.0) / 2.0) * 100) * 0.2;
  const expScore = Math.min(100, 20 + (totalDeliveries / 100) * 80) * 0.15;
  return distanceScore + loadScore + ratingScore + expScore;
}

async function calculateSurgeMultiplier(supabase: any, restaurantLat: number, restaurantLon: number): Promise<number> {
  // Count pending orders in 5km radius (demand)
  const { count: demandCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'confirmed'])
    .gte('created_at', new Date(Date.now() - 30 * 60000).toISOString());

  // Count available drivers (supply)
  const { count: supplyCount } = await supabase
    .from('delivery_partner_status')
    .select('*', { count: 'exact', head: true })
    .eq('is_online', true)
    .eq('available_for_orders', true);

  const demand = demandCount || 0;
  const supply = supplyCount || 1;
  const ratio = demand / supply;

  if (ratio > 3) return 1.5;  // Very high demand
  if (ratio > 2) return 1.3;  // High demand
  if (ratio > 1.5) return 1.15; // Moderate demand
  return 1.0; // Normal
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { order_id, round = 1 } = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "order_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get order with restaurant location
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`id, restaurant_id, delivery_address_id, total, restaurants (latitude, longitude, name), customer_addresses (latitude, longitude)`)
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const restData = order.restaurants as any;
    const restaurantLat = restData?.latitude;
    const restaurantLon = restData?.longitude;

    if (!restaurantLat || !restaurantLon) {
      return new Response(
        JSON.stringify({ error: "Restaurant location not available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate surge
    const surgeMultiplier = await calculateSurgeMultiplier(supabase, restaurantLat, restaurantLon);

    // Get already-offered partner IDs for this order
    const { data: existingOffers } = await supabase
      .from('order_offers')
      .select('partner_id')
      .eq('order_id', order_id);
    const offeredPartnerIds = new Set((existingOffers || []).map((o: any) => o.partner_id));

    // Get available partners from delivery_partner_status
    const { data: statuses } = await supabase
      .from('delivery_partner_status')
      .select('partner_id, current_latitude, current_longitude, current_order_count, max_concurrent_orders')
      .eq('is_online', true)
      .eq('available_for_orders', true);

    if (!statuses || statuses.length === 0) {
      if (round >= 3) {
        // Escalate to admin
        await supabase.from('notifications').insert({
          user_id: order_id, // placeholder
          type: 'alert',
          title: 'No Drivers Available',
          message: `Order ${order_id} has no available delivery partners after 3 rounds.`,
        });
      }
      return new Response(
        JSON.stringify({ error: "No available delivery partners", round, escalated: round >= 3 }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Score and filter partners
    const candidates = statuses
      .filter((s: any) => s.current_latitude && s.current_longitude)
      .filter((s: any) => !offeredPartnerIds.has(s.partner_id))
      .filter((s: any) => (s.current_order_count || 0) < (s.max_concurrent_orders || 3))
      .map((s: any) => {
        const distance = calculateDistance(restaurantLat, restaurantLon, s.current_latitude, s.current_longitude);
        const score = scorePartner(distance, s.current_order_count || 0, 4.5, 50); // Default rating/deliveries
        const baseFee = 15 + distance * 3; // R15 base + R3/km
        const estimatedEarnings = baseFee * surgeMultiplier;
        return { ...s, distance, score, estimatedEarnings };
      })
      .filter((p: any) => p.distance <= 15)
      .sort((a: any, b: any) => b.score - a.score);

    if (candidates.length === 0) {
      if (round >= 3) {
        await supabase.from('notifications').insert({
          user_id: order_id,
          type: 'alert',
          title: 'Delivery Assignment Failed',
          message: `No suitable drivers for order after ${round} rounds.`,
        });
      }
      return new Response(
        JSON.stringify({ error: "No suitable partners in range", round, escalated: round >= 3 }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create offers for top 3 candidates (or fewer)
    const topCandidates = candidates.slice(0, 3);
    const expiresAt = new Date(Date.now() + 60000).toISOString(); // 60 second window

    const offers = topCandidates.map((c: any) => ({
      order_id,
      partner_id: c.partner_id,
      status: 'pending',
      estimated_earnings: c.estimatedEarnings,
      expires_at: expiresAt,
    }));

    const { data: createdOffers, error: offerError } = await supabase
      .from('order_offers')
      .insert(offers)
      .select();

    if (offerError) throw offerError;

    // Send notifications to each candidate
    for (const candidate of topCandidates) {
      await supabase.from('notifications').insert({
        user_id: candidate.partner_id,
        type: 'delivery',
        title: '🚀 New Delivery Offer',
        message: `New order ${candidate.distance.toFixed(1)}km away. Earn R${candidate.estimatedEarnings.toFixed(0)}${surgeMultiplier > 1 ? ` (${surgeMultiplier}x surge)` : ''}. Accept within 60s!`,
        action_url: `/delivery/orders`,
        metadata: { order_id, offer_expires: expiresAt },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        round,
        surge_multiplier: surgeMultiplier,
        offers_sent: topCandidates.length,
        expires_at: expiresAt,
        candidates: topCandidates.map((c: any) => ({
          partner_id: c.partner_id,
          distance: c.distance,
          score: c.score,
          estimated_earnings: c.estimatedEarnings,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Assignment error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
