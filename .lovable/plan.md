

# Phase 3: Driver Experience, Push Notifications, Image Pipeline & Mobile UX

Building on completed Phase 1 (infrastructure, KDS, storage, search) and Phase 2 (smart dispatch, AI chatbot, menu customization, smart search).

## What We'll Build

### 1. Driver Navigation Deep Links & Proof of Delivery
- Add "Navigate" button on DeliveryDashboard that deep-links to Google Maps/Waze with pickup and dropoff coordinates
- Add delivery photo confirmation component (camera capture + upload to `driver-documents` storage bucket)
- Update order completion flow to require proof-of-delivery photo

### 2. Push Notifications (Enable & Wire Up)
- Enable `PUSH_NOTIFICATIONS` feature flag
- Update service worker (`public/sw.js`) with push event handler to show notifications
- Create `send-push` edge function that reads `push_subscriptions` table and sends Web Push via the Web Push protocol
- Add VAPID key generation guidance and wire `usePushNotifications` into order status changes
- Add push notification opt-in prompt on customer dashboard

### 3. Image Upload Pipeline
- Create `useImageUpload` hook with client-side compression (canvas resize to max 1200px, quality 0.8)
- Wire into restaurant menu management (menu item photo upload)
- Wire into review form (photo reviews)
- Wire into driver document upload
- Generate thumbnail URLs using storage transforms

### 4. Reorder Button on Order History
- Add "Reorder" button to each delivered order card in OrderHistory
- On click, populate cart with same items from that order (fetch order_items + menu_items)

### 5. Mobile Bottom Navigation
- Create `MobileBottomNav` component for customer portal (Home, Search, Cart, Orders, Profile)
- Show on mobile only (`use-mobile` hook), hide desktop sidebar equivalent
- Cart badge with item count from Zustand store

### 6. Fix LiveLocationMap Hardcoded Coordinates
- In `OrderTracking.tsx`, fetch restaurant's actual `latitude`/`longitude` from the restaurants table instead of hardcoded `-26.2041, 28.0473`

---

## Technical Details

### Database Changes
- Add `proof_of_delivery_url` text column to `orders` table
- Create `send-push` edge function with VAPID support

### Files to Create
- `src/hooks/useImageUpload.ts` — compression + storage upload
- `src/components/shared/MobileBottomNav.tsx` — bottom nav bar
- `src/components/delivery/ProofOfDelivery.tsx` — camera capture component
- `supabase/functions/send-push/index.ts` — Web Push sender

### Files to Modify
- `src/lib/featureFlags.ts` — enable PUSH_NOTIFICATIONS
- `public/sw.js` — add push event listener
- `src/pages/delivery/DeliveryDashboard.tsx` — navigation deep links
- `src/pages/customer/OrderHistory.tsx` — reorder button
- `src/pages/customer/OrderTracking.tsx` — fix hardcoded restaurant coords
- `src/components/customer/CustomerLayout.tsx` — add MobileBottomNav
- `src/components/customer/ReviewForm.tsx` — photo upload integration
- `supabase/config.toml` — register send-push function

