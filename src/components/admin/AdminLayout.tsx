import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { USER_ROLES } from "@/lib/constants";

interface UserRole {
  role: string;
}

export function AdminLayout() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Check if user has admin or superadmin role
  const { data: hasRole, isLoading: roleLoading } = useQuery<boolean>({
    queryKey: ["user-admin-role", user?.id],
    queryFn: async () => {
      if (!user) return false;

      logger.log("Checking admin role for user:", user.id);

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", [USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN]);

      if (error) {
        logger.error("Error checking admin role:", error);
        return false;
      }

      const hasAdminRole = data && data.length > 0;
      logger.log("User has admin role:", hasAdminRole);

      return hasAdminRole;
    },
    enabled: !!user,
  });

  // Check if user is specifically a superadmin
  const { data: isSuperadmin } = useQuery<boolean>({
    queryKey: ["user-superadmin-role", user?.id],
    queryFn: async () => {
      if (!user) return false;

      logger.log("Checking superadmin role for user:", user.id);

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", USER_ROLES.SUPERADMIN)
        .maybeSingle();

      if (error) {
        logger.error("Error checking superadmin role:", error);
        return false;
      }

      const isSuperAdmin = !!data;
      logger.log("User is superadmin:", isSuperAdmin);

      return isSuperAdmin;
    },
    enabled: !!user,
  });

  // Handle authentication and authorization redirects
  useEffect(() => {
    if (!authLoading && !user) {
      logger.warn("No authenticated user, redirecting to auth");
      navigate("/auth");
    } else if (!roleLoading && !hasRole && user) {
      logger.warn("User lacks admin role, redirecting to home");
      navigate("/");
    }
  }, [user, hasRole, authLoading, roleLoading, navigate]);

  // Show loading state while checking auth and roles
  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated or doesn't have admin role
  if (!user || !hasRole) {
    return null;
  }

  // Render admin routes with superadmin context
  return <Outlet context={{ isSuperadmin }} />;
}
