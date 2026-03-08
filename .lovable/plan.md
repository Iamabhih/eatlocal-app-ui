

# Comprehensive Codebase Audit & Enhancement Plan

## Audit Summary

After reviewing all major files, hooks, pages, routes, and database schema, here is the status of every feature area and what needs enhancement.

---

## Feature Status Matrix

### FULLY FUNCTIONAL (minor polish only)
- **Authentication & Roles** — Auth context, role-based routing, suspension check, sign out cleanup
- **Cart System** — Composite key dedup, option groups, persist, restaurant change modal
- **Checkout & Payments** — PayFast integration, wallet payment, order creation, order_item_options persistence, validation, scheduled orders, tips
- **Notifications** — CRUD, realtime subscriptions, unread count, mark-read, delete
- **Order Tracking** — Realtime subscription for status + delivery location
- **Restaurant Data** — Search, menu items, categories, reviews
- **Loyalty System** — Points, tiers, transactions, redemption
- **Wallet** — Balance, transactions, payment deduction
- **Promo Codes** — Validation, application, admin management
- **Referrals** — Code generation, tracking, rewards
- **Delivery Partner** — Orders, earnings, location tracking, status management
- **Driver Documents** — Upload, verification, document types
- **Hotels** — Search, detail, room types, booking, partner dashboard
- **Venues & Experiences** — Search, detail, booking, partner dashboard
- **Admin Portal** — Dashboard, users, restaurants, orders, delivery partners, revenue, analytics, marketing, logs, hotels, venues, platform config, superadmin

### PARTIALLY BUILT / STUB IMPLEMENTATIONS (need enhancement)

| # | Area | Issue |
|---|------|-------|
| 1 | **CustomerDashboard** | Uses **hardcoded mock data** for recent orders, upcoming bookings, loyalty stats instead of querying real DB |
| 2 | **Restaurant portal routes** | `/restaurant/analytics` and `/restaurant/settings` both render `RestaurantDashboard` as placeholder — `RestaurantSettings.tsx` and `RestaurantPromotions.tsx` exist but aren't routed |
| 3 | **Delivery portal routes** | `/delivery/map` and `/delivery/profile` both render `DeliveryDashboard` as placeholder — no dedicated map or profile pages |
| 4 | **Ride fare calculation** | `createRide` inserts `base_fare: 0, subtotal: 0, total: 0` — fare is calculated client-side in `BookRide.tsx` but never sent to DB |
| 5 | **Ride matching** | `match-ride` edge function exists but no evidence it's called after ride creation — rides sit in `requested` status |
| 6 | **BookRide Google Maps** | Requires `GOOGLE_MAPS_API_KEY` env var via `LoadScript` — will fail silently if not set; no fallback UI |
| 7 | **Cart price doesn't include option modifiers** | `getSubtotal()` uses `item.price * item.quantity` — doesn't add `selectedOptions` price modifiers |
| 8 | **Checkout order total excludes modifiers** | `unit_price` saved as `item.price` — doesn't include option modifier totals |
| 9 | **Restaurant portal missing routes** | `RestaurantSettings` and `RestaurantPromotions` pages exist (585 and 412 lines) but have no routes in App.tsx |
| 10 | **Group Orders UI** | Hook exists (381 lines) with full CRUD but no page/route to access it |
| 11 | **Food Stories / Social Feed** | Hook exists (736 lines) with stories, comments, likes, follows — but no page/route |
| 12 | **AI Chatbot** | Hook exists (288 lines) with sessions, messages, FAQ — but no visible chat widget or page |
| 13 | **Messaging/Chat** | Components (`ChatWindow`, `ConversationList`) and hook exist — but no route in App.tsx |
| 14 | **Recommendations** | Hook calls `get_personalized_recommendations` RPC — function may not exist in DB (gracefully falls back to empty) |
| 15 | **Driver Registration** | Page exists but route (`/driver/registration`) is missing from App.tsx |

---

## Enhancement Plan

### Phase 1: Fix Broken Mechanics (Critical)

**1. Fix cart/checkout option modifier pricing**
- `useCart.ts` → `getSubtotal()`: include `selectedOptions` price modifiers in item total
- `Checkout.tsx` → `unit_price`: calculate as `item.price + sum(option modifiers)`

**2. Fix ride fare persistence**
- `BookRide.tsx` → pass `estimatedFare` to `createRide` mutation
- `useRides.ts` → use fare data in insert instead of zeros

**3. Wire restaurant portal routes**
- Add `/restaurant/settings` → `RestaurantSettings`
- Add `/restaurant/promotions` → `RestaurantPromotions`
- Remove duplicate placeholder routes

### Phase 2: Replace Mock Data with Real Queries

**4. CustomerDashboard real data**
- Replace hardcoded `recentOrders`, `upcomingBookings`, loyalty mock with actual queries to `orders`, `hotel_bookings`, `experience_bookings`, `user_loyalty`

### Phase 3: Add Missing Routes & Pages

**5. Delivery portal pages**
- Create `/delivery/profile` page with partner profile editing
- Create `/delivery/map` page with live location view

**6. Add missing routes**
- `/messaging` or `/chat` → ConversationList + ChatWindow
- `/driver/registration` → DriverRegistration
- `/group-order` → Group order creation/join page
- `/stories` or integrate food stories feed into CustomerHome

**7. AI Chatbot widget**
- Add floating chat button component that opens chatbot panel, using existing `useChatbot` hook

### Phase 4: Polish & Robustness

**8. Google Maps fallback**
- Add address text input fallback when Maps API key is missing
- Show user-friendly error instead of blank map

**9. Ride matching integration**
- Call `match-ride` edge function after `createRide` succeeds
- Show "Finding driver..." state with polling

**10. Recommendations DB function**
- Create `get_personalized_recommendations` SQL function or replace with client-side logic using order history

---

## Files to Change

| File | Changes |
|------|---------|
| `src/hooks/useCart.ts` | Fix `getSubtotal` to include option modifiers |
| `src/pages/customer/Checkout.tsx` | Fix `unit_price` to include modifiers |
| `src/hooks/useRides.ts` | Accept fare fields in `createRide` |
| `src/pages/rider/BookRide.tsx` | Pass fare to mutation |
| `src/App.tsx` | Add ~8 missing routes, fix 2 placeholder routes |
| `src/pages/customer/CustomerDashboard.tsx` | Replace mock data with real queries |
| `src/pages/delivery/DeliveryProfile.tsx` | New page |
| `src/pages/delivery/DeliveryMap.tsx` | New page |
| `src/pages/customer/GroupOrderPage.tsx` | New page using existing hook |
| `src/components/shared/ChatbotWidget.tsx` | New floating widget |

**Estimated scope**: ~15 files changed/created across 4 phases.

