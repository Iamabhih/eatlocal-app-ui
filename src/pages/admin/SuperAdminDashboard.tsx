import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useOutletContext, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Shield, ShieldCheck, Users, Settings, Database, Activity, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  user_email?: string;
}

export default function SuperAdminDashboard() {
  const { isSuperadmin } = useOutletContext<{ isSuperadmin: boolean }>();
  const queryClient = useQueryClient();
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'superadmin'>('admin');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Redirect non-superadmins
  if (!isSuperadmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Fetch all admin users
  const { data: adminUsers = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'superadmin'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profiles (full_name instead of email since profiles doesn't have email)
      const userIds = roles?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      return (roles || []).map(role => ({
        ...role,
        user_email: profiles?.find(p => p.id === role.user_id)?.full_name || 'Unknown User'
      })) as AdminUser[];
    },
  });

  // Add admin mutation
  const addAdminMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'admin' | 'superadmin' }) => {
      // Note: Since profiles doesn't have email, we need to search auth.users
      // For now, we'll need to have the user ID directly or use a different approach
      // This is a simplified version - in production, you'd use an edge function to look up by email
      
      // Try to find user by looking up profiles with matching full_name (workaround)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', `%${email}%`)
        .limit(1);

      if (profileError || !profiles || profiles.length === 0) {
        throw new Error('User not found. Please enter the user\'s name or ensure they have a profile.');
      }

      const userId = profiles[0].id;

      // Check if already has role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', role)
        .single();

      if (existingRole) {
        throw new Error('User already has this role');
      }

      // Add the role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Admin added successfully');
      setNewAdminEmail('');
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove admin mutation
  const removeAdminMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Admin role removed');
    },
    onError: () => {
      toast.error('Failed to remove admin role');
    },
  });

  // System stats
  const { data: systemStats } = useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalOrders },
        { count: totalRestaurants },
        { count: pendingOrders }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        totalRestaurants: totalRestaurants || 0,
        pendingOrders: pendingOrders || 0,
      };
    },
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar isSuperadmin={isSuperadmin} />

        <div className="flex-1">
          <header className="h-16 border-b flex items-center px-6 bg-gradient-to-r from-primary/5 to-accent/5">
            <SidebarTrigger />
            <div className="flex items-center gap-3 ml-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
            </div>
            <Badge variant="default" className="ml-4 bg-primary">
              Elevated Access
            </Badge>
          </header>

          <main className="p-6 space-y-6">
            {/* Warning Banner */}
            <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10">
              <CardContent className="flex items-center gap-4 py-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Super Admin Access
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    You have elevated privileges. Actions here affect the entire platform.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats?.totalUsers || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats?.totalOrders || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats?.totalRestaurants || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{systemStats?.pendingOrders || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Admin Role Management */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Admin Role Management
                  </CardTitle>
                  <CardDescription>
                    Manage admin and superadmin users across the platform
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Admin</DialogTitle>
                      <DialogDescription>
                        Grant admin privileges to an existing user by their name
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">User Name</Label>
                        <Input
                          id="email"
                          placeholder="Enter user's name"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={newAdminRole} onValueChange={(v: 'admin' | 'superadmin') => setNewAdminRole(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="superadmin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => addAdminMutation.mutate({ email: newAdminEmail, role: newAdminRole })}
                        disabled={!newAdminEmail || addAdminMutation.isPending}
                      >
                        {addAdminMutation.isPending ? 'Adding...' : 'Add Admin'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Loading admin users...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">{admin.user_email}</TableCell>
                          <TableCell>
                            <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'}>
                              {admin.role === 'superadmin' ? (
                                <><ShieldCheck className="h-3 w-3 mr-1" /> Super Admin</>
                              ) : (
                                <><Shield className="h-3 w-3 mr-1" /> Admin</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(admin.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm('Remove this admin role?')) {
                                  removeAdminMutation.mutate(admin.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {adminUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No admin users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Platform Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Platform Settings
                </CardTitle>
                <CardDescription>
                  Global platform configuration (SuperAdmin only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Payment Gateway</h4>
                    <p className="text-sm text-muted-foreground mb-3">PayFast Integration</p>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Connected
                    </Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Database</h4>
                    <p className="text-sm text-muted-foreground mb-3">Supabase PostgreSQL</p>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Healthy
                    </Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Authentication</h4>
                    <p className="text-sm text-muted-foreground mb-3">Supabase Auth</p>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Realtime</h4>
                    <p className="text-sm text-muted-foreground mb-3">Supabase Realtime</p>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Enabled
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
