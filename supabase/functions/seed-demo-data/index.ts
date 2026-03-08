import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Check admin role using service role client
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = roles?.some(
      (r: any) => r.role === "admin" || r.role === "superadmin"
    );
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action } = await req.json();

    if (action === "reset") {
      await resetDemoData(admin);
      return new Response(
        JSON.stringify({ success: true, message: "Demo data cleared" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "seed") {
      await resetDemoData(admin); // clear first
      await seedDemoData(admin, userId);
      return new Response(
        JSON.stringify({ success: true, message: "Demo data seeded" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "seed" or "reset".' }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("seed-demo-data error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function resetDemoData(admin: any) {
  // Delete in reverse dependency order
  // Order item options for demo orders
  await admin.from("order_items").delete().like("order_id", "demo-%");
  await admin.from("order_status_history").delete().like("order_id", "demo-%");
  await admin.from("reviews").delete().like("order_id", "demo-%");
  await admin.from("orders").delete().like("id", "demo-%");

  // Menu items & categories for demo restaurants
  const { data: demoRestaurants } = await admin
    .from("restaurants")
    .select("id")
    .like("name", "Demo %");
  const rIds = demoRestaurants?.map((r: any) => r.id) || [];
  if (rIds.length) {
    // Get categories
    const { data: cats } = await admin
      .from("menu_categories")
      .select("id")
      .in("restaurant_id", rIds);
    const catIds = cats?.map((c: any) => c.id) || [];
    if (catIds.length) {
      // Get menu items
      const { data: items } = await admin
        .from("menu_items")
        .select("id")
        .in("category_id", catIds);
      const itemIds = items?.map((i: any) => i.id) || [];
      if (itemIds.length) {
        await admin
          .from("menu_item_options")
          .delete()
          .in(
            "option_group_id",
            (
              await admin
                .from("menu_item_option_groups")
                .select("id")
                .in("menu_item_id", itemIds)
            ).data?.map((g: any) => g.id) || []
          );
        await admin
          .from("menu_item_option_groups")
          .delete()
          .in("menu_item_id", itemIds);
      }
      await admin.from("menu_items").delete().in("category_id", catIds);
    }
    await admin.from("menu_categories").delete().in("restaurant_id", rIds);
    await admin.from("restaurants").delete().in("id", rIds);
  }

  // Hotels & room types
  const { data: demoHotels } = await admin
    .from("hotels")
    .select("id")
    .like("name", "Demo %");
  const hIds = demoHotels?.map((h: any) => h.id) || [];
  if (hIds.length) {
    await admin.from("room_types").delete().in("hotel_id", hIds);
    await admin.from("hotels").delete().in("id", hIds);
  }

  // Venues & experiences
  const { data: demoVenues } = await admin
    .from("venues")
    .select("id")
    .like("name", "Demo %");
  const vIds = demoVenues?.map((v: any) => v.id) || [];
  if (vIds.length) {
    await admin.from("experiences").delete().in("venue_id", vIds);
    await admin.from("venues").delete().in("id", vIds);
  }

  // Promo codes
  await admin.from("promo_codes").delete().like("code", "DEMO%");
}

async function seedDemoData(admin: any, userId: string) {
  // --- Restaurants ---
  const restaurants = [
    {
      name: "Demo Shisa Nyama Grill",
      description: "Authentic South African braai and grills in Soweto",
      cuisine_type: "South African",
      street_address: "123 Vilakazi St",
      city: "Soweto",
      state: "Gauteng",
      zip_code: "1804",
      phone: "011-555-0101",
      owner_id: userId,
      delivery_fee: 25,
      minimum_order: 50,
      estimated_delivery_time: 35,
      rating: 4.5,
      total_reviews: 42,
    },
    {
      name: "Demo Cape Malay Kitchen",
      description: "Traditional Cape Malay cuisine from Bo-Kaap",
      cuisine_type: "Cape Malay",
      street_address: "45 Wale St, Bo-Kaap",
      city: "Cape Town",
      state: "Western Cape",
      zip_code: "8001",
      phone: "021-555-0202",
      owner_id: userId,
      delivery_fee: 30,
      minimum_order: 60,
      estimated_delivery_time: 40,
      rating: 4.7,
      total_reviews: 28,
    },
    {
      name: "Demo Bunny Chow House",
      description: "Famous Durban bunny chows and curry",
      cuisine_type: "Indian",
      street_address: "78 Florida Rd",
      city: "Durban",
      state: "KwaZulu-Natal",
      zip_code: "4001",
      phone: "031-555-0303",
      owner_id: userId,
      delivery_fee: 20,
      minimum_order: 40,
      estimated_delivery_time: 30,
      rating: 4.3,
      total_reviews: 55,
    },
  ];

  const { data: insertedRestaurants } = await admin
    .from("restaurants")
    .insert(restaurants)
    .select();

  if (!insertedRestaurants?.length) throw new Error("Failed to insert restaurants");

  // --- Menu Categories & Items ---
  const menuData: Record<string, { categories: { name: string; items: { name: string; price: number; description: string; calories?: number }[] }[] }> = {
    "Demo Shisa Nyama Grill": {
      categories: [
        {
          name: "Braai Meats",
          items: [
            { name: "Lamb Chops", price: 95, description: "Succulent lamb chops braaied to perfection", calories: 480 },
            { name: "Boerewors Roll", price: 45, description: "Traditional boerewors in a fresh roll with chakalaka", calories: 520 },
            { name: "Peri-Peri Chicken", price: 85, description: "Flame-grilled chicken with peri-peri sauce", calories: 380 },
            { name: "T-Bone Steak", price: 120, description: "500g T-bone steak off the grill", calories: 650 },
          ],
        },
        {
          name: "Sides",
          items: [
            { name: "Pap & Sauce", price: 25, description: "Traditional maize pap with tomato & onion sauce", calories: 220 },
            { name: "Chakalaka", price: 20, description: "Spicy vegetable relish", calories: 150 },
            { name: "Coleslaw", price: 15, description: "Creamy homemade coleslaw", calories: 180 },
          ],
        },
      ],
    },
    "Demo Cape Malay Kitchen": {
      categories: [
        {
          name: "Mains",
          items: [
            { name: "Bobotie", price: 95, description: "Spiced minced meat bake with egg custard topping", calories: 520 },
            { name: "Cape Malay Curry", price: 85, description: "Fragrant curry with apricots and almonds", calories: 450 },
            { name: "Sosaties", price: 90, description: "Marinated lamb skewers with dried apricots", calories: 400 },
            { name: "Waterblommetjie Bredie", price: 110, description: "Traditional lamb and water lily stew", calories: 480 },
          ],
        },
        {
          name: "Desserts",
          items: [
            { name: "Koeksisters", price: 30, description: "Braided doughnuts dipped in syrup", calories: 350 },
            { name: "Malva Pudding", price: 45, description: "Warm sponge pudding with apricot jam", calories: 420 },
          ],
        },
      ],
    },
    "Demo Bunny Chow House": {
      categories: [
        {
          name: "Bunny Chows",
          items: [
            { name: "Quarter Mutton Bunny", price: 65, description: "Quarter loaf filled with mutton curry", calories: 680 },
            { name: "Quarter Chicken Bunny", price: 55, description: "Quarter loaf filled with chicken curry", calories: 600 },
            { name: "Quarter Bean Bunny", price: 45, description: "Quarter loaf filled with bean curry (vegetarian)", calories: 520 },
            { name: "Half Mutton Bunny", price: 95, description: "Half loaf filled with mutton curry", calories: 1100 },
          ],
        },
        {
          name: "Extras",
          items: [
            { name: "Samoosas (6)", price: 35, description: "Crispy pastry triangles with spiced filling", calories: 360 },
            { name: "Roti", price: 15, description: "Soft flatbread", calories: 200 },
            { name: "Masala Chips", price: 30, description: "Fries with masala spice", calories: 380 },
          ],
        },
      ],
    },
  };

  const allMenuItems: any[] = [];
  for (const rest of insertedRestaurants) {
    const data = menuData[rest.name];
    if (!data) continue;
    for (let ci = 0; ci < data.categories.length; ci++) {
      const cat = data.categories[ci];
      const { data: insertedCat } = await admin
        .from("menu_categories")
        .insert({
          restaurant_id: rest.id,
          name: cat.name,
          display_order: ci,
        })
        .select()
        .single();

      if (insertedCat) {
        const items = cat.items.map((item) => ({
          restaurant_id: rest.id,
          category_id: insertedCat.id,
          name: item.name,
          description: item.description,
          price: item.price,
          calories: item.calories || null,
          is_available: true,
        }));
        const { data: insertedItems } = await admin
          .from("menu_items")
          .insert(items)
          .select();
        if (insertedItems) allMenuItems.push(...insertedItems);
      }
    }
  }

  // --- Orders ---
  const statuses = ["pending", "confirmed", "preparing", "delivered", "cancelled"];
  const demoOrders: any[] = [];
  for (let i = 0; i < 5; i++) {
    const rest = insertedRestaurants[i % insertedRestaurants.length];
    const status = statuses[i];
    const subtotal = 100 + i * 25;
    const tax = Math.round(subtotal * 0.15 * 100) / 100;
    const total = subtotal + tax + (rest.delivery_fee || 25);
    const order = {
      id: `demo-order-${i + 1}-${Date.now()}`,
      order_number: `DEMO-${1000 + i}`,
      customer_id: userId,
      restaurant_id: rest.id,
      status,
      subtotal,
      tax,
      delivery_fee: rest.delivery_fee || 25,
      total,
      platform_commission: Math.round(subtotal * 0.15 * 100) / 100,
      net_restaurant_payout: Math.round(subtotal * 0.85 * 100) / 100,
      settlement_fee: 2.5,
      payment_method: "card",
      payment_status: status === "cancelled" ? "refunded" : "paid",
      ...(status === "delivered"
        ? { delivered_at: new Date().toISOString() }
        : {}),
      ...(status === "cancelled"
        ? {
            cancelled_at: new Date().toISOString(),
            cancellation_reason: "Demo cancellation",
          }
        : {}),
    };
    demoOrders.push(order);
  }

  const { data: insertedOrders } = await admin
    .from("orders")
    .insert(demoOrders)
    .select();

  // Order items
  if (insertedOrders?.length && allMenuItems.length) {
    const orderItems: any[] = [];
    for (const order of insertedOrders) {
      // Pick 2-3 random items from the same restaurant
      const restItems = allMenuItems.filter(
        (mi) => mi.restaurant_id === order.restaurant_id
      );
      const picked = restItems.slice(0, Math.min(3, restItems.length));
      for (const item of picked) {
        const qty = Math.floor(Math.random() * 2) + 1;
        orderItems.push({
          order_id: order.id,
          menu_item_id: item.id,
          quantity: qty,
          unit_price: item.price,
          subtotal: item.price * qty,
        });
      }
    }
    await admin.from("order_items").insert(orderItems);
  }

  // --- Reviews ---
  if (insertedOrders?.length) {
    const deliveredOrders = insertedOrders.filter(
      (o: any) => o.status === "delivered"
    );
    const reviewTexts = [
      "Amazing food, will order again!",
      "Great flavours and fast delivery.",
    ];
    const reviews = deliveredOrders.map((o: any, idx: number) => ({
      user_id: userId,
      restaurant_id: o.restaurant_id,
      order_id: o.id,
      rating: 4 + (idx % 2),
      food_rating: 4 + (idx % 2),
      delivery_rating: 4,
      review_text: reviewTexts[idx % reviewTexts.length],
    }));
    if (reviews.length) await admin.from("reviews").insert(reviews);
  }

  // --- Hotels ---
  const hotels = [
    {
      name: "Demo Table Mountain Lodge",
      description: "Luxury lodge with stunning views of Table Mountain",
      street_address: "10 Kloof Nek Rd",
      city: "Cape Town",
      state: "Western Cape",
      owner_id: userId,
      star_rating: 4,
      base_price: 1200,
      total_rooms: 24,
      rating: 4.6,
      total_reviews: 18,
      amenities: ["Wi-Fi", "Pool", "Spa", "Restaurant", "Parking"],
      property_type: "lodge",
      verification_status: "verified",
    },
    {
      name: "Demo Kruger Safari Hotel",
      description: "Gateway to Kruger National Park with game drives",
      street_address: "5 Safari Rd",
      city: "Hazyview",
      state: "Mpumalanga",
      owner_id: userId,
      star_rating: 3,
      base_price: 850,
      total_rooms: 16,
      rating: 4.2,
      total_reviews: 12,
      amenities: ["Wi-Fi", "Pool", "Game Drives", "Restaurant"],
      property_type: "hotel",
      verification_status: "verified",
    },
  ];

  const { data: insertedHotels } = await admin
    .from("hotels")
    .insert(hotels)
    .select();

  if (insertedHotels?.length) {
    const roomTypes: any[] = [];
    for (const hotel of insertedHotels) {
      roomTypes.push(
        {
          hotel_id: hotel.id,
          name: "Standard Room",
          description: "Comfortable room with all essentials",
          base_price: hotel.base_price,
          max_guests: 2,
          total_rooms: 10,
          beds_description: "1 Queen Bed",
          amenities: ["Wi-Fi", "TV", "Air Conditioning"],
        },
        {
          hotel_id: hotel.id,
          name: "Deluxe Suite",
          description: "Spacious suite with premium amenities",
          base_price: hotel.base_price * 1.8,
          max_guests: 4,
          total_rooms: 4,
          beds_description: "1 King Bed + 1 Sofa Bed",
          amenities: ["Wi-Fi", "TV", "Air Conditioning", "Mini Bar", "Balcony"],
        }
      );
    }
    await admin.from("room_types").insert(roomTypes);
  }

  // --- Venues & Experiences ---
  const venues = [
    {
      name: "Demo Maboneng Arts Precinct",
      description: "Urban arts and culture venue in the heart of Johannesburg",
      venue_type: "entertainment",
      street_address: "286 Fox St, Maboneng",
      city: "Johannesburg",
      state: "Gauteng",
      owner_id: userId,
      rating: 4.4,
      total_reviews: 22,
      amenities: ["Wi-Fi", "Bar", "Live Music", "Art Gallery"],
      verification_status: "verified",
    },
    {
      name: "Demo Franschhoek Wine Estate",
      description: "Premium wine tasting and vineyard tours",
      venue_type: "winery",
      street_address: "12 Main Rd",
      city: "Franschhoek",
      state: "Western Cape",
      owner_id: userId,
      rating: 4.8,
      total_reviews: 35,
      amenities: ["Parking", "Restaurant", "Garden", "Tours"],
      verification_status: "verified",
    },
  ];

  const { data: insertedVenues } = await admin
    .from("venues")
    .insert(venues)
    .select();

  if (insertedVenues?.length) {
    const experiences = [
      {
        name: "Demo Street Art Walking Tour",
        description: "Guided 2-hour tour through Maboneng's famous murals",
        venue_id: insertedVenues[0].id,
        owner_id: userId,
        experience_type: "tour",
        price: 150,
        duration_minutes: 120,
        max_participants: 15,
        min_participants: 2,
        includes: ["Guide", "Refreshments"],
        rating: 4.5,
        total_reviews: 10,
      },
      {
        name: "Demo Wine Tasting Experience",
        description: "Premium tasting of 6 estate wines with cheese pairing",
        venue_id: insertedVenues[1].id,
        owner_id: userId,
        experience_type: "tasting",
        price: 250,
        duration_minutes: 90,
        max_participants: 12,
        min_participants: 1,
        includes: ["6 Wine Tastings", "Cheese Board", "Cellar Tour"],
        rating: 4.9,
        total_reviews: 15,
      },
    ];
    await admin.from("experiences").insert(experiences);
  }

  // --- Promo Code ---
  await admin.from("promo_codes").insert({
    code: "DEMO10",
    description: "Demo 10% discount code",
    discount_type: "percentage",
    discount_value: 10,
    max_discount_amount: 50,
    min_order_amount: 100,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    usage_limit: 999,
    created_by: userId,
  });
}
