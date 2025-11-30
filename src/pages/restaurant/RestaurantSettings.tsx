import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RestaurantLayout } from '@/components/restaurant/RestaurantLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRestaurantProfile } from '@/hooks/useRestaurantData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Settings, Clock, MapPin, CreditCard, Bell, Store, Calendar,
  DollarSign, Truck, Save, Loader2, Plus, Trash2, AlertCircle
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

interface OperatingHours {
  day_of_week: number;
  is_open: boolean;
  opening_time: string;
  closing_time: string;
  break_start?: string;
  break_end?: string;
}

interface BankingDetails {
  bank_name: string;
  account_number: string;
  branch_code: string;
  account_holder_name: string;
}

export default function RestaurantSettings() {
  const { user } = useAuth();
  const { data: restaurant, isLoading } = useRestaurantProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Operating hours state
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([]);
  const [bankingDetails, setBankingDetails] = useState<BankingDetails>({
    bank_name: '',
    account_number: '',
    branch_code: '',
    account_holder_name: '',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    new_orders: true,
    order_cancellations: true,
    low_stock_alerts: true,
    review_notifications: true,
    daily_summary: false,
  });

  // Delivery settings
  const [deliverySettings, setDeliverySettings] = useState({
    supports_delivery: true,
    supports_pickup: true,
    delivery_radius_km: 10,
    delivery_fee: 0,
    minimum_order: 0,
    estimated_delivery_time: 30,
  });

  // Fetch operating hours
  const { data: hoursData } = useQuery({
    queryKey: ['restaurant-hours', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];

      const { data, error } = await (supabase
        .from('restaurant_operating_hours' as any)
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('day_of_week') as any);

      if (error) throw error;
      return data as OperatingHours[];
    },
    enabled: !!restaurant?.id,
  });

  // Initialize operating hours
  useEffect(() => {
    if (hoursData && hoursData.length > 0) {
      setOperatingHours(hoursData);
    } else {
      // Initialize with default hours (9am-9pm, all days open)
      setOperatingHours(
        DAYS_OF_WEEK.map(day => ({
          day_of_week: day.value,
          is_open: day.value !== 0, // Closed on Sunday by default
          opening_time: '09:00',
          closing_time: '21:00',
        }))
      );
    }
  }, [hoursData]);

  // Initialize delivery settings from restaurant
  useEffect(() => {
    if (restaurant) {
      setDeliverySettings({
        supports_delivery: restaurant.supports_delivery ?? true,
        supports_pickup: restaurant.supports_pickup ?? true,
        delivery_radius_km: (restaurant as any).delivery_radius_km ?? 10,
        delivery_fee: restaurant.delivery_fee ?? 0,
        minimum_order: restaurant.minimum_order ?? 0,
        estimated_delivery_time: restaurant.estimated_delivery_time ?? 30,
      });
    }
  }, [restaurant]);

  // Save operating hours
  const saveHours = useMutation({
    mutationFn: async () => {
      if (!restaurant?.id) throw new Error('No restaurant');

      // Delete existing hours
      await (supabase
        .from('restaurant_operating_hours' as any)
        .delete()
        .eq('restaurant_id', restaurant.id) as any);

      // Insert new hours
      const { error } = await (supabase
        .from('restaurant_operating_hours' as any)
        .insert(
          operatingHours.map(h => ({
            restaurant_id: restaurant.id,
            ...h,
          }))
        ) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-hours'] });
      toast({ title: 'Operating hours saved successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to save hours', description: error.message, variant: 'destructive' });
    },
  });

  // Save delivery settings
  const saveDeliverySettings = useMutation({
    mutationFn: async () => {
      if (!restaurant?.id) throw new Error('No restaurant');

      const { error } = await supabase
        .from('restaurants')
        .update({
          supports_delivery: deliverySettings.supports_delivery,
          supports_pickup: deliverySettings.supports_pickup,
          delivery_radius_km: deliverySettings.delivery_radius_km,
          delivery_fee: deliverySettings.delivery_fee,
          minimum_order: deliverySettings.minimum_order,
          estimated_delivery_time: deliverySettings.estimated_delivery_time,
        })
        .eq('id', restaurant.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-profile'] });
      toast({ title: 'Delivery settings saved successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to save settings', description: error.message, variant: 'destructive' });
    },
  });

  // Update operating hours for a specific day
  const updateDayHours = (dayIndex: number, updates: Partial<OperatingHours>) => {
    setOperatingHours(prev =>
      prev.map((h, i) => (i === dayIndex ? { ...h, ...updates } : h))
    );
  };

  if (isLoading) {
    return (
      <RestaurantLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </RestaurantLayout>
    );
  }

  return (
    <RestaurantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your restaurant settings</p>
        </div>

        <Tabs defaultValue="hours" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Operating Hours
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Delivery
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="banking" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Banking
            </TabsTrigger>
          </TabsList>

          {/* Operating Hours Tab */}
          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Operating Hours
                </CardTitle>
                <CardDescription>
                  Set your restaurant's opening hours for each day of the week
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {operatingHours.map((hours, index) => (
                  <div
                    key={hours.day_of_week}
                    className="flex items-center gap-4 p-4 rounded-lg border"
                  >
                    <div className="w-28">
                      <span className="font-medium">
                        {DAYS_OF_WEEK.find(d => d.value === hours.day_of_week)?.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={hours.is_open}
                        onCheckedChange={(checked) =>
                          updateDayHours(index, { is_open: checked })
                        }
                      />
                      <Label className="text-sm">
                        {hours.is_open ? 'Open' : 'Closed'}
                      </Label>
                    </div>

                    {hours.is_open && (
                      <>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-muted-foreground">From</Label>
                          <Input
                            type="time"
                            value={hours.opening_time}
                            onChange={(e) =>
                              updateDayHours(index, { opening_time: e.target.value })
                            }
                            className="w-32"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-muted-foreground">To</Label>
                          <Input
                            type="time"
                            value={hours.closing_time}
                            onChange={(e) =>
                              updateDayHours(index, { closing_time: e.target.value })
                            }
                            className="w-32"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}

                <Button
                  onClick={() => saveHours.mutate()}
                  disabled={saveHours.isPending}
                  className="mt-4"
                >
                  {saveHours.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Operating Hours
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Tab */}
          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Delivery Settings
                </CardTitle>
                <CardDescription>
                  Configure your delivery and pickup options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-medium">Delivery</Label>
                      <p className="text-sm text-muted-foreground">
                        Accept delivery orders
                      </p>
                    </div>
                    <Switch
                      checked={deliverySettings.supports_delivery}
                      onCheckedChange={(checked) =>
                        setDeliverySettings(prev => ({ ...prev, supports_delivery: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-medium">Pickup</Label>
                      <p className="text-sm text-muted-foreground">
                        Accept pickup orders
                      </p>
                    </div>
                    <Switch
                      checked={deliverySettings.supports_pickup}
                      onCheckedChange={(checked) =>
                        setDeliverySettings(prev => ({ ...prev, supports_pickup: checked }))
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_radius">Delivery Radius (km)</Label>
                    <Input
                      id="delivery_radius"
                      type="number"
                      min="1"
                      max="50"
                      value={deliverySettings.delivery_radius_km}
                      onChange={(e) =>
                        setDeliverySettings(prev => ({
                          ...prev,
                          delivery_radius_km: parseInt(e.target.value) || 10,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_fee">Delivery Fee (R)</Label>
                    <Input
                      id="delivery_fee"
                      type="number"
                      min="0"
                      step="0.50"
                      value={deliverySettings.delivery_fee}
                      onChange={(e) =>
                        setDeliverySettings(prev => ({
                          ...prev,
                          delivery_fee: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minimum_order">Minimum Order (R)</Label>
                    <Input
                      id="minimum_order"
                      type="number"
                      min="0"
                      step="5"
                      value={deliverySettings.minimum_order}
                      onChange={(e) =>
                        setDeliverySettings(prev => ({
                          ...prev,
                          minimum_order: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_time">Estimated Delivery Time (min)</Label>
                    <Input
                      id="delivery_time"
                      type="number"
                      min="10"
                      max="120"
                      value={deliverySettings.estimated_delivery_time}
                      onChange={(e) =>
                        setDeliverySettings(prev => ({
                          ...prev,
                          estimated_delivery_time: parseInt(e.target.value) || 30,
                        }))
                      }
                    />
                  </div>
                </div>

                <Button
                  onClick={() => saveDeliverySettings.mutate()}
                  disabled={saveDeliverySettings.isPending}
                >
                  {saveDeliverySettings.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Delivery Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'new_orders', label: 'New Orders', description: 'Get notified when you receive a new order' },
                  { key: 'order_cancellations', label: 'Order Cancellations', description: 'Get notified when an order is cancelled' },
                  { key: 'low_stock_alerts', label: 'Low Stock Alerts', description: 'Get notified when items are running low' },
                  { key: 'review_notifications', label: 'New Reviews', description: 'Get notified when customers leave reviews' },
                  { key: 'daily_summary', label: 'Daily Summary', description: 'Receive a daily summary of your orders' },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-medium">{label}</Label>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <Switch
                      checked={notificationSettings[key as keyof typeof notificationSettings]}
                      onCheckedChange={(checked) =>
                        setNotificationSettings(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}

                <Button className="mt-4">
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banking Tab */}
          <TabsContent value="banking">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Banking Details
                </CardTitle>
                <CardDescription>
                  Add your banking details for payouts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your banking details are securely stored and used only for processing payouts.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Select
                      value={bankingDetails.bank_name}
                      onValueChange={(value) =>
                        setBankingDetails(prev => ({ ...prev, bank_name: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fnb">FNB</SelectItem>
                        <SelectItem value="standard">Standard Bank</SelectItem>
                        <SelectItem value="absa">ABSA</SelectItem>
                        <SelectItem value="nedbank">Nedbank</SelectItem>
                        <SelectItem value="capitec">Capitec</SelectItem>
                        <SelectItem value="investec">Investec</SelectItem>
                        <SelectItem value="tymebank">TymeBank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_holder">Account Holder Name</Label>
                    <Input
                      id="account_holder"
                      value={bankingDetails.account_holder_name}
                      onChange={(e) =>
                        setBankingDetails(prev => ({ ...prev, account_holder_name: e.target.value }))
                      }
                      placeholder="As it appears on your bank account"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      value={bankingDetails.account_number}
                      onChange={(e) =>
                        setBankingDetails(prev => ({ ...prev, account_number: e.target.value }))
                      }
                      placeholder="Your bank account number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch_code">Branch Code</Label>
                    <Input
                      id="branch_code"
                      value={bankingDetails.branch_code}
                      onChange={(e) =>
                        setBankingDetails(prev => ({ ...prev, branch_code: e.target.value }))
                      }
                      placeholder="6-digit branch code"
                    />
                  </div>
                </div>

                <Button className="mt-4">
                  <Save className="h-4 w-4 mr-2" />
                  Save Banking Details
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RestaurantLayout>
  );
}
