import { useState } from 'react';
import { RestaurantLayout } from '@/components/restaurant/RestaurantLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useRestaurantProfile } from '@/hooks/useRestaurantData';
import { useRestaurantAnalytics, useRealtimeOrderCount } from '@/hooks/useRestaurantAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store, MapPin, Phone, Mail, Clock, DollarSign, TrendingUp, TrendingDown,
  ShoppingBag, Users, Star, BarChart3, Package, AlertCircle,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const { data: restaurant, isLoading } = useRestaurantProfile();
  const { data: analytics, isLoading: analyticsLoading } = useRestaurantAnalytics('30d');
  const { data: orderCounts } = useRealtimeOrderCount();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cuisine_type: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    delivery_fee: '2.99',
    minimum_order: '15.00',
    estimated_delivery_time: '30',
    opening_time: '09:00',
    closing_time: '22:00',
    delivery_radius_km: '10',
  });

  const [isEditing, setIsEditing] = useState(false);

  const createRestaurant = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('restaurants').insert({
        owner_id: user!.id,
        ...data,
        delivery_fee: parseFloat(data.delivery_fee),
        minimum_order: parseFloat(data.minimum_order),
        estimated_delivery_time: parseInt(data.estimated_delivery_time),
        delivery_radius_km: parseFloat(data.delivery_radius_km),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-profile'] });
      toast({ title: 'Success', description: 'Restaurant created successfully!' });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateRestaurant = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('restaurants')
        .update({
          ...data,
          delivery_fee: parseFloat(data.delivery_fee),
          minimum_order: parseFloat(data.minimum_order),
          estimated_delivery_time: parseInt(data.estimated_delivery_time),
          delivery_radius_km: parseFloat(data.delivery_radius_km),
        })
        .eq('id', restaurant!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-profile'] });
      toast({ title: 'Success', description: 'Restaurant updated successfully!' });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (restaurant) {
      updateRestaurant.mutate(formData);
    } else {
      createRestaurant.mutate(formData);
    }
  };

  const startEditing = () => {
    if (restaurant) {
      setFormData({
        name: restaurant.name,
        description: restaurant.description || '',
        cuisine_type: restaurant.cuisine_type || '',
        street_address: restaurant.street_address,
        city: restaurant.city,
        state: restaurant.state,
        zip_code: restaurant.zip_code,
        phone: restaurant.phone,
        email: restaurant.email || '',
        delivery_fee: restaurant.delivery_fee.toString(),
        minimum_order: restaurant.minimum_order.toString(),
        estimated_delivery_time: restaurant.estimated_delivery_time.toString(),
        opening_time: restaurant.opening_time || '09:00',
        closing_time: restaurant.closing_time || '22:00',
        delivery_radius_km: restaurant.delivery_radius_km?.toString() || '10',
      });
    }
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <RestaurantLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      </RestaurantLayout>
    );
  }

  if (!restaurant && !isEditing) {
    return (
      <RestaurantLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Store className="w-16 h-16 mx-auto mb-4 text-primary" />
              <CardTitle className="text-2xl">Welcome to Restaurant Portal</CardTitle>
              <CardDescription>
                Set up your restaurant profile to start receiving orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsEditing(true)} className="w-full" size="lg">
                Create Restaurant Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </RestaurantLayout>
    );
  }

  if (isEditing || !restaurant) {
    return (
      <RestaurantLayout>
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{restaurant ? 'Edit Restaurant' : 'Create Restaurant Profile'}</CardTitle>
              <CardDescription>
                {restaurant ? 'Update your restaurant information' : 'Fill in your restaurant details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Restaurant Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cuisine_type">Cuisine Type</Label>
                    <Input
                      id="cuisine_type"
                      value={formData.cuisine_type}
                      onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
                      placeholder="e.g., Italian, Mexican, Asian"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="street_address">Street Address *</Label>
                      <Input
                        id="street_address"
                        value={formData.street_address}
                        onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip_code">Zip Code *</Label>
                      <Input
                        id="zip_code"
                        value={formData.zip_code}
                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="opening_time">Opening Time</Label>
                      <Input
                        id="opening_time"
                        type="time"
                        value={formData.opening_time}
                        onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="closing_time">Closing Time</Label>
                      <Input
                        id="closing_time"
                        type="time"
                        value={formData.closing_time}
                        onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="delivery_fee">Delivery Fee (R)</Label>
                      <Input
                        id="delivery_fee"
                        type="number"
                        step="0.01"
                        value={formData.delivery_fee}
                        onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="minimum_order">Min Order (R)</Label>
                      <Input
                        id="minimum_order"
                        type="number"
                        step="0.01"
                        value={formData.minimum_order}
                        onChange={(e) => setFormData({ ...formData, minimum_order: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="estimated_delivery_time">Delivery (min)</Label>
                      <Input
                        id="estimated_delivery_time"
                        type="number"
                        value={formData.estimated_delivery_time}
                        onChange={(e) => setFormData({ ...formData, estimated_delivery_time: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="delivery_radius_km">Radius (km)</Label>
                      <Input
                        id="delivery_radius_km"
                        type="number"
                        step="0.5"
                        value={formData.delivery_radius_km}
                        onChange={(e) => setFormData({ ...formData, delivery_radius_km: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1">
                    {restaurant ? 'Update Restaurant' : 'Create Restaurant'}
                  </Button>
                  {restaurant && (
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </RestaurantLayout>
    );
  }

  return (
    <RestaurantLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{restaurant.name}</h1>
            <p className="text-muted-foreground">{restaurant.description}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={restaurant.is_open ? 'default' : 'secondary'} className="text-sm px-3 py-1">
              {restaurant.is_open ? '🟢 Open' : '🔴 Closed'}
            </Badge>
            <Button onClick={startEditing}>Edit Profile</Button>
          </div>
        </div>

        {/* Real-time Order Alerts */}
        {orderCounts && (orderCounts.pending > 0 || orderCounts.preparing > 0) && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-6 w-6 text-orange-600" />
                <div className="flex gap-6">
                  {orderCounts.pending > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{orderCounts.pending}</Badge>
                      <span className="text-sm font-medium">New orders waiting</span>
                    </div>
                  )}
                  {orderCounts.preparing > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{orderCounts.preparing}</Badge>
                      <span className="text-sm font-medium">Orders in progress</span>
                    </div>
                  )}
                  {orderCounts.ready > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">{orderCounts.ready}</Badge>
                      <span className="text-sm font-medium">Ready for pickup</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for different views */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="info">Restaurant Info</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R{analytics?.today.revenue.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.today.orders || 0} orders
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">R{analytics?.thisWeek.revenue.toFixed(2) || '0.00'}</div>
                    {analytics?.thisWeek.growth !== 0 && (
                      <Badge variant={analytics?.thisWeek.growth > 0 ? 'default' : 'destructive'} className="gap-1">
                        {analytics?.thisWeek.growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(analytics?.thisWeek.growth || 0).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.thisWeek.orders || 0} orders
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R{analytics?.thisWeek.avgOrderValue.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <div className="text-2xl font-bold">{restaurant.rating.toFixed(1)}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">{restaurant.total_reviews} reviews</p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Trend (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics?.dailyStats || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [`R${value.toFixed(2)}`, 'Revenue']}
                        labelFormatter={(date) => new Date(date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top Items & Order Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Top Selling Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.topItems?.length ? (
                    <div className="space-y-3">
                      {analytics.topItems.slice(0, 5).map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">R{item.revenue.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{item.totalOrdered} sold</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No sales data yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Orders by Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.ordersByStatus && Object.keys(analytics.ordersByStatus).length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={Object.entries(analytics.ordersByStatus).map(([status, count]) => ({
                            name: status.replace(/_/g, ' '),
                            value: count,
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {Object.keys(analytics.ordersByStatus).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No order data yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Peak Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Peak Hours (Last 30 Days)</CardTitle>
                <CardDescription>When your orders come in</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.peakHours || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
                    <YAxis />
                    <Tooltip labelFormatter={(hour) => `${hour}:00 - ${hour + 1}:00`} />
                    <Bar dataKey="orders" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Customer Retention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Retention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-3xl font-bold text-primary">{analytics?.customerRetention.newCustomers || 0}</p>
                    <p className="text-sm text-muted-foreground">New Customers</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-600">{analytics?.customerRetention.returningCustomers || 0}</p>
                    <p className="text-sm text-muted-foreground">Returning Customers</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{analytics?.customerRetention.retentionRate.toFixed(1) || 0}%</p>
                    <p className="text-sm text-muted-foreground">Retention Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="space-y-6">
            {/* Fee Structure Card */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Your Fee Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Platform Commission</p>
                    <p className="text-2xl font-bold">{restaurant.commission_rate || 15}%</p>
                    <p className="text-xs text-muted-foreground">On order subtotal</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Settlement Fee</p>
                    <p className="text-2xl font-bold">4.5%</p>
                    <p className="text-xs text-muted-foreground">Card processing</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">You Keep</p>
                    <p className="text-2xl font-bold text-primary">{100 - (restaurant.commission_rate || 15) - 4.5}%</p>
                    <p className="text-xs text-muted-foreground">Of every order</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location & Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{restaurant.street_address}, {restaurant.city}, {restaurant.state} {restaurant.zip_code}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{restaurant.phone}</span>
                </div>
                {restaurant.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{restaurant.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{restaurant.opening_time || '09:00'} - {restaurant.closing_time || '22:00'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{restaurant.estimated_delivery_time}m</p>
                  <p className="text-xs text-muted-foreground">Delivery Time</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <DollarSign className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">R{restaurant.delivery_fee}</p>
                  <p className="text-xs text-muted-foreground">Delivery Fee</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <ShoppingBag className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">R{restaurant.minimum_order}</p>
                  <p className="text-xs text-muted-foreground">Minimum Order</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <MapPin className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{restaurant.delivery_radius_km || 10}km</p>
                  <p className="text-xs text-muted-foreground">Delivery Radius</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </RestaurantLayout>
  );
}
