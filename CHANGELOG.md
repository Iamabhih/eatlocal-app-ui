# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Testing Framework**: Added Vitest with React Testing Library for unit and integration tests
  - Created test setup with jsdom environment
  - Added utility function tests (`utils.test.ts`, `distanceUtils.test.ts`)
  - 21 tests passing
- **CI/CD Pipeline**: Added GitHub Actions workflow (`ci.yml`)
  - Lint and type checking jobs
  - Test execution with coverage
  - Build verification
  - Security audit
  - Docker build verification
- **Docker Support**: Production-ready containerization
  - Multi-stage Dockerfile for optimized builds
  - nginx configuration with security headers and gzip compression
  - Health check endpoints (`/health`, `/ready`)
  - docker-compose for production and development
- **Standardized Loading/Error Components**: Enterprise-quality UI components
  - `LoadingStates.tsx` with 12+ loading components
  - `ErrorStates.tsx` with 10+ error handling components

### Fixed
- **React Hooks Error**: Fixed conditional hook calls in `SuperAdminDashboard.tsx`
  - Moved all hooks above conditional return statement
  - Added `enabled` flag to queries for proper conditional execution
- **Select.Item Empty Value Error**: Fixed Radix UI Select crash
  - Changed empty string values to "all" in Hotel/Venue/Experience search pages
  - Updated handlers to properly convert "all" back to empty string for filtering
- **ESLint Errors**: Reduced from 4 errors to 0 (222 warnings remain - acceptable)

### Security
- **Enterprise Security Migration**: Added `20251130000000_enterprise_security_fixes.sql`
  - RLS policies for `rate_limits`, `user_roles`, `profiles`, `orders`, `payments`, `wallets`
  - `security_audit_log` table for tracking security events
  - Database functions: `find_nearby_drivers`, `validate_promo_code`, `search_restaurants`
- **Rate Limiting**: All edge functions now include rate limiting
- **Auth Improvements**: Enhanced `AuthContext.tsx` with memoization

### Changed
- Package scripts now include: `test`, `test:watch`, `test:coverage`, `type-check`, `lint:fix`

### Dependencies
- Added: vitest, @testing-library/react, @testing-library/jest-dom, jsdom
- Moderate vulnerabilities in dev dependencies (esbuild/vite) - development only, not affecting production

## [0.0.0] - Initial Release

### Features
- Multi-tenant food delivery platform for South Africa
- Restaurant management dashboard
- Customer ordering system
- Delivery partner portal
- Admin dashboard with analytics
- Hotel and venue booking
- Experience marketplace
- Ride-sharing integration
- Wallet and loyalty system
- Multi-language support (i18n)
- Google Maps integration
- PayFast payment processing
