import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Utensils, Truck, User, ArrowLeft, Sparkles, Mail, Lock, Phone, UserCircle } from 'lucide-react';

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
          description: 'Manage your restaurant and grow your business',
          icon: Utensils,
          redirectPath: '/restaurant/dashboard',
          gradient: 'bg-gradient-secondary',
        };
      case 'delivery_partner':
        return {
          title: 'Delivery Partner',
          description: 'Earn money delivering on your schedule',
          icon: Truck,
          redirectPath: '/delivery/dashboard',
          gradient: 'bg-gradient-dark',
        };
      default:
        return {
          title: 'Welcome Back',
          description: 'Sign in to order your favorite food',
          icon: User,
          redirectPath: '/customer',
          gradient: 'bg-gradient-primary',
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
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="decorative-blob w-[600px] h-[600px] -top-32 -right-32 bg-primary/10" />
        <div className="decorative-blob w-[400px] h-[400px] -bottom-16 -left-16 bg-accent/10" />
      </div>

      {/* Back button */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-10 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to home</span>
      </Link>

      {/* Auth Card */}
      <Card variant="glass" className="w-full max-w-md relative z-10 animate-scale-in">
        <CardHeader className="text-center pb-2">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-2xl ${config.gradient} flex items-center justify-center shadow-glow`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Badge */}
          <div className="flex justify-center mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-primary">
                {role === 'customer' ? 'Order delicious food' : role === 'restaurant' ? 'Grow your business' : 'Start earning'}
              </span>
            </div>
          </div>

          <CardTitle className="text-2xl font-display">{config.title}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <Tabs value={isLogin ? 'login' : 'signup'} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 rounded-xl h-12 p-1 bg-secondary/50">
              <TabsTrigger
                value="login"
                onClick={() => setIsLogin(true)}
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                onClick={() => setIsLogin(false)}
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleAuth} className="space-y-4">
              <TabsContent value="signup" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                      placeholder="John Doe"
                      className="pl-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+27 12 345 6789"
                      className="pl-11"
                    />
                  </div>
                </div>
              </TabsContent>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                    className="pl-11"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={loading}
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>

              {isLogin && (
                <div className="text-center mt-4">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot your password?
                  </Link>
                </div>
              )}
            </form>

            {/* Social Login */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) {
                    toast({ title: 'Error', description: String(error), variant: 'destructive' });
                  }
                }}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("apple", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) {
                    toast({ title: 'Error', description: String(error), variant: 'destructive' });
                  }
                }}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
            </div>

            {/* Quick access to other portals */}
            <div className="text-center text-sm text-muted-foreground">
              {role === 'customer' ? (
                <p>
                  Want to partner with us?{' '}
                  <Link to="/auth?role=restaurant" className="text-primary hover:underline font-medium">
                    Restaurant Portal
                  </Link>
                  {' '}or{' '}
                  <Link to="/auth?role=delivery_partner" className="text-primary hover:underline font-medium">
                    Deliver with us
                  </Link>
                </p>
              ) : (
                <p>
                  Looking to order food?{' '}
                  <Link to="/auth" className="text-primary hover:underline font-medium">
                    Customer Portal
                  </Link>
                </p>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Brand watermark */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-muted-foreground/50">
        <span className="font-display font-bold text-gradient-primary">Smash</span>
      </div>
    </div>
  );
}
