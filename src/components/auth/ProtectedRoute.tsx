import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'customer' | 'restaurant' | 'delivery_partner' | 'admin' | 'superadmin' | 'rider' | 'driver' | 'shop';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredRoles,
  redirectTo = '/auth' 
}: ProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth();
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
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
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