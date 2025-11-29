import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type UserRole = 'customer' | 'restaurant' | 'delivery_partner' | 'admin' | 'superadmin' | 'rider' | 'driver' | 'shop' | 'hotel_partner' | 'venue_partner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

// Suspended account component
function SuspendedAccount({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <Ban className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-600">Account Suspended</CardTitle>
          <CardDescription>
            Your account has been suspended. If you believe this is an error, please contact our support team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Need help?</p>
                <p>Contact support at support@smash.co.za or call +27 10 XXX XXXX</p>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={onSignOut}>
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  redirectTo = '/auth'
}: ProtectedRouteProps) {
  const { user, loading, hasRole, isSuspended, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate(redirectTo);
        return;
      }

      // Check if user has required role(s)
      if (requiredRole && !hasRole(requiredRole as any)) {
        navigate('/');
        return;
      }

      if (requiredRoles && !requiredRoles.some(role => hasRole(role as any))) {
        navigate('/');
        return;
      }
    }
  }, [user, loading, hasRole, requiredRole, requiredRoles, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user is suspended
  if (isSuspended) {
    return <SuspendedAccount onSignOut={signOut} />;
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole as any)) {
    return null;
  }

  if (requiredRoles && !requiredRoles.some(role => hasRole(role as any))) {
    return null;
  }

  return <>{children}</>;
}