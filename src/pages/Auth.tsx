import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Utensils, Truck, User } from 'lucide-react';

type UserRole = 'customer' | 'restaurant' | 'delivery_partner';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const role = (searchParams.get('role') || 'customer') as UserRole;
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'restaurant':
        return {
          title: 'Restaurant Portal',
          icon: Utensils,
          redirectPath: '/restaurant/dashboard',
        };
      case 'delivery_partner':
        return {
          title: 'Delivery Partner Portal',
          icon: Truck,
          redirectPath: '/delivery/dashboard',
        };
      default:
        return {
          title: 'Customer Portal',
          icon: User,
          redirectPath: '/customer',
        };
    }
  };

  const config = getRoleConfig(role);
  const Icon = config.icon;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Check if user has the required role
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .eq('role', role)
            .single();

          if (!roleData) {
            await supabase.auth.signOut();
            throw new Error(`You don't have ${role} access. Please sign up or use the correct portal.`);
          }

          toast({
            title: 'Welcome back!',
            description: 'Successfully signed in.',
          });
          navigate(config.redirectPath);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${config.redirectPath}`,
            data: {
              full_name: fullName,
              phone: phone,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Assign additional role to user if not customer (customer role is auto-assigned by trigger)
          if (role !== 'customer') {
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: data.user.id,
                role: role,
              });

            if (roleError && roleError.code !== '23505') { // Ignore duplicate key errors
              throw roleError;
            }
          }

          toast({
            title: 'Account created!',
            description: 'You can now sign in.',
          });
          navigate(config.redirectPath);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Icon className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{config.title}</CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? 'login' : 'signup'} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" onClick={() => setIsLogin(true)}>
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" onClick={() => setIsLogin(false)}>
                Sign Up
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleAuth} className="space-y-4">
              <TabsContent value="signup" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </TabsContent>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <Button
                variant="link"
                onClick={() => navigate('/')}
                className="text-muted-foreground"
              >
                Back to home
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
