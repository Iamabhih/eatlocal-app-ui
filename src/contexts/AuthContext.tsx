import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'customer' | 'restaurant' | 'delivery_partner' | 'admin' | 'superadmin';

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
    const { data } = await supabase
      .from('profiles')
      .select('is_suspended' as any)
      .eq('id', userId)
      .single();

    if (data) {
      setIsSuspended((data as any).is_suspended || false);
    }
  };

  const hasRole = (role: UserRole) => {
    return userRoles.includes(role);
  };

  const isAdmin = () => {
    return userRoles.includes('admin') || userRoles.includes('superadmin');
  };

  const isSuperAdmin = () => {
    return userRoles.includes('superadmin');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRoles, isSuspended, hasRole, isAdmin, isSuperAdmin, signOut }}>
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