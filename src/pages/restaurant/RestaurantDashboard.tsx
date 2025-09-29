import { useState } from 'react';
import { RestaurantLayout } from '@/components/restaurant/RestaurantLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRestaurantProfile } from '@/hooks/useRestaurantData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, MapPin, Phone, Mail, Clock, DollarSign } from 'lucide-react';

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const { data: restaurant, isLoading } = useRestaurantProfile();
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
      });
    }
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <RestaurantLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
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

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="delivery_fee">Delivery Fee ($)</Label>
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
                      <Label htmlFor="minimum_order">Minimum Order ($)</Label>
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
                      <Label htmlFor="estimated_delivery_time">Est. Delivery (min)</Label>
                      <Input
                        id="estimated_delivery_time"
                        type="number"
                        value={formData.estimated_delivery_time}
                        onChange={(e) => setFormData({ ...formData, estimated_delivery_time: e.target.value })}
                        required
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{restaurant.name}</h1>
            <p className="text-muted-foreground">{restaurant.description}</p>
          </div>
          <Button onClick={startEditing}>Edit Profile</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{restaurant.rating} ⭐</div>
              <p className="text-xs text-muted-foreground">{restaurant.total_reviews} reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivery Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">{restaurant.estimated_delivery_time}m</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivery Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold">${restaurant.delivery_fee}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {restaurant.is_open ? '🟢 Open' : '🔴 Closed'}
              </div>
            </CardContent>
          </Card>
        </div>

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
          </CardContent>
        </Card>
      </div>
    </RestaurantLayout>
  );
}
