

# Seed Demo Data with Admin Reset Button

## Approach

Since RLS policies restrict client-side inserts (orders need `customer_id = auth.uid()`, restaurants need `owner_id = auth.uid()`, etc.), we'll use a **backend function** (Edge Function) that runs with the service role key to bypass RLS and seed/clear demo data. The admin dashboard will get a "Demo Data" management card with Seed and Reset buttons.

## What Gets Seeded

All demo records will be tagged with a `demo_` prefix in identifiable fields (e.g., order_number starts with `DEMO-`) so they can be cleanly deleted.

- **3 Restaurants** with South African addresses, menu categories, and menu items (6-8 items each)
- **5 Orders** across different statuses (pending, confirmed, preparing, delivered, cancelled) with order items
- **2 Hotels** with room types
- **2 Venues** with experiences
- **1 Promo Code** (DEMO10 - 10% off)
- **Reviews** for the demo restaurants

## Technical Details

### New Files
- `supabase/functions/seed-demo-data/index.ts` — Edge Function that handles both seeding and clearing. Accepts `{ action: "seed" | "reset" }`. Uses the service role key to bypass RLS. On reset, deletes all records where identifiable fields contain `DEMO` markers.
- `src/components/admin/DemoDataManager.tsx` — UI card with "Seed Demo Data" and "Reset Demo Data" buttons, confirmation dialogs, and loading states.

### Modified Files
- `src/pages/admin/AdminDashboard.tsx` — Add `DemoDataManager` component below the SystemStatus card.

### Edge Function Logic
- **Seed**: Inserts data in dependency order (restaurants → categories → items → orders → order_items → reviews → hotels → room_types → venues → experiences → promo_codes). Uses the current authenticated admin's user ID as `owner_id` for restaurants/hotels/venues and `customer_id` for orders.
- **Reset**: Deletes in reverse dependency order using known demo identifiers (names starting with "Demo " or order numbers starting with "DEMO-").

### Security
- The edge function checks that the caller has an admin or superadmin role before proceeding.
- Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for inserts/deletes.

