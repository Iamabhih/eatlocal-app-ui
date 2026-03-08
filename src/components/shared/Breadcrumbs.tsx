import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const routeLabels: Record<string, string> = {
  '': 'Home',
  'customer': 'Home',
  'restaurants': 'Restaurants',
  'restaurant': 'Restaurant',
  'cart': 'Cart',
  'checkout': 'Checkout',
  'orders': 'Orders',
  'profile': 'Profile',
  'dashboard': 'Dashboard',
  'favorites': 'Favorites',
  'notifications': 'Notifications',
  'hotels': 'Hotels',
  'venues': 'Venues',
  'experiences': 'Experiences',
  'rides': 'Rides',
  'book': 'Book a Ride',
  'my-rides': 'My Rides',
  'tracking': 'Tracking',
  'map': 'Explore Map',
  'help': 'Help Center',
  'terms': 'Terms of Service',
  'privacy': 'Privacy Policy',
  // Admin
  'admin': 'Admin',
  'users': 'Users',
  'delivery-partners': 'Delivery Partners',
  'revenue': 'Revenue',
  'analytics': 'Analytics',
  'marketing': 'Marketing',
  'logs': 'System Logs',
  'launch-checklist': 'Launch Checklist',
  'superadmin': 'Super Admin',
  'settings': 'Platform Settings',
  // Restaurant portal
  'kitchen': 'Kitchen Display',
  'menu': 'Menu',
  // Delivery portal
  'delivery': 'Delivery',
  'earnings': 'Earnings',
};

interface BreadcrumbsProps {
  className?: string;
  overrideLabels?: Record<string, string>;
}

export function Breadcrumbs({ className, overrideLabels }: BreadcrumbsProps) {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length <= 1) return null;

  const crumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const isLast = index === pathSegments.length - 1;

    // Skip UUID-like segments in display but keep in path
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}/.test(segment);
    const label = overrideLabels?.[segment]
      || routeLabels[segment]
      || (isUuid ? 'Details' : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '));

    return { path, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}>
      <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          {crumb.isLast ? (
            <span className="text-foreground font-medium truncate max-w-[200px]">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-foreground transition-colors truncate max-w-[150px]">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
