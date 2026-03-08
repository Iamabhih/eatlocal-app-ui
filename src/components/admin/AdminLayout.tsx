import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { USER_ROLES } from "@/lib/constants";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export function AdminLayout() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: hasRole, isLoading: roleLoading } = useQuery<boolean>({
    queryKey: ["user-admin-role", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", [USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN]);
      if (error) {
        logger.error("Error checking admin role:", error);
        return false;
      }
      return data && data.length > 0;
    },
    enabled: !!user,
  });

  const { data: isSuperadmin } = useQuery<boolean>({
    queryKey: ["user-superadmin-role", user?.id],
    queryFn: async () => {
      if (!user) return false;
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
      return !!data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!roleLoading && !hasRole && user) {
      navigate("/");
    }
  }, [user, hasRole, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasRole) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar isSuperadmin={isSuperadmin} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center gap-4 px-4 bg-background sticky top-0 z-30">
            <SidebarTrigger />
            <Breadcrumbs />
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet context={{ isSuperadmin }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
