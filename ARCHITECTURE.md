# Smash Platform Architecture

## System Overview

Smash is a multi-role food delivery platform built with a modern stack emphasizing transparency, real-time capabilities, and scalability.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer (React)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Customer │  │Restaurant│  │ Delivery │  │  Admin   │   │
│  │  Portal  │  │  Portal  │  │  Portal  │  │  Portal  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Application State Management                      │
│  ┌──────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │   Zustand    │  │ React Context  │  │ TanStack Query│  │
│  │  (Cart State)│  │     (Auth)     │  │ (Server State)│  │
│  └──────────────┘  └────────────────┘  └───────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               Backend (Lovable Cloud/Supabase)              │
│  ┌────────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   PostgreSQL   │  │  Auth       │  │ Edge Functions  │ │
│  │   (Database)   │  │ (Sessions)  │  │  (Webhooks)     │ │
│  └────────────────┘  └─────────────┘  └─────────────────┘ │
│  ┌────────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Realtime     │  │   Storage   │  │   Secrets       │ │
│  │ (Subscriptions)│  │   (Files)   │  │  (Management)   │ │
│  └────────────────┘  └─────────────┘  └─────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────────────┐ │
│  │  PayFast  │  │  Resend  │  │  Google Analytics        │ │
│  │ (Payments)│  │ (Email)  │  │    (Analytics)           │ │
│  └───────────┘  └──────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React 18**: UI framework with hooks and concurrent features
- **TypeScript**: Type safety and better developer experience
- **Vite**: Fast build tool with HMR
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Accessible component library built on Radix UI

### State Management
- **Zustand**: Lightweight state management for cart
- **React Context**: Auth state and user sessions
- **TanStack Query**: Server state management with caching

### Backend (Lovable Cloud)
- **PostgreSQL**: Relational database via Supabase
- **Supabase Auth**: JWT-based authentication
- **Supabase Realtime**: WebSocket connections for live updates
- **Edge Functions**: Serverless functions on Deno runtime

### External Integrations
- **PayFast**: Payment gateway for South Africa
- **Resend**: Transactional email service
- **Google Analytics**: User behavior tracking

## Database Schema Design

### Core Entities

#### Users & Authentication
```
auth.users (Supabase managed)
├── profiles (1:1)
│   ├── full_name
│   ├── phone
│   └── avatar_url
└── user_roles (1:N)
    └── role (enum: customer, restaurant, delivery_partner, admin, superadmin)
```

#### Restaurant Operations
```
restaurants
├── menu_categories (1:N)
│   └── menu_items (1:N)
│       ├── price
│       ├── dietary_info
│       └── availability
└── orders (1:N)
    ├── order_items (1:N)
    ├── payments (1:1)
    └── order_status_history (1:N)
```

#### Delivery Operations
```
orders
├── delivery_partner_id (FK)
└── delivery_partner_locations (1:N)
    ├── latitude
    ├── longitude
    └── timestamp

delivery_earnings (linked to orders)
├── base_fee
├── distance_fee
├── tips
└── net_payout
```

### Data Flow

#### Order Creation Flow
```
1. Customer adds items to cart (Zustand)
   ↓
2. Select delivery address (customer_addresses)
   ↓
3. Create order record (orders table)
   ↓
4. Create order items (order_items table)
   ↓
5. Generate PayFast payment form
   ↓
6. Redirect to PayFast
   ↓
7. PayFast webhook updates order status
   ↓
8. Create payment record
   ↓
9. Send email notifications
   ↓
10. Realtime update to restaurant
```

#### Real-time Order Tracking
```
Customer Dashboard <---> Supabase Realtime <---> Order Updates
                              ↕
Delivery Partner App <---> Location Updates
```

## Security Architecture

### Row Level Security (RLS)

All tables have RLS enabled with policies enforcing:

1. **Data Isolation**
   - Users can only access their own data
   - Customers see their orders
   - Restaurants see their menu and orders
   - Delivery partners see assigned deliveries

2. **Role-Based Access Control**
```sql
-- Example RLS Policy
CREATE POLICY "Users can view their own orders"
ON orders FOR SELECT
USING (auth.uid() = customer_id);

-- Admin override
CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
USING (has_role(auth.uid(), 'admin'));
```

3. **Security Definer Functions**
```sql
-- Prevents recursive RLS issues
CREATE FUNCTION has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### Authentication Flow

```
1. User submits email/password
   ↓
2. Supabase Auth validates credentials
   ↓
3. JWT token issued
   ↓
4. Token stored in localStorage
   ↓
5. Auth state updated (Context)
   ↓
6. Protected routes check auth status
   ↓
7. Token refreshed automatically
```

## Payment Processing Architecture

### PayFast Integration

```
Customer Checkout
    ↓
Generate PayFast Form (Client)
    ↓
Submit to PayFast (Redirect)
    ↓
PayFast Processes Payment
    ↓
PayFast Webhook Callback (Edge Function)
    ↓
Validate Signature
    ↓
Update Order Status
    ↓
Create Payment Record
    ↓
Send Notifications
```

### Security Measures
- Signature validation on webhooks
- Merchant ID verification
- No card data stored locally
- PCI DSS compliant (PayFast handles)

## Real-time Features

### Supabase Realtime Subscriptions

1. **Order Status Updates**
```typescript
supabase
  .channel('order-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `customer_id=eq.${userId}`
  }, (payload) => {
    // Update UI with new status
  })
  .subscribe()
```

2. **Delivery Partner Location**
```typescript
supabase
  .channel('delivery-location')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'delivery_partner_locations',
    filter: `order_id=eq.${orderId}`
  }, (payload) => {
    // Update map with new location
  })
  .subscribe()
```

## Notification System

### Email Notifications (Resend)

```
Event Triggered (Order placed, status change)
    ↓
Edge Function: send-email
    ↓
Generate HTML Template
    ↓
Resend API Call
    ↓
Email Delivered
    ↓
Log to system_logs
```

### Push Notifications (PWA)

```
Service Worker Registered
    ↓
Push Subscription Created
    ↓
Store Subscription in Database
    ↓
Event Occurs (Order update)
    ↓
Send Push via Service Worker
    ↓
User Receives Notification
```

## Monitoring & Logging

### Logging Architecture

```
┌─────────────────────────────────────────┐
│        Application Events               │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴───────┐
        │              │
        ▼              ▼
┌──────────────┐  ┌────────────────┐
│ system_logs  │  │ error_logs     │
│ - Actions    │  │ - Stack traces │
│ - Success    │  │ - Severity     │
└──────────────┘  └────────────────┘
        │              │
        └──────┬───────┘
               ▼
┌──────────────────────────────┐
│     Admin Dashboard          │
│ - System Health Monitoring   │
│ - Error Thresholds           │
│ - Performance Metrics        │
└──────────────────────────────┘
```

### Analytics Pipeline

```
User Interaction
    ↓
Log to user_interaction_logs
    ↓
Google Analytics Event
    ↓
Admin Analytics Dashboard
    ↓
Business Insights
```

## Deployment Architecture

### Lovable Platform

```
Git Repository (GitHub)
    ↓
Lovable Build System
    ↓
┌─────────────────────────┐
│   Frontend (CDN)        │
│   - Static assets       │
│   - React bundle        │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│   Edge Functions        │
│   - Deno runtime        │
│   - Auto-scaled         │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│   Supabase Cloud        │
│   - Database            │
│   - Auth                │
│   - Realtime            │
└─────────────────────────┘
```

## Performance Optimization

### Frontend Optimizations

1. **Code Splitting**
   - Route-based lazy loading
   - Dynamic imports for heavy components

2. **Caching Strategy**
   - TanStack Query cache
   - Service Worker asset cache
   - Browser cache headers

3. **Bundle Optimization**
   - Tree shaking
   - Minification
   - Compression (gzip/brotli)

### Backend Optimizations

1. **Database**
   - Indexes on foreign keys
   - Composite indexes for common queries
   - Connection pooling

2. **Query Optimization**
   - Select specific columns
   - Use filters in queries
   - Batch operations

3. **Edge Functions**
   - Global deployment
   - Automatic scaling
   - Cold start optimization

## Scalability Considerations

### Horizontal Scaling

- **Frontend**: CDN distribution
- **Edge Functions**: Auto-scaling
- **Database**: Supabase managed scaling

### Vertical Scaling

- **Database**: Automatic resource allocation
- **Connection Pooling**: Supavisor manages connections

### Future Considerations

- **Microservices**: Separate services by domain
- **Message Queue**: For async processing
- **Caching Layer**: Redis for hot data
- **Search**: Elasticsearch for advanced search

## Security Best Practices

### Input Validation
- Zod schemas on frontend
- Edge function validation
- Database constraints

### Authentication
- JWT tokens with expiry
- Refresh token rotation
- Session management

### Authorization
- RLS policies on all tables
- Role-based access control
- Security definer functions

### Data Protection
- Encryption at rest
- HTTPS/TLS in transit
- No sensitive data in logs

## Testing Strategy

### Unit Tests
- Utility functions
- Custom hooks
- Database functions

### Integration Tests
- User flows
- API endpoints
- Payment processing

### E2E Tests
- Full user journeys
- Cross-browser testing
- Mobile responsiveness

## Disaster Recovery

### Backup Strategy
- Automated daily backups (Supabase)
- Point-in-time recovery
- Transaction logs

### Incident Response
- Error monitoring alerts
- System health checks
- Automated failover

## Development Workflow

```
Local Development
    ↓
Git Commit
    ↓
Push to GitHub
    ↓
Lovable Auto-Deploy
    ↓
Preview Environment
    ↓
Merge to Main
    ↓
Production Deploy
```

---

**Last Updated**: 2025-10-13
**Version**: 1.0.0
