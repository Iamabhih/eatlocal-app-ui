# EatLocal Deployment Guide

Complete guide for deploying the EatLocal food delivery platform to production.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Build Process](#build-process)
- [Deployment Options](#deployment-options)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts & Services
1. **Supabase Account** (Database & Auth)
   - Sign up at https://supabase.com
   - Create a new project

2. **PayFast Merchant Account** (Payment Processing)
   - Register at https://www.payfast.co.za
   - Complete merchant verification
   - Get merchant ID, merchant key, and passphrase

3. **Google Cloud Account** (Maps API)
   - Enable Google Maps JavaScript API
   - Get API key from https://console.cloud.google.com

4. **Hosting Platform** (Choose one)
   - Vercel (Recommended)
   - Netlify
   - AWS Amplify
   - Custom server

### Local Development Requirements
- Node.js 18+ (LTS recommended)
- npm 9+ or yarn
- Git

---

## Environment Setup

### 1. Clone Repository
```bash
git clone <your-repository-url>
cd eatlocal-app-ui
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# PayFast Configuration (Production)
VITE_PAYFAST_MERCHANT_ID=your-merchant-id
VITE_PAYFAST_MERCHANT_KEY=your-merchant-key
VITE_PAYFAST_PASSPHRASE=your-secure-passphrase

# Application Settings
VITE_APP_ENV=production
VITE_APP_URL=https://your-domain.com
```

#### Getting Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to **Settings → API**
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

#### Setting Up Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Maps JavaScript API**
3. Create API key with restrictions:
   - HTTP referrers: `your-domain.com/*`
   - API restrictions: Maps JavaScript API only
4. Copy key → `VITE_GOOGLE_MAPS_API_KEY`

#### Configuring PayFast
1. Log into PayFast merchant dashboard
2. Navigate to **Settings → Integration**
3. Copy:
   - Merchant ID
   - Merchant Key
   - Set up a secure passphrase
4. Configure webhook URL: `https://your-domain.com/api/payfast-webhook`

---

## Database Setup

### 1. Run Migrations

All database migrations are in `supabase/migrations/`. Supabase will automatically run these when you push your project.

To push migrations:
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 2. Verify Tables

Essential tables that should exist:
- `users` (via Supabase Auth)
- `user_profiles`
- `restaurants`
- `menu_categories`
- `menu_items`
- `customer_addresses`
- `orders`
- `order_items`
- `delivery_partners`
- `rides`
- `system_logs`

### 3. Set Up Row Level Security (RLS)

RLS policies are included in migrations. Verify they're active:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`.

### 4. Create Admin User

```sql
-- In Supabase SQL Editor
INSERT INTO user_profiles (id, role, full_name, phone)
VALUES (
  'auth-user-id-here',  -- Replace with actual auth.users.id
  'admin',
  'Admin Name',
  '+27123456789'
);
```

---

## Build Process

### 1. Development Build
```bash
npm run dev
```

### 2. Production Build
```bash
npm run build
```

This creates optimized production files in `dist/` directory.

### 3. Verify Build
```bash
# Check build output
ls -lh dist/

# Preview production build locally
npm run preview
```

**Expected output:**
- Main bundle: ~395KB (gzipped: ~105KB)
- Lazy-loaded chunks for portals
- Static assets (images)

### 4. Build Optimization Checklist
- ✅ Code splitting enabled (React.lazy)
- ✅ Tree shaking active
- ✅ Image optimization
- ✅ CSS minification
- ✅ Environment variables replaced at build time

---

## Deployment Options

### Option 1: Vercel (Recommended)

**Why Vercel:**
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Excellent performance

**Deploy Steps:**

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Configure environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`

4. Set up custom domain (optional):
   - Domains → Add Domain
   - Configure DNS records

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Option 2: Netlify

1. Install Netlify CLI:
```bash
npm i -g netlify-cli
```

2. Deploy:
```bash
netlify deploy --prod
```

3. Configure in `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: AWS Amplify

1. Connect your Git repository
2. Configure build settings:
   - Build command: `npm run build`
   - Base directory: `/`
   - Output directory: `dist`
3. Add environment variables in Amplify console

### Option 4: Custom Server (Ubuntu/Nginx)

**Setup Nginx:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/eatlocal/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Deploy:**
```bash
# Build locally
npm run build

# Copy to server
scp -r dist/* user@server:/var/www/eatlocal/dist/

# Restart Nginx
sudo systemctl restart nginx
```

---

## Post-Deployment

### 1. Verify Deployment

**Test Checklist:**
- [ ] Home page loads
- [ ] User registration works
- [ ] User login works
- [ ] Restaurant list displays
- [ ] Menu items load
- [ ] Add to cart functions
- [ ] Checkout validation works
- [ ] Payment redirects to PayFast
- [ ] Order tracking displays
- [ ] Admin dashboard accessible
- [ ] Restaurant portal works
- [ ] Delivery partner portal works

### 2. Configure DNS

Point your domain to deployment:
- **Vercel:** Add CNAME record
- **Netlify:** Add CNAME record
- **Custom:** Add A record to server IP

### 3. Enable HTTPS

**Automatic (Vercel/Netlify):**
- HTTPS enabled by default

**Manual (Let's Encrypt):**
```bash
sudo certbot --nginx -d your-domain.com
```

### 4. Set Up Monitoring

**Error Tracking (Optional):**
- Integrate Sentry for error monitoring
- Add `VITE_SENTRY_DSN` to environment variables

**Analytics (Optional):**
- Google Analytics
- Mixpanel
- PostHog

### 5. Database Backups

**Supabase:**
- Automatic daily backups on paid plans
- Manual backup: Database → Backups → Create Backup

### 6. Performance Monitoring

**Check with:**
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://www.webpagetest.org/)

**Target Metrics:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1

---

## Troubleshooting

### Build Failures

**Issue:** "Module not found"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Issue:** TypeScript errors
```bash
# Check types
npm run type-check

# Generate types
npx supabase gen types typescript --project-id your-project-ref
```

### Runtime Errors

**Issue:** Blank page after deployment
- Check browser console for errors
- Verify environment variables are set
- Check for CORS issues with Supabase

**Issue:** "Failed to fetch"
- Verify `VITE_SUPABASE_URL` is correct
- Check Supabase project is active
- Verify API keys are valid

**Issue:** PayFast payment fails
- Check merchant credentials
- Verify webhook URL is configured
- Test with sandbox credentials first

### Database Issues

**Issue:** RLS policy prevents access
```sql
-- Check policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Temporarily disable for debugging (DEV ONLY)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

**Issue:** Migration fails
```bash
# Reset and reapply
supabase db reset
supabase db push
```

### Performance Issues

**Issue:** Slow loading
- Enable Gzip compression
- Verify CDN is active
- Check bundle size: `npm run build -- --analyze`
- Optimize images

**Issue:** High bandwidth usage
- Implement lazy loading for images
- Use WebP format
- Enable HTTP/2

---

## Security Checklist

Before going live:

- [ ] All environment variables use production values
- [ ] `.env` file is in `.gitignore`
- [ ] RLS policies are enabled on all tables
- [ ] API keys have appropriate restrictions
- [ ] HTTPS is enabled
- [ ] Security headers are configured
- [ ] PayFast passphrase is strong and unique
- [ ] Admin users use strong passwords
- [ ] Regular security audits scheduled

---

## Maintenance

### Regular Tasks

**Weekly:**
- Monitor error logs
- Check system performance
- Review user feedback

**Monthly:**
- Update dependencies: `npm update`
- Review security advisories
- Check disk usage
- Verify backups

**Quarterly:**
- Performance audit
- Security audit
- Dependency audit: `npm audit`
- Update documentation

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Vite Docs:** https://vitejs.dev/guide/
- **React Router:** https://reactrouter.com/
- **PayFast Integration:** https://developers.payfast.co.za/

---

## Rollback Procedure

If issues arise after deployment:

### Vercel/Netlify
```bash
# Revert to previous deployment
vercel rollback
# or
netlify rollback
```

### Custom Server
```bash
# Keep previous build
mv dist dist-backup
mv dist-old dist

# Restart services
sudo systemctl restart nginx
```

---

## Next Steps

After successful deployment:

1. **Configure monitoring** for errors and performance
2. **Set up CI/CD** for automated deployments
3. **Create staging environment** for testing
4. **Document API endpoints** for integrations
5. **Train staff** on admin portal usage
6. **Plan marketing launch**
7. **Set up customer support** channels

---

**Last Updated:** 2025-11-24
**Version:** 1.0.0
