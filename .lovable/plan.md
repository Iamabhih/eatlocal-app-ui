

# Comprehensive Codebase Audit & World-Class Enhancement Plan

## Current State Audit

### What Exists (Functional Foundations)
The platform "Smash Local" is a South Africa-focused super-app with:
- **Food Delivery**: Restaurant listing, menu browsing, cart (Zustand + persist), checkout with PayFast, order tracking with realtime subscriptions, reviews
- **Ride-Sharing**: Book ride with Google Maps, journey modes, fare estimation
- **Hotels**: Search, detail, booking flow
- **Venues/Experiences**: Search, detail, booking
- **Delivery Partner Portal**: Dashboard, earnings, order management
- **Restaurant Portal**: Dashboard with analytics (Recharts), menu/order management, profile editing
- **Admin Portal**: Users, restaurants, orders, revenue, analytics, logs, marketing, platform config
- **Auth**: Email/password via Lovable Cloud, role-based access (user_roles table), 2FA support, protected routes
- **Supporting Features**: Loyalty program, wallet system, referrals, promo codes, favorites, notifications (realtime), chatbot (FAQ-based), messaging, panic button, i18n (en/af/zu), PWA (service worker, manifest), dark mode, error boundaries, logging service, Sentry integration

### Critical Gaps vs Uber/UberEats

#### 1. No Real Payment Processing
- PayFast form submission exists but no webhook verification is robust
- No payment status reconciliation or retry queue
- Wallet system is client-side mutations only -- no server-side balance protection
- No split payments (restaurant commission auto-deduction)

#### 2. No Intelligent Dispatch/Matching
- `assign-delivery-partner` edge function exists but `find_nearby_drivers` RPC likely doesn't exist in DB
- No surge pricing algorithm
- No driver batching (multiple pickups)
- No ETA prediction using ML or traffic data

#### 3. Search is Basic
- Restaurant search is client-side filtering with `ilike`
- No full-text search, no relevance ranking, no personalization
- No "reorder" or "recently ordered" features
- Categories are hardcoded strings, not database-driven

#### 4. No Real-Time Order Management Pipeline
- Order status updates are manual (restaurant clicks buttons)
- No automatic timeout/escalation for unaccepted orders
- No kitchen display system (KDS) for restaurants
- No order queuing or preparation time estimation

#### 5. Maps/Location are Shallow
- Google Maps integration exists but address input is manual geocoding
- No Places Autocomplete for address entry
- LiveLocationMap hardcodes restaurant location to Johannesburg coordinates
- No geofencing for delivery zones
- No route optimization

#### 6. No Push Notifications (Feature Flag Disabled)
- Push subscription table exists but `PUSH_NOTIFICATIONS: false`
- No FCM/Web Push implementation
- Notifications are in-app polling only

#### 7. Customer Experience Gaps
- No item customization/modifiers (size, toppings, extras)
- No group ordering (hook exists but likely no UI)
- No scheduled delivery time picker connected to restaurant capacity
- No allergen warnings
- No photo reviews
- No estimated delivery time that updates in real-time
- No order cancellation flow with refund logic
- No re-order functionality

#### 8. Restaurant Portal Gaps
- No inventory management connected to menu availability
- No multi-location support
- No operating hours stored in DB (hardcoded in form)
- No printer/KDS integration
- No staff account management
- No menu item modifiers/options
- No bulk menu import

#### 9. Delivery Partner Gaps
- No earnings payout/withdrawal system
- No heat maps showing demand zones
- No shift scheduling
- No vehicle verification workflow
- Document upload exists but no approval flow UI
- No navigation integration (deep link to Google Maps/Waze)

#### 10. Admin Gaps
- Dashboard shows basic counts only
- No financial reconciliation
- No dispute resolution system
- No customer support ticket system
- No A/B testing framework
- No dynamic commission management per restaurant

#### 11. Security & Performance
- Many hooks use `(supabase as any)` -- types not synced with DB
- No CSRF protection on forms
- No request deduplication
- No image upload/optimization pipeline (no Storage usage)
- No CDN for images
- Service worker is basic cache-first, no background sync
- No pagination on large lists (restaurants, orders)

---

## Enhancement Plan: World-Class System

### Phase 1: Fix Core Infrastructure (Week 1-2)

**1.1 Sync Database Types**
- Run type generation to eliminate all `(supabase as any)` casts
- Add missing tables/columns to match hook expectations

**1.2 Server-Side Payment Security**
- Create `process-payment` edge function with idempotency keys
- Add wallet balance checks as DB triggers (not client-side)
- Implement PayFast ITN (Instant Transaction Notification) webhook properly with signature verification
- Add automatic commission splitting: restaurant gets (100% - commission_rate), platform keeps rest

**1.3 Address Autocomplete**
- Replace manual address input with Google Places Autocomplete on checkout, ride booking, and restaurant setup
- Store lat/lng automatically on address save

**1.4 Fix LiveLocationMap**
- Fetch actual restaurant coordinates instead of hardcoded Johannesburg
- Add proper error state when Google Maps API key is missing

### Phase 2: Intelligent Operations (Week 3-4)

**2.1 Smart Order Dispatch**
- Create `find_nearby_drivers` PostGIS RPC function using actual geolocation
- Add auto-assignment with configurable timeout (60s accept window)
- Implement order escalation: if no driver accepts in 3 rounds, notify admin
- Add surge pricing multiplier based on demand/supply ratio

**2.2 Real-Time Order Pipeline**
- Add order status auto-transitions with timestamps
- Create kitchen prep time estimation based on item count + historical data
- Implement order timeout: auto-cancel if restaurant doesn't accept in 10 min
- Add realtime order sound notifications for restaurant portal

**2.3 Dynamic ETA**
- Calculate ETA using distance + current driver speed + prep time
- Update ETA in real-time as driver moves
- Show ETA countdown on customer order tracking page

### Phase 3: Customer Experience (Week 5-7)

**3.1 Menu Item Customization**
- Create `menu_item_options` and `menu_item_option_groups` tables
- UI for size selection, add-ons, special instructions per item
- Price modifiers that update cart total dynamically

**3.2 Smart Search & Discovery**
- Implement PostgreSQL full-text search with `tsvector`
- Add "Popular near you" section using order frequency + location
- "Reorder" button on order history
- Recently viewed restaurants
- AI-powered meal recommendations using order history (Lovable AI)

**3.3 Advanced Order Features**
- Order scheduling with restaurant capacity awareness
- Group ordering: share cart link, each person adds items, one person pays
- Order cancellation with automated refund rules (free cancel < 1 min, partial after)
- Split bill between multiple payment methods

**3.4 Enhanced Reviews**
- Photo uploads with reviews (using file storage)
- Review response notifications to restaurant
- Helpful/not helpful voting
- Review quality scoring to surface best reviews

**3.5 Push Notifications**
- Implement Web Push using service worker
- Notification triggers: order confirmed, driver assigned, driver arriving, delivered
- Marketing push for promos and new restaurants

### Phase 4: Restaurant Excellence (Week 8-9)

**4.1 Kitchen Display System**
- Full-screen KDS view with order cards
- Auto-sort by priority (time waiting)
- One-tap status updates: Accept -> Preparing -> Ready
- Sound alerts for new orders
- Print order tickets (browser print API)

**4.2 Menu Management Pro**
- Menu item modifiers/options (sizes, toppings, add-ons)
- Bulk CSV import for menu items
- Schedule menu availability (breakfast/lunch/dinner menus)
- Auto-disable items when inventory runs out
- Menu item photos upload to file storage

**4.3 Operating Hours & Availability**
- Store opening_hours as JSONB with per-day schedules
- Holiday/special hours override
- Auto open/close based on schedule
- Prep time per item for accurate ETAs

**4.4 Multi-Staff Access**
- Restaurant staff accounts with role-based permissions
- Activity log per staff member
- Manager vs cashier vs kitchen views

### Phase 5: Delivery Partner Pro (Week 10-11)

**5.1 Smart Navigation**
- Deep link to Google Maps/Waze for turn-by-turn navigation
- Multi-stop optimization for batched orders
- Estimated earnings per delivery shown before acceptance

**5.2 Earnings & Payouts**
- Weekly automatic payout calculation
- Earnings breakdown: base + distance + tips + bonuses
- Payout history with downloadable statements
- Goal tracking (earn RX today, Y deliveries this week)

**5.3 Driver Engagement**
- Heat maps showing high-demand areas
- Peak hour bonuses with multipliers
- Achievement badges and leaderboard
- Shift scheduling with guaranteed minimum earnings

**5.4 Safety Features**
- In-app SOS button connected to panic system
- Speed monitoring and safety alerts
- Delivery photo confirmation (proof of delivery)
- Customer ID verification for age-restricted items

### Phase 6: Platform Intelligence (Week 12-14)

**6.1 AI-Powered Features**
- Chatbot using Lovable AI (Gemini) for customer support
- Smart order suggestions based on time of day, weather, history
- Automated review moderation
- Demand forecasting for restaurants

**6.2 Advanced Admin Dashboard**
- Real-time revenue dashboard with live counters
- Geographic heat map of orders
- Customer cohort analysis
- Restaurant performance scorecards
- Automated fraud detection (unusual order patterns)
- Financial reconciliation reports
- Dispute management system

**6.3 Marketing & Growth**
- Referral system with tracking (hooks exist, need proper UI)
- Dynamic promo code engine with targeting rules
- Push notification campaigns
- Customer segmentation (new, active, churning, dormant)
- Restaurant promotion marketplace (featured listings)

**6.4 Analytics & Reporting**
- Restaurant analytics: peak hours, popular items, revenue trends
- Customer analytics: LTV, order frequency, basket size
- Delivery analytics: avg delivery time, driver utilization
- Export to PDF/CSV for all reports

### Phase 7: Performance & Scale (Week 15-16)

**7.1 Image Pipeline**
- File storage buckets for menu items, restaurants, reviews, driver docs
- Client-side image compression before upload
- Responsive image sizes (thumbnail, medium, full)
- Lazy loading with blur placeholder

**7.2 Database Optimization**
- Add proper indexes on frequently queried columns
- Implement cursor-based pagination for large lists
- Add database connection pooling configuration
- Implement read replicas for analytics queries

**7.3 Offline Resilience**
- Background sync for offline order queue
- Offline menu browsing (cached data)
- Retry queue for failed API calls
- Optimistic updates for cart operations

**7.4 Mobile Optimization**
- Bottom navigation bar for mobile
- Swipe gestures for order cards
- Pull-to-refresh on all lists
- App-like transitions between pages
- Install prompt for PWA

---

## Priority Impact Matrix

| Enhancement | User Impact | Effort | Priority |
|---|---|---|---|
| Payment webhook verification | Critical | Medium | P0 |
| Address autocomplete | High | Low | P0 |
| Menu item customization | High | Medium | P1 |
| Kitchen display system | High | Medium | P1 |
| Push notifications | High | Medium | P1 |
| Smart dispatch/matching | Critical | High | P1 |
| AI chatbot upgrade | Medium | Low | P2 |
| Image upload pipeline | Medium | Medium | P2 |
| Driver navigation deep link | Medium | Low | P2 |
| Split payments | Medium | High | P3 |
| Group ordering UI | Low | High | P3 |
| A/B testing framework | Low | High | P4 |

