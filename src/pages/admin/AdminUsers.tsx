import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminData } from '@/hooks/useAdminData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Search,
  MoreHorizontal,
  Eye,
  UserCog,
  Ban,
  CheckCircle,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';

const AVAILABLE_ROLES = [
  { value: 'customer', label: 'Customer' },
  { value: 'restaurant', label: 'Restaurant Owner' },
  { value: 'delivery_partner', label: 'Delivery Partner' },
  { value: 'hotel_partner', label: 'Hotel Partner' },
  { value: 'venue_partner', label: 'Venue Partner' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Super Admin' },
];

export default function AdminUsers() {
  const { users, usersLoading } = useAdminData();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === 'all' ||
      user.user_roles?.some((r) => r.role === roleFilter) ||
      (roleFilter === 'customer' && (!user.user_roles || user.user_roles.length === 0));

    return matchesSearch && matchesRole;
  });

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter((u) => !u.is_suspended).length,
    suspended: users.filter((u) => u.is_suspended).length,
    admins: users.filter((u) => u.user_roles?.some((r) => r.role === 'admin' || r.role === 'superadmin')).length,
  };

  // Add role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-data'] });
      toast.success('Role added successfully');
      setShowRoleDialog(false);
    },
    onError: (error) => {
      toast.error('Failed to add role: ' + error.message);
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-data'] });
      toast.success('Role removed successfully');
    },
    onError: (error) => {
      toast.error('Failed to remove role: ' + error.message);
    },
  });

  // Suspend/unsuspend mutation
  const toggleSuspendMutation = useMutation({
    mutationFn: async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: suspend, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-data'] });
      toast.success(variables.suspend ? 'User suspended' : 'User activated');
      setShowSuspendDialog(false);
    },
    onError: (error) => {
      toast.error('Failed to update user: ' + error.message);
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'restaurant':
        return 'secondary';
      case 'delivery_partner':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6 bg-muted/30">
            <h1 className="text-3xl font-bold mb-6">User Management</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Total Users</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Active</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <UserX className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Suspended</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Admins</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {AVAILABLE_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Users ({filteredUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No users found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="w-12">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id} className={user.is_suspended ? 'opacity-60' : ''}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary">
                                    {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">{user.full_name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>{user.phone || 'No phone'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {user.user_roles && user.user_roles.length > 0 ? (
                                  user.user_roles.map((userRole) => (
                                    <Badge
                                      key={userRole.role}
                                      variant={getRoleBadgeVariant(userRole.role)}
                                      className="text-xs"
                                    >
                                      {userRole.role}
                                    </Badge>
                                  ))
                                ) : (
                                  <Badge variant="secondary" className="text-xs">customer</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.is_suspended ? (
                                <Badge variant="destructive" className="gap-1">
                                  <Ban className="h-3 w-3" />
                                  Suspended
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                                  <CheckCircle className="h-3 w-3" />
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowUserDetails(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                      <UserCog className="h-4 w-4 mr-2" />
                                      Manage Roles
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                      {AVAILABLE_ROLES.filter((r) => r.value !== 'superadmin').map((role) => {
                                        const hasRole = user.user_roles?.some((ur) => ur.role === role.value);
                                        return (
                                          <DropdownMenuItem
                                            key={role.value}
                                            onClick={() => {
                                              if (hasRole) {
                                                removeRoleMutation.mutate({ userId: user.id, role: role.value });
                                              } else {
                                                addRoleMutation.mutate({ userId: user.id, role: role.value });
                                              }
                                            }}
                                          >
                                            {hasRole ? '✓ ' : '  '}{role.label}
                                          </DropdownMenuItem>
                                        );
                                      })}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowSuspendDialog(true);
                                    }}
                                    className={user.is_suspended ? 'text-green-600' : 'text-destructive'}
                                  >
                                    {user.is_suspended ? (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Activate User
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="h-4 w-4 mr-2" />
                                        Suspend User
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {selectedUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.full_name || 'Unknown'}</h3>
                  <p className="text-sm text-muted-foreground">ID: {selectedUser.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedUser.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.user_roles && selectedUser.user_roles.length > 0 ? (
                    selectedUser.user_roles.map((userRole) => (
                      <Badge key={userRole.role} variant={getRoleBadgeVariant(userRole.role)}>
                        {userRole.role}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary">customer</Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Status</p>
                {selectedUser.is_suspended ? (
                  <Badge variant="destructive">Suspended</Badge>
                ) : (
                  <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend/Activate Confirmation Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.is_suspended ? 'Activate User' : 'Suspend User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.is_suspended
                ? `Are you sure you want to activate ${selectedUser?.full_name}? They will regain access to the platform.`
                : `Are you sure you want to suspend ${selectedUser?.full_name}? They will lose access to the platform.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedUser?.is_suspended ? 'default' : 'destructive'}
              onClick={() => {
                if (selectedUser) {
                  toggleSuspendMutation.mutate({
                    userId: selectedUser.id,
                    suspend: !selectedUser.is_suspended,
                  });
                }
              }}
              disabled={toggleSuspendMutation.isPending}
            >
              {selectedUser?.is_suspended ? 'Activate' : 'Suspend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
