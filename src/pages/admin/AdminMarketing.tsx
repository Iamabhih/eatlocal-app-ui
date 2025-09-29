import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Plus, Tag, Megaphone, Image as ImageIcon } from 'lucide-react';

export default function AdminMarketing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoFormData, setPromoFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    start_date: '',
    end_date: '',
  });

  const { data: promoCodes } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      const { data } = await supabase
        .from('marketing_campaigns')
        .select('*, promo_codes(code)')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const createPromoMutation = useMutation({
    mutationFn: async (formData: typeof promoFormData) => {
      const { error } = await supabase.from('promo_codes').insert({
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast({ title: 'Promo code created successfully' });
      setShowPromoForm(false);
      setPromoFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_amount: '',
        start_date: '',
        end_date: '',
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create promo code', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    createPromoMutation.mutate(promoFormData);
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
            <h1 className="text-3xl font-bold mb-6">Marketing Portal</h1>

            <Tabs defaultValue="promo-codes" className="space-y-6">
              <TabsList>
                <TabsTrigger value="promo-codes">
                  <Tag className="h-4 w-4 mr-2" />
                  Promo Codes
                </TabsTrigger>
                <TabsTrigger value="campaigns">
                  <Megaphone className="h-4 w-4 mr-2" />
                  Campaigns
                </TabsTrigger>
                <TabsTrigger value="banners">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Banners
                </TabsTrigger>
              </TabsList>

              {/* Promo Codes Tab */}
              <TabsContent value="promo-codes">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Promo Codes</CardTitle>
                    <Button onClick={() => setShowPromoForm(!showPromoForm)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Promo Code
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {showPromoForm && (
                      <form onSubmit={handleCreatePromo} className="mb-6 p-4 border rounded-lg space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="code">Promo Code *</Label>
                            <Input
                              id="code"
                              value={promoFormData.code}
                              onChange={(e) => setPromoFormData({...promoFormData, code: e.target.value})}
                              placeholder="SUMMER2024"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="discount_type">Discount Type *</Label>
                            <Select 
                              value={promoFormData.discount_type}
                              onValueChange={(value) => setPromoFormData({...promoFormData, discount_type: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="discount_value">
                              Discount Value * {promoFormData.discount_type === 'percentage' ? '(%)' : '($)'}
                            </Label>
                            <Input
                              id="discount_value"
                              type="number"
                              step="0.01"
                              value={promoFormData.discount_value}
                              onChange={(e) => setPromoFormData({...promoFormData, discount_value: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="min_order_amount">Min Order Amount ($)</Label>
                            <Input
                              id="min_order_amount"
                              type="number"
                              step="0.01"
                              value={promoFormData.min_order_amount}
                              onChange={(e) => setPromoFormData({...promoFormData, min_order_amount: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="start_date">Start Date *</Label>
                            <Input
                              id="start_date"
                              type="datetime-local"
                              value={promoFormData.start_date}
                              onChange={(e) => setPromoFormData({...promoFormData, start_date: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="end_date">End Date *</Label>
                            <Input
                              id="end_date"
                              type="datetime-local"
                              value={promoFormData.end_date}
                              onChange={(e) => setPromoFormData({...promoFormData, end_date: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={promoFormData.description}
                            onChange={(e) => setPromoFormData({...promoFormData, description: e.target.value})}
                            placeholder="Limited time offer..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit">Create</Button>
                          <Button type="button" variant="outline" onClick={() => setShowPromoForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Usage</TableHead>
                          <TableHead>Valid Period</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {promoCodes?.map((promo) => (
                          <TableRow key={promo.id}>
                            <TableCell className="font-mono font-bold">{promo.code}</TableCell>
                            <TableCell>{promo.description}</TableCell>
                            <TableCell>
                              {promo.discount_type === 'percentage' 
                                ? `${promo.discount_value}%` 
                                : `$${promo.discount_value}`}
                            </TableCell>
                            <TableCell>{promo.usage_count} / {promo.usage_limit || '∞'}</TableCell>
                            <TableCell className="text-sm">
                              {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={promo.is_active ? 'default' : 'secondary'}>
                                {promo.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Campaigns Tab */}
              <TabsContent value="campaigns">
                <Card>
                  <CardHeader>
                    <CardTitle>Marketing Campaigns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">Campaign management coming soon...</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Audience</TableHead>
                          <TableHead>Promo Code</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Performance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns?.map((campaign) => (
                          <TableRow key={campaign.id}>
                            <TableCell className="font-medium">{campaign.name}</TableCell>
                            <TableCell className="capitalize">{campaign.campaign_type}</TableCell>
                            <TableCell className="capitalize">{campaign.target_audience.replace('_', ' ')}</TableCell>
                            <TableCell>
                              {campaign.promo_codes ? (
                                <Badge variant="outline">{campaign.promo_codes.code}</Badge>
                              ) : 'N/A'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge>{campaign.status}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {campaign.impressions} views • {campaign.clicks} clicks • {campaign.conversions} conversions
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Banners Tab */}
              <TabsContent value="banners">
                <Card>
                  <CardHeader>
                    <CardTitle>Promotional Banners</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Banner management coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
