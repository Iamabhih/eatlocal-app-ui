import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useOutletContext, Navigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertTriangle,
  Shield,
  ShieldCheck,
  Users,
  Settings,
  Activity,
  Trash2,
  UserPlus,
  Hotel,
  Building2,
  Sparkles,
  Calendar,
  TrendingUp,
  Store,
  Key,
  CreditCard,
  Percent,
  ToggleLeft,
  Bell,
  Globe,
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  Edit2,
  FileText,
  MapPin,
  Sliders,
  ClipboardList,
  History,
  MessageSquare,
  Mail,
  BarChart3,
  Database,
  Zap,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useApiConfigurations,
  useUpdateApiConfiguration,
  useTestApiConnection,
  useCommissionRates,
  useUpdateCommissionRate,
  usePlatformFees,
  useUpdatePlatformFee,
  useFeatureFlags,
  useUpdateFeatureFlag,
  useSystemSettings,
  useUpdateSystemSetting,
  useApprovalWorkflows,
  useUpdateApprovalWorkflow,
  useApprovalQueue,
  useApproveRequest,
  useRejectRequest,
  useVerificationRequirements,
  useUpdateVerificationRequirement,
  useOperationalLimits,
  useUpdateOperationalLimit,
  useServiceRegions,
  useUpdateServiceRegion,
  usePayoutConfigs,
  useUpdatePayoutConfig,
  useConfigAuditLog,
  usePlatformOverview,
  API_SERVICE_CATEGORIES,
  ENTITY_TYPES,
  SETTING_CATEGORIES,
  APPROVAL_STATUSES,
  PAYOUT_FREQUENCIES,
} from '@/hooks/usePlatformConfig';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'superadmin'>('admin');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  // Data hooks
  const { data: apiConfigs = [], isLoading: loadingApis } = useApiConfigurations();
  const { data: commissionRates = [], isLoading: loadingCommissions } = useCommissionRates();
  const { data: platformFees = [], isLoading: loadingFees } = usePlatformFees();
  const { data: featureFlags = [], isLoading: loadingFlags } = useFeatureFlags();
  const { data: systemSettings = [], isLoading: loadingSettings } = useSystemSettings();
  const { data: approvalWorkflows = [], isLoading: loadingWorkflows } = useApprovalWorkflows();
  const { data: approvalQueue = [], isLoading: loadingQueue } = useApprovalQueue('pending');
  const { data: verificationReqs = [], isLoading: loadingVerification } = useVerificationRequirements();
  const { data: operationalLimits = [], isLoading: loadingLimits } = useOperationalLimits();
  const { data: serviceRegions = [], isLoading: loadingRegions } = useServiceRegions(false);
  const { data: payoutConfigs = [], isLoading: loadingPayouts } = usePayoutConfigs();
  const { data: auditLog = [], isLoading: loadingAudit } = useConfigAuditLog(undefined, 50);
  const { data: platformOverview } = usePlatformOverview();

  // Mutation hooks
  const updateApiConfig = useUpdateApiConfiguration();
  const testApiConnection = useTestApiConnection();
  const updateCommission = useUpdateCommissionRate();
  const updateFee = useUpdatePlatformFee();
  const updateFeatureFlag = useUpdateFeatureFlag();
  const updateSetting = useUpdateSystemSetting();
  const updateWorkflow = useUpdateApprovalWorkflow();
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const updateVerification = useUpdateVerificationRequirement();
  const updateLimit = useUpdateOperationalLimit();
  const updateRegion = useUpdateServiceRegion();
  const updatePayout = useUpdatePayoutConfig();

  // Admin users query
  const { data: adminUsers = [], isLoading: loadingAdmins } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'superadmin'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = roles?.map((r) => r.user_id) || [];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);

      return (roles || []).map((role) => ({
        ...role,
        user_email: profiles?.find((p) => p.id === role.user_id)?.full_name || 'Unknown User',
      })) as AdminUser[];
    },
    enabled: isSuperadmin,
  });

  // System stats query
  const { data: systemStats } = useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalOrders },
        { count: totalRestaurants },
        { count: pendingOrders },
        { count: totalHotels },
        { count: totalVenues },
        { count: totalExperiences },
        { count: hotelBookings },
        { count: experienceBookings },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('hotels').select('*', { count: 'exact', head: true }),
        (supabase.from('venues' as any).select('*', { count: 'exact', head: true }) as any),
        (supabase.from('experiences' as any).select('*', { count: 'exact', head: true }) as any),
        supabase.from('hotel_bookings').select('*', { count: 'exact', head: true }),
        (supabase.from('experience_bookings' as any).select('*', { count: 'exact', head: true }) as any),
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        totalRestaurants: totalRestaurants || 0,
        pendingOrders: pendingOrders || 0,
        totalHotels: totalHotels || 0,
        totalVenues: totalVenues || 0,
        totalExperiences: totalExperiences || 0,
        hotelBookings: hotelBookings || 0,
        experienceBookings: experienceBookings || 0,
      };
    },
    enabled: isSuperadmin,
  });

  // Admin mutations
  const addAdminMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'admin' | 'superadmin' }) => {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', `%${email}%`)
        .limit(1);

      if (profileError || !profiles || profiles.length === 0) {
        throw new Error("User not found. Please enter the user's name.");
      }

      const userId = profiles[0].id;

      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', role)
        .single();

      if (existingRole) {
        throw new Error('User already has this role');
      }

      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });

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

  const removeAdminMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from('user_roles').delete().eq('id', roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Admin role removed');
    },
  });

  // Redirect non-superadmins
  if (!isSuperadmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const toggleSecret = (id: string) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (id: string, values: Record<string, any>) => {
    setEditingId(id);
    setEditValues(values);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({});
  };

  const getServiceCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      payment: <CreditCard className="h-4 w-4" />,
      sms: <MessageSquare className="h-4 w-4" />,
      email: <Mail className="h-4 w-4" />,
      maps: <MapPin className="h-4 w-4" />,
      analytics: <BarChart3 className="h-4 w-4" />,
      storage: <Database className="h-4 w-4" />,
      ai: <Zap className="h-4 w-4" />,
      notifications: <Bell className="h-4 w-4" />,
    };
    return icons[category] || <Settings className="h-4 w-4" />;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar isSuperadmin={isSuperadmin} />

        <div className="flex-1 overflow-hidden">
          <header className="h-16 border-b flex items-center px-6 bg-gradient-to-r from-primary/5 to-accent/5">
            <SidebarTrigger />
            <div className="flex items-center gap-3 ml-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Super Admin Control Panel</h1>
            </div>
            <Badge variant="default" className="ml-4 bg-primary">
              Full System Access
            </Badge>
          </header>

          <ScrollArea className="h-[calc(100vh-4rem)]">
            <main className="p-6 space-y-6">
              {/* Warning Banner */}
              <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10">
                <CardContent className="flex items-center gap-4 py-4">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Super Admin Access - Complete Backend Control
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Changes here affect the entire platform. All modifications are logged for audit purposes.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Main Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 gap-1">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="api-keys" className="text-xs">API Keys</TabsTrigger>
                  <TabsTrigger value="commissions" className="text-xs">Commissions</TabsTrigger>
                  <TabsTrigger value="fees" className="text-xs">Fees</TabsTrigger>
                  <TabsTrigger value="features" className="text-xs">Features</TabsTrigger>
                  <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
                  <TabsTrigger value="approvals" className="text-xs">Approvals</TabsTrigger>
                  <TabsTrigger value="verification" className="text-xs">Verification</TabsTrigger>
                  <TabsTrigger value="limits" className="text-xs">Limits</TabsTrigger>
                  <TabsTrigger value="regions" className="text-xs">Regions</TabsTrigger>
                  <TabsTrigger value="payouts" className="text-xs">Payouts</TabsTrigger>
                  <TabsTrigger value="audit" className="text-xs">Audit Log</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                        <ClipboardList className="h-4 w-4 text-yellow-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{platformOverview?.pendingApprovals || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Features</CardTitle>
                        <ToggleLeft className="h-4 w-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{platformOverview?.activeFeatures || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Enabled Services</CardTitle>
                        <Key className="h-4 w-4 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{platformOverview?.enabledServices || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Regions</CardTitle>
                        <Globe className="h-4 w-4 text-purple-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{platformOverview?.activeRegions || 0}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* System Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <CardTitle className="text-sm font-medium">Food Orders</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{systemStats?.totalOrders || 0}</div>
                        <p className="text-xs text-muted-foreground">{systemStats?.pendingOrders || 0} pending</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{systemStats?.totalRestaurants || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Hotels</CardTitle>
                        <Hotel className="h-4 w-4 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{systemStats?.totalHotels || 0}</div>
                        <p className="text-xs text-muted-foreground">{systemStats?.hotelBookings || 0} bookings</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Admin Management */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Admin Role Management
                        </CardTitle>
                        <CardDescription>Manage admin and superadmin users</CardDescription>
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
                            <DialogDescription>Grant admin privileges to an existing user</DialogDescription>
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
                              <Select
                                value={newAdminRole}
                                onValueChange={(v: 'admin' | 'superadmin') => setNewAdminRole(v)}
                              >
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
                                    <>
                                      <ShieldCheck className="h-3 w-3 mr-1" /> Super Admin
                                    </>
                                  ) : (
                                    <>
                                      <Shield className="h-3 w-3 mr-1" /> Admin
                                    </>
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
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* API Keys Tab */}
                <TabsContent value="api-keys" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Third-Party API Configuration
                      </CardTitle>
                      <CardDescription>
                        Manage API keys and secrets for external service integrations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {API_SERVICE_CATEGORIES.map((category) => {
                          const categoryApis = apiConfigs.filter((a) => a.service_category === category.value);
                          return (
                            <AccordionItem key={category.value} value={category.value}>
                              <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                  {getServiceCategoryIcon(category.value)}
                                  <span>{category.label}</span>
                                  <Badge variant="outline" className="ml-2">
                                    {categoryApis.filter((a) => a.is_enabled).length}/{categoryApis.length} enabled
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 pt-4">
                                  {categoryApis.map((api) => (
                                    <Card key={api.id} className="border">
                                      <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <CardTitle className="text-base">{api.display_name}</CardTitle>
                                            <CardDescription>{api.description}</CardDescription>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant={api.environment === 'production' ? 'default' : 'outline'}>
                                              {api.environment}
                                            </Badge>
                                            <Switch
                                              checked={api.is_enabled}
                                              onCheckedChange={(checked) =>
                                                updateApiConfig.mutate({
                                                  id: api.id,
                                                  updates: { is_enabled: checked },
                                                })
                                              }
                                            />
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label>API Key</Label>
                                            <div className="flex gap-2">
                                              <Input
                                                type={showSecrets[`${api.id}_key`] ? 'text' : 'password'}
                                                value={api.api_key || ''}
                                                placeholder="Enter API key"
                                                onChange={(e) =>
                                                  updateApiConfig.mutate({
                                                    id: api.id,
                                                    updates: { api_key: e.target.value },
                                                  })
                                                }
                                              />
                                              <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => toggleSecret(`${api.id}_key`)}
                                              >
                                                {showSecrets[`${api.id}_key`] ? (
                                                  <EyeOff className="h-4 w-4" />
                                                ) : (
                                                  <Eye className="h-4 w-4" />
                                                )}
                                              </Button>
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            <Label>API Secret</Label>
                                            <div className="flex gap-2">
                                              <Input
                                                type={showSecrets[`${api.id}_secret`] ? 'text' : 'password'}
                                                value={api.api_secret || ''}
                                                placeholder="Enter API secret"
                                                onChange={(e) =>
                                                  updateApiConfig.mutate({
                                                    id: api.id,
                                                    updates: { api_secret: e.target.value },
                                                  })
                                                }
                                              />
                                              <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => toggleSecret(`${api.id}_secret`)}
                                              >
                                                {showSecrets[`${api.id}_secret`] ? (
                                                  <EyeOff className="h-4 w-4" />
                                                ) : (
                                                  <Eye className="h-4 w-4" />
                                                )}
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label>Webhook URL</Label>
                                            <Input
                                              value={api.webhook_url || ''}
                                              placeholder="https://..."
                                              onChange={(e) =>
                                                updateApiConfig.mutate({
                                                  id: api.id,
                                                  updates: { webhook_url: e.target.value },
                                                })
                                              }
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label>Environment</Label>
                                            <Select
                                              value={api.environment}
                                              onValueChange={(v: 'sandbox' | 'production') =>
                                                updateApiConfig.mutate({
                                                  id: api.id,
                                                  updates: { environment: v },
                                                })
                                              }
                                            >
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="sandbox">Sandbox</SelectItem>
                                                <SelectItem value="production">Production</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                          <div className="flex items-center gap-2">
                                            {api.test_status === 'success' && (
                                              <Badge className="bg-green-100 text-green-800">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Connected
                                              </Badge>
                                            )}
                                            {api.test_status === 'failed' && (
                                              <Badge variant="destructive">
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Failed
                                              </Badge>
                                            )}
                                            {api.last_tested_at && (
                                              <span className="text-xs text-muted-foreground">
                                                Last tested: {new Date(api.last_tested_at).toLocaleString()}
                                              </span>
                                            )}
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => testApiConnection.mutate(api.id)}
                                            disabled={testApiConnection.isPending}
                                          >
                                            <RefreshCw
                                              className={`h-4 w-4 mr-2 ${testApiConnection.isPending ? 'animate-spin' : ''}`}
                                            />
                                            Test Connection
                                          </Button>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                  {categoryApis.length === 0 && (
                                    <p className="text-muted-foreground text-center py-4">
                                      No services configured in this category
                                    </p>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Commission Rates Tab */}
                <TabsContent value="commissions" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Percent className="h-5 w-5" />
                        Commission Rates
                      </CardTitle>
                      <CardDescription>Configure platform commission percentages by entity type and tier</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Entity Type</TableHead>
                            <TableHead>Tier</TableHead>
                            <TableHead>Commission %</TableHead>
                            <TableHead>Min</TableHead>
                            <TableHead>Max</TableHead>
                            <TableHead>Effective From</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {commissionRates.map((rate) => (
                            <TableRow key={rate.id}>
                              <TableCell className="font-medium capitalize">{rate.entity_type}</TableCell>
                              <TableCell className="capitalize">{rate.tier_name}</TableCell>
                              <TableCell>
                                {editingId === rate.id ? (
                                  <Input
                                    type="number"
                                    className="w-20"
                                    value={editValues.commission_percentage ?? rate.commission_percentage}
                                    onChange={(e) =>
                                      setEditValues((prev) => ({
                                        ...prev,
                                        commission_percentage: parseFloat(e.target.value),
                                      }))
                                    }
                                  />
                                ) : (
                                  <Badge variant="outline">{rate.commission_percentage}%</Badge>
                                )}
                              </TableCell>
                              <TableCell>R{rate.min_commission || '-'}</TableCell>
                              <TableCell>R{rate.max_commission || '-'}</TableCell>
                              <TableCell>{new Date(rate.effective_from).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant={rate.is_active ? 'default' : 'secondary'}>
                                  {rate.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {editingId === rate.id ? (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        updateCommission.mutate({
                                          id: rate.id,
                                          updates: editValues,
                                        });
                                        cancelEditing();
                                      }}
                                    >
                                      <Save className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelEditing}>
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      startEditing(rate.id, { commission_percentage: rate.commission_percentage })
                                    }
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Platform Fees Tab */}
                <TabsContent value="fees" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Platform Fees
                      </CardTitle>
                      <CardDescription>Configure delivery, service, and other platform fees</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fee Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Amount/Rate</TableHead>
                            <TableHead>Applies To</TableHead>
                            <TableHead>Taxable</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {platformFees.map((fee) => (
                            <TableRow key={fee.id}>
                              <TableCell className="font-medium">{fee.fee_name.replace(/_/g, ' ')}</TableCell>
                              <TableCell className="capitalize">{fee.fee_type}</TableCell>
                              <TableCell className="capitalize">{fee.fee_category}</TableCell>
                              <TableCell>
                                {fee.fee_type === 'percentage'
                                  ? `${fee.percentage}%`
                                  : `R${fee.base_amount?.toFixed(2)}`}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {fee.applies_to?.map((a) => (
                                    <Badge key={a} variant="outline" className="text-xs">
                                      {a}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={fee.is_taxable}
                                  onCheckedChange={(checked) =>
                                    updateFee.mutate({ id: fee.id, updates: { is_taxable: checked } })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={fee.is_active}
                                  onCheckedChange={(checked) =>
                                    updateFee.mutate({ id: fee.id, updates: { is_active: checked } })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Feature Flags Tab */}
                <TabsContent value="features" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ToggleLeft className="h-5 w-5" />
                        Feature Flags
                      </CardTitle>
                      <CardDescription>Control feature rollouts and enable/disable platform features</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {featureFlags.map((flag) => (
                          <Card key={flag.id} className="border">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{flag.flag_name}</h4>
                                    <Badge variant="outline">{flag.flag_key}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Rollout:</span>
                                    <div className="w-32">
                                      <Slider
                                        value={[flag.rollout_percentage]}
                                        max={100}
                                        step={5}
                                        onValueChange={([value]) =>
                                          updateFeatureFlag.mutate({
                                            id: flag.id,
                                            updates: { rollout_percentage: value },
                                          })
                                        }
                                      />
                                    </div>
                                    <span className="text-sm font-medium w-10">{flag.rollout_percentage}%</span>
                                  </div>
                                  <Switch
                                    checked={flag.is_enabled}
                                    onCheckedChange={(checked) =>
                                      updateFeatureFlag.mutate({
                                        id: flag.id,
                                        updates: { is_enabled: checked },
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* System Settings Tab */}
                <TabsContent value="settings" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        System Settings
                      </CardTitle>
                      <CardDescription>Configure global platform settings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {SETTING_CATEGORIES.map((category) => {
                          const categorySettings = systemSettings.filter((s) => s.category === category.value);
                          return (
                            <AccordionItem key={category.value} value={category.value}>
                              <AccordionTrigger className="capitalize">{category.label}</AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 pt-4">
                                  {categorySettings.map((setting) => (
                                    <div key={setting.id} className="flex items-center justify-between gap-4">
                                      <div className="flex-1">
                                        <Label className="font-medium">{setting.display_name}</Label>
                                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                                      </div>
                                      <div className="w-48">
                                        {setting.setting_type === 'boolean' ? (
                                          <Switch
                                            checked={setting.setting_value === 'true'}
                                            onCheckedChange={(checked) =>
                                              updateSetting.mutate({
                                                key: setting.setting_key,
                                                value: checked.toString(),
                                              })
                                            }
                                          />
                                        ) : (
                                          <Input
                                            type={setting.setting_type === 'number' ? 'number' : 'text'}
                                            value={setting.setting_value}
                                            onChange={(e) =>
                                              updateSetting.mutate({
                                                key: setting.setting_key,
                                                value: e.target.value,
                                              })
                                            }
                                          />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Approvals Tab */}
                <TabsContent value="approvals" className="space-y-6">
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ClipboardList className="h-5 w-5" />
                          Approval Workflows
                        </CardTitle>
                        <CardDescription>Configure approval requirements and auto-approval thresholds</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Workflow</TableHead>
                              <TableHead>Required Approvals</TableHead>
                              <TableHead>Auto-Approve Threshold</TableHead>
                              <TableHead>Escalation (hrs)</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {approvalWorkflows.map((workflow) => (
                              <TableRow key={workflow.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{workflow.workflow_name}</p>
                                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                                  </div>
                                </TableCell>
                                <TableCell>{workflow.required_approvals}</TableCell>
                                <TableCell>
                                  {workflow.auto_approve_threshold
                                    ? `R${workflow.auto_approve_threshold.toLocaleString()}`
                                    : 'Manual only'}
                                </TableCell>
                                <TableCell>{workflow.escalation_hours || '-'}</TableCell>
                                <TableCell>
                                  <Switch
                                    checked={workflow.is_active}
                                    onCheckedChange={(checked) =>
                                      updateWorkflow.mutate({
                                        id: workflow.id,
                                        updates: { is_active: checked },
                                      })
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Pending Approvals
                          <Badge variant="secondary">{approvalQueue.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {approvalQueue.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {approvalQueue.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="capitalize">
                                    {item.workflow_type.replace(/_/g, ' ')}
                                  </TableCell>
                                  <TableCell className="capitalize">{item.entity_type}</TableCell>
                                  <TableCell>
                                    <Badge variant={item.priority <= 3 ? 'destructive' : 'secondary'}>
                                      {item.priority}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => approveRequest.mutate({ id: item.id })}
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() =>
                                          rejectRequest.mutate({ id: item.id, reason: 'Rejected by admin' })
                                        }
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Reject
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                            <p>No pending approvals</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Verification Tab */}
                <TabsContent value="verification" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Verification Requirements
                      </CardTitle>
                      <CardDescription>Configure verification requirements for drivers, restaurants, etc.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Entity Type</TableHead>
                            <TableHead>Requirement</TableHead>
                            <TableHead>Mandatory</TableHead>
                            <TableHead>Expiry (days)</TableHead>
                            <TableHead>Auto-Approve Score</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>Active</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {verificationReqs.map((req) => (
                            <TableRow key={req.id}>
                              <TableCell className="capitalize">{req.entity_type}</TableCell>
                              <TableCell className="capitalize">{req.requirement_type.replace(/_/g, ' ')}</TableCell>
                              <TableCell>
                                <Switch
                                  checked={req.is_mandatory}
                                  onCheckedChange={(checked) =>
                                    updateVerification.mutate({
                                      id: req.id,
                                      updates: { is_mandatory: checked },
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell>{req.expiry_days || 'Never'}</TableCell>
                              <TableCell>{req.auto_approve_score || '-'}</TableCell>
                              <TableCell>{req.cost ? `R${req.cost}` : '-'}</TableCell>
                              <TableCell>
                                <Switch
                                  checked={req.is_active}
                                  onCheckedChange={(checked) =>
                                    updateVerification.mutate({
                                      id: req.id,
                                      updates: { is_active: checked },
                                    })
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Operational Limits Tab */}
                <TabsContent value="limits" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sliders className="h-5 w-5" />
                        Operational Limits
                      </CardTitle>
                      <CardDescription>Configure rate limits, thresholds, and operational constraints</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Limit Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Time Window</TableHead>
                            <TableHead>Action on Exceed</TableHead>
                            <TableHead>Active</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {operationalLimits.map((limit) => (
                            <TableRow key={limit.id}>
                              <TableCell className="font-medium">
                                {limit.limit_name.replace(/_/g, ' ')}
                              </TableCell>
                              <TableCell className="capitalize">{limit.limit_type}</TableCell>
                              <TableCell className="capitalize">{limit.limit_category}</TableCell>
                              <TableCell>{limit.limit_value.toLocaleString()}</TableCell>
                              <TableCell>
                                {limit.time_window_minutes ? `${limit.time_window_minutes} min` : '-'}
                              </TableCell>
                              <TableCell className="capitalize">
                                <Badge variant="outline">{limit.action_on_exceed}</Badge>
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={limit.is_active}
                                  onCheckedChange={(checked) =>
                                    updateLimit.mutate({
                                      id: limit.id,
                                      updates: { is_active: checked },
                                    })
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Service Regions Tab */}
                <TabsContent value="regions" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Service Regions
                      </CardTitle>
                      <CardDescription>Configure service areas and regional settings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Region</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Services Available</TableHead>
                            <TableHead>Timezone</TableHead>
                            <TableHead>Currency</TableHead>
                            <TableHead>Launch Date</TableHead>
                            <TableHead>Active</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {serviceRegions.map((region) => (
                            <TableRow key={region.id}>
                              <TableCell className="font-medium">{region.region_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{region.region_code}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {region.services_available?.map((s) => (
                                    <Badge key={s} variant="secondary" className="text-xs">
                                      {s.replace(/_/g, ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>{region.timezone}</TableCell>
                              <TableCell>{region.currency_code}</TableCell>
                              <TableCell>
                                {region.launch_date ? new Date(region.launch_date).toLocaleDateString() : '-'}
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={region.is_active}
                                  onCheckedChange={(checked) =>
                                    updateRegion.mutate({
                                      id: region.id,
                                      updates: { is_active: checked },
                                    })
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Payouts Tab */}
                <TabsContent value="payouts" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Payout Configuration
                      </CardTitle>
                      <CardDescription>Configure payout schedules and thresholds for partners</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Entity Type</TableHead>
                            <TableHead>Frequency</TableHead>
                            <TableHead>Payout Day</TableHead>
                            <TableHead>Min Amount</TableHead>
                            <TableHead>Hold Period</TableHead>
                            <TableHead>Auto Payout</TableHead>
                            <TableHead>Active</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payoutConfigs.map((config) => (
                            <TableRow key={config.id}>
                              <TableCell className="font-medium capitalize">{config.entity_type}</TableCell>
                              <TableCell className="capitalize">{config.payout_frequency}</TableCell>
                              <TableCell>{config.payout_day || '-'}</TableCell>
                              <TableCell>R{config.min_payout_amount.toLocaleString()}</TableCell>
                              <TableCell>{config.hold_period_days} days</TableCell>
                              <TableCell>
                                <Switch
                                  checked={config.auto_payout_enabled}
                                  onCheckedChange={(checked) =>
                                    updatePayout.mutate({
                                      id: config.id,
                                      updates: { auto_payout_enabled: checked },
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={config.is_active}
                                  onCheckedChange={(checked) =>
                                    updatePayout.mutate({
                                      id: config.id,
                                      updates: { is_active: checked },
                                    })
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Audit Log Tab */}
                <TabsContent value="audit" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Configuration Audit Log
                      </CardTitle>
                      <CardDescription>Track all configuration changes made through the admin panel</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Table</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Changed By</TableHead>
                            <TableHead>Changes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {auditLog.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="text-sm">
                                {new Date(log.created_at).toLocaleString()}
                              </TableCell>
                              <TableCell className="font-mono text-sm">{log.table_name}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    log.action === 'create'
                                      ? 'default'
                                      : log.action === 'delete'
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                >
                                  {log.action}
                                </Badge>
                              </TableCell>
                              <TableCell>{log.changed_by || 'System'}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {log.new_values ? JSON.stringify(log.new_values).substring(0, 50) + '...' : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                          {auditLog.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No audit log entries found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </main>
          </ScrollArea>
        </div>
      </div>
    </SidebarProvider>
  );
}
