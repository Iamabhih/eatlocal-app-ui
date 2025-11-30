import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { cleanupLocalStorage } from '@/lib/stateCleanup';

// Unified UserRole type - matches database enum plus partner roles
export type UserRole =
  | 'customer'
  | 'restaurant'
  | 'delivery_partner'
  | 'admin'
  | 'superadmin'
  | 'rider'
  | 'driver'
  | 'shop'
  | 'hotel_partner'
  | 'venue_partner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRoles: UserRole[];
  isSuspended: boolean;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Fetch user roles and suspension status
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
            fetchSuspensionStatus(session.user.id);
          }, 0);
        } else {
          setUserRoles([]);
          setIsSuspended(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Fetch user roles and suspension status
      if (session?.user) {
        fetchUserRoles(session.user.id);
        fetchSuspensionStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoles = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (data) {
      setUserRoles(data.map(r => r.role as UserRole));
    }
  };

  const fetchSuspensionStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_suspended')
        .eq('id', userId)
        .single();

      if (data && 'is_suspended' in data) {
        setIsSuspended(Boolean(data.is_suspended));
      }
    } catch (error) {
      console.error('Failed to fetch suspension status:', error);
      setIsSuspended(false);
    }
  };

  // Memoized role checking functions to prevent unnecessary re-renders
  const hasRole = useCallback((role: UserRole) => {
    return userRoles.includes(role);
  }, [userRoles]);

  const isAdmin = useCallback(() => {
    return userRoles.includes('admin') || userRoles.includes('superadmin');
  }, [userRoles]);

  const isSuperAdmin = useCallback(() => {
    return userRoles.includes('superadmin');
  }, [userRoles]);

  // Comprehensive sign out that clears all user state
  const signOut = useCallback(async () => {
    // Clear localStorage data to prevent data leaks between users
    cleanupLocalStorage();

    // Sign out from Supabase
    await supabase.auth.signOut();

    // Reset local state
    setUserRoles([]);
    setIsSuspended(false);
  }, []);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    user,
    session,
    loading,
    userRoles,
    isSuspended,
    hasRole,
    isAdmin,
    isSuperAdmin,
    signOut,
  }), [user, session, loading, userRoles, isSuspended, hasRole, isAdmin, isSuperAdmin, signOut]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}