import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function AdminLayout() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: hasRole, isLoading: roleLoading } = useQuery({
    queryKey: ['user-admin-role', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'superadmin']);
      return data && data.length > 0;
    },
    enabled: !!user,
  });

  const { data: isSuperadmin } = useQuery({
    queryKey: ['user-superadmin-role', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'superadmin')
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!roleLoading && !hasRole && user) {
      navigate('/');
    }
  }, [user, hasRole, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || !hasRole) {
    return null;
  }

  return <Outlet context={{ isSuperadmin }} />;
}
