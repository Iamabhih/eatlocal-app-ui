/**
 * Restaurant Promotions Management Page
 *
 * Allows restaurant owners to create and manage promotional codes
 */

import { useState } from 'react';
import { Plus, Percent, DollarSign, Calendar, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function RestaurantPromotions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch restaurant
  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('owner_id', user?.id)
        .single();
      return data;
    },
  });

  // Fetch promotions
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', restaurant?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('restaurant_id', restaurant?.id)
        .order('created_at', { ascending: false });
      return data;
    },
    enabled: !!restaurant?.id,
  });

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    per_user_limit: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
  });

  // Create promotion mutation
  const createPromotion = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('promo_codes').insert({
        ...data,
        restaurant_id: restaurant?.id,
        applicable_service: 'food_delivery',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast({ title: 'Promotion created successfully!' });
      setIsDialogOpen(false);
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_amount: '',
        max_discount_amount: '',
        usage_limit: '',
        per_user_limit: '',
        valid_from: '',
        valid_until: '',
        is_active: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating promotion',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle active mutation
  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast({ title: 'Promotion updated' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPromotion.mutate({
      ...formData,
      discount_value: parseFloat(formData.discount_value),
      min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
      max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      per_user_limit: formData.per_user_limit ? parseInt(formData.per_user_limit) : 1,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Promotions</h1>
          <p className="text-muted-foreground">
            Create and manage promotional codes for your restaurant
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Promotion</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Promo Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="SAVE20"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="discount_type">Discount Type *</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (R)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Save 20% on all orders"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_value">
                    Discount Value * {formData.discount_type === 'percentage' ? '(%)' : '(R)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="min_order_amount">Min Order Amount (R)</Label>
                  <Input
                    id="min_order_amount"
                    type="number"
                    step="0.01"
                    value={formData.min_order_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, min_order_amount: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usage_limit">Total Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, usage_limit: e.target.value })
                    }
                    placeholder="Unlimited"
                  />
                </div>

                <div>
                  <Label htmlFor="per_user_limit">Per User Limit</Label>
                  <Input
                    id="per_user_limit"
                    type="number"
                    value={formData.per_user_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, per_user_limit: e.target.value })
                    }
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="datetime-local"
                    value={formData.valid_from}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_from: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="datetime-local"
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createPromotion.isPending}>
                  Create Promotion
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Promotions List */}
      <div className="grid gap-4">
        {isLoading ? (
          <p>Loading promotions...</p>
        ) : promotions && promotions.length > 0 ? (
          promotions.map((promo) => (
            <Card key={promo.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <code className="text-lg font-mono">{promo.code}</code>
                    <Badge variant={promo.is_active ? 'default' : 'secondary'}>
                      {promo.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {promo.description}
                  </p>
                </div>
                <Switch
                  checked={promo.is_active}
                  onCheckedChange={(checked) =>
                    toggleActive.mutate({ id: promo.id, is_active: checked })
                  }
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      Discount
                    </p>
                    <p className="font-medium">
                      {promo.discount_type === 'percentage'
                        ? `${promo.discount_value}%`
                        : `R${promo.discount_value}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Usage
                    </p>
                    <p className="font-medium">
                      {promo.times_used} / {promo.usage_limit || '∞'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Valid Until
                    </p>
                    <p className="font-medium">
                      {promo.valid_until
                        ? format(new Date(promo.valid_until), 'PP')
                        : 'No expiry'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Min Order
                    </p>
                    <p className="font-medium">
                      {promo.min_order_amount ? `R${promo.min_order_amount}` : 'None'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No promotions yet. Create your first promotion to attract customers!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
