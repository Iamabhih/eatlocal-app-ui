# EatLocal - Multi-Role Food Delivery Platform

## 🚀 Overview

EatLocal is a comprehensive food delivery platform that connects customers, restaurants, and delivery partners in a transparent and efficient ecosystem. Built with modern web technologies, it provides a seamless experience for all stakeholders while maintaining full transparency on fees and earnings.

## 🎯 Business Model

### Fee Structure (Fully Transparent)

**For Customers:**
- **Delivery Fee**: Set by individual restaurants
- **Service Fee**: 4.5% on order subtotal + delivery fee
- **No VAT** on purchases
- **Total Cost**: Subtotal + Delivery Fee + Service Fee

**For Restaurants:**
- **Platform Commission**: 15% of order subtotal
- **Settlement Fee**: 4.5% on total transaction (covers payment processing)
- **Net Payout**: ~80.5% of order subtotal
- **Custom Commission**: Available for high-volume partners

**For Delivery Partners:**
- **Earnings**: Base fee + distance fee + customer tips
- **Platform Fee**: 15% of total earnings
- **Settlement Fee**: 4.5% on total transaction
- **Net Payout**: ~80.5% of earnings + 100% of tips

## 🏗️ Technical Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast HMR, optimized builds)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui (accessible, customizable)
- **State Management**: 
  - Zustand for cart state
  - React Context for authentication
- **Data Fetching**: TanStack Query (React Query v5)
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: Sonner (toast notifications)

### Backend (Lovable Cloud)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Edge Functions**: Deno runtime
- **File Storage**: Supabase Storage
- **Secrets Management**: Supabase Secrets

### Payment Integration
- **Payment Gateway**: PayFast (South African payment processor)
- **Method**: HTML form submission with webhook validation
- **Supported**: Credit/Debit cards, EFT, Instant EFT

### PWA Features
- **Installable**: Can be installed on mobile and desktop
- **Offline Support**: Service worker caching
- **Push Notifications**: Order updates and delivery tracking
- **Icons**: Full icon set for all platforms

## 📊 Database Schema

### Core Tables (21 Total)

**User Management:**
- `profiles` - User profile information
- `user_roles` - Role-based access control (customer, restaurant, delivery_partner, admin, superadmin)

**Restaurant Operations:**
- `restaurants` - Restaurant details, location, commission rates
- `menu_categories` - Menu organization
- `menu_items` - Food items with pricing, dietary info, availability

**Order Management:**
- `orders` - Order details, status, fees, payouts
- `order_items` - Individual items per order
- `order_status_history` - Audit trail of status changes
- `customer_addresses` - Delivery addresses with geocoding

**Delivery Operations:**
- `delivery_earnings` - Earnings breakdown per delivery
- `delivery_partner_locations` - Real-time location tracking

**Payment Processing:**
- `payments` - Payment records and status

**Marketing & Promotions:**
- `promo_codes` - Discount codes and usage limits
- `promo_code_usage` - Usage tracking
- `promotional_banners` - Homepage and marketing banners
- `marketing_campaigns` - Campaign management

**System Monitoring:**
- `system_logs` - Application activity logs
- `api_call_logs` - API performance tracking
- `error_logs` - Error tracking with severity levels
- `user_interaction_logs` - User behavior analytics
- `admin_activity_logs` - Admin action audit trail

### Database Functions

**Automated Calculations:**
```sql
calculate_order_commission() - Calculates platform commission and restaurant payout
calculate_delivery_fees() - Calculates delivery partner fees and net payout
generate_order_number() - Creates unique order identifiers
log_order_status_change() - Maintains order history
update_updated_at_column() - Automatic timestamp updates
```

**Security Functions:**
```sql
has_role(_user_id, _role) - Security definer function for RLS
handle_new_user() - Automatic profile creation
assign_customer_role() - Default role assignment
cleanup_old_logs() - Automated log retention (90 days)
```

## 🔐 Security Features

### Row Level Security (RLS)
- All tables have RLS policies enabled
- Role-based access control using `has_role()` function
- Users can only access their own data
- Admins have oversight capabilities
- Security definer functions prevent recursive RLS issues

### Authentication
- Email/password authentication via Supabase Auth
- Auto-confirm email for development
- Session management with automatic token refresh
- Protected routes with role validation
- Secure password hashing (bcrypt)

### Payment Security
- PayFast signature validation in production
- Webhook verification with merchant credentials
- No credit card data stored locally
- PCI DSS compliant payment processing
- Settlement fee covers payment processing security

### Input Validation
- Zod schemas for all form inputs
- Server-side validation in edge functions
- SQL injection protection (Supabase client)
- XSS prevention (React automatic escaping)
- CORS headers properly configured

## 👥 User Roles & Features

### Customer Portal
- Browse restaurants by cuisine, rating, delivery time
- View menu items with dietary information
- Shopping cart with real-time totals
- Multiple delivery addresses with geocoding
- Real-time order tracking with delivery partner location
- Order history and reordering
- Promo code application

### Restaurant Portal
- Dashboard with today's metrics
- Menu management (categories and items)
- Order processing workflow
- Earnings breakdown with fee transparency
- Order history with search and filters
- Analytics and reporting

### Delivery Partner Portal
- Available orders with earnings preview
- Active deliveries with navigation
- Status updates (picked up, en route, delivered)
- Earnings tracking (daily, weekly, monthly)
- Fee transparency breakdown
- Performance metrics

### Admin Portal
- Platform-wide analytics dashboard
- User management and role assignment
- Restaurant approval and commission settings
- Delivery partner oversight
- Order monitoring and intervention
- Revenue tracking and payouts
- Marketing campaign management
- System health monitoring
- Activity audit logs

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Git

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd eatlocal-app-ui
```

2. **Install dependencies:**
```bash
npm install
# or
bun install
```

3. **Environment variables:**
The `.env` file is auto-managed by Lovable Cloud. No manual configuration needed.

4. **Run development server:**
```bash
npm run dev
# or
bun run dev
```

5. **Access the application:**
```
http://localhost:8080
```

### Production Build

```bash
npm run build
npm run preview  # Test production build locally
```

## 🎨 Design System

### Semantic Color Tokens
All colors use HSL format with semantic tokens defined in `src/index.css`:
- `--primary` - Brand color (R354 S79% L60%)
- `--secondary` - Supporting actions
- `--accent` - Highlights and emphasis
- `--background` - Base background
- `--foreground` - Text color
- `--muted` - Disabled states
- `--destructive` - Errors and warnings

### Typography
- System font stack for performance
- Proper heading hierarchy (h1-h6)
- 16px base font size
- 1.5 line height for readability

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Flexible grid system
- Touch-friendly UI elements

## 📱 PWA Features

### Installation
- Installable on desktop and mobile
- Custom app icons for all platforms
- Add to Home Screen prompt
- Standalone display mode

### Offline Support
- Service worker caching strategy
- Offline page fallback
- Background sync for actions
- Asset caching for performance

### Push Notifications
- Order status updates
- Delivery ETA notifications
- Marketing promotions
- Real-time alerts

## 📧 Email Notifications

### Email Types
- **Order Confirmation**: Receipt with full order details
- **Order Status Updates**: Confirmed, preparing, ready, delivered
- **Restaurant Alerts**: New order notifications
- **Delivery Assignments**: Order details and navigation info

### Email Service
- Powered by Resend
- Transactional email delivery
- HTML templates with branding
- Delivery tracking and logging

## 📈 Analytics & Monitoring

### Built-in Analytics
- User behavior tracking (clicks, navigation, page views)
- Order metrics (conversion rates, average order value)
- Restaurant performance (popular items, revenue trends)
- Delivery efficiency (average time, partner ratings)
- Error tracking with severity levels

### System Health
- Health checks every 30 seconds
- Error thresholds and alerting
- API performance monitoring
- Database query tracking

### External Analytics
- Google Analytics integration ready
- Custom event tracking
- Conversion goal setup
- User flow analysis

## 🎯 Marketing Automation

### Promotional Codes
- Percentage or fixed amount discounts
- Usage limits (per user, total)
- Date range validity
- Restaurant-specific or platform-wide
- Minimum order requirements

### Marketing Campaigns
- Target audiences (customer, restaurant, delivery)
- Campaign types (email, SMS, push, banner)
- Performance tracking (impressions, clicks, conversions)
- A/B testing support

### Promotional Banners
- Multiple positions (home hero, category pages)
- Scheduled display (start/end dates)
- Link types (external, restaurant, promo code)
- Click-through rate tracking

## 🔧 Development

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Consistent code style
- Component-based architecture

### Testing
- Unit tests for utilities
- Component tests with React Testing Library
- Integration tests for user flows
- E2E tests with Playwright

### Debugging
- Comprehensive console logging
- Error boundary for React errors
- Source maps for production
- React Query DevTools

## 📦 Deployment

### Lovable Platform
1. Click "Publish" in Lovable
2. Auto-deploys to `yoursite.lovable.app`
3. Environment variables managed automatically
4. Edge functions deployed automatically

### Custom Domain
1. Navigate to Project > Settings > Domains
2. Add custom domain
3. Configure DNS records
4. SSL certificate auto-provisioned

### Post-Deployment Checklist
- [ ] Test all user flows
- [ ] Verify payment integration
- [ ] Check email notifications
- [ ] Test real-time features
- [ ] Validate role permissions
- [ ] Monitor error logs (24 hours)
- [ ] Verify analytics tracking
- [ ] Test PWA installation

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Make changes and test
3. Commit with meaningful message
4. Push and create Pull Request

### Code Style
- Follow TypeScript best practices
- Use semantic HTML
- Implement responsive design
- Write self-documenting code
- Add comments for complex logic

## 📝 API Documentation

### Edge Functions

**PayFast Webhook** (`/payfast-webhook`)
- Receives payment confirmations
- Validates merchant ID and signature
- Updates order status
- Creates payment records
- Public endpoint with signature validation

**Send Email** (`/send-email`)
- Sends transactional emails
- Multiple template types
- Logs delivery status
- Protected endpoint (requires auth)

### Database API
All database operations use Supabase client with:
- Automatic authentication
- RLS policy enforcement
- Real-time subscriptions
- Type safety

## 🐛 Troubleshooting

### Common Issues

**Build Errors:**
- Clear cache: `rm -rf node_modules && npm install`
- Check TypeScript errors
- Verify imports

**Authentication Issues:**
- Verify Supabase credentials
- Check email confirmation settings
- Review RLS policies

**Payment Not Working:**
- Verify PayFast credentials in secrets
- Check webhook URL accessibility
- Ensure production mode enabled

**Real-time Not Updating:**
- Enable realtime on table
- Check RLS policies
- Verify subscription

## 📊 Performance

### Frontend Optimization
- Code splitting by routes
- Lazy loading components
- Image optimization (WebP)
- Bundle size monitoring
- Service worker caching

### Backend Optimization
- Database indexes on foreign keys
- Query optimization with specific columns
- Connection pooling
- Edge function global deployment

### Monitoring
- Core Web Vitals tracking
- API response time monitoring
- Database query performance
- Error rate tracking

## 🔒 Privacy & Compliance

### Data Protection
- Encryption at rest and in transit
- Minimal data collection
- User data export capability
- Account deletion process

### GDPR Ready
- Consent management
- Data portability
- Right to deletion
- Privacy policy compliance

## 📞 Support

For questions or support:
- **Email**: support@eatlocal.app
- **Documentation**: /docs
- **FAQ**: /help

## 📄 License

Proprietary software. All rights reserved.

## 🎯 Roadmap

### Current (Production Ready)
- ✅ Multi-role platform
- ✅ Payment integration
- ✅ Real-time tracking
- ✅ Admin dashboard
- ✅ PWA features
- ✅ Email notifications
- ✅ Marketing automation

### Q2 2025
- [ ] SMS notifications
- [ ] Advanced analytics
- [ ] Mobile apps (iOS/Android)
- [ ] AI recommendations
- [ ] Loyalty program

### Q3 2025
- [ ] Multi-language support
- [ ] Dark mode
- [ ] API for integrations
- [ ] White-label solution

## 🙏 Acknowledgments

- **Lovable**: Development platform
- **Supabase**: Backend infrastructure
- **shadcn/ui**: UI components
- **PayFast**: Payment processing
- **Resend**: Email delivery

---

**Built with ❤️ using Lovable**

For more information: https://eatlocal.app
