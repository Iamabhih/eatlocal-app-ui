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
import { Plus, Tag, Megaphone, Image as ImageIcon, Edit, Trash2, Play, Pause } from 'lucide-react';
import { useMarketingCampaigns } from '@/hooks/useMarketingCampaigns';
import { usePromotionalBanners } from '@/hooks/usePromotionalBanners';
import { Switch } from '@/components/ui/switch';

export default function AdminMarketing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { campaigns, createCampaign, updateCampaign, deleteCampaign } = useMarketingCampaigns();
  const { banners, createBanner, updateBanner, deleteBanner } = usePromotionalBanners();
  
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showBannerForm, setShowBannerForm] = useState(false);
  
  const [promoFormData, setPromoFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    start_date: '',
    end_date: '',
  });

  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    description: '',
    campaign_type: 'email',
    target_audience: 'all_users',
    promo_code_id: '',
    start_date: '',
    end_date: '',
  });

  const [bannerFormData, setBannerFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    link_type: 'restaurant',
    position: 'home_hero',
    display_order: 0,
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

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaign({
      ...campaignFormData,
      promo_code_id: campaignFormData.promo_code_id || null,
    });
    setShowCampaignForm(false);
    setCampaignFormData({
      name: '',
      description: '',
      campaign_type: 'email',
      target_audience: 'all_users',
      promo_code_id: '',
      start_date: '',
      end_date: '',
    });
  };

  const handleCreateBanner = (e: React.FormEvent) => {
    e.preventDefault();
    createBanner({
      ...bannerFormData,
      display_order: parseInt(bannerFormData.display_order.toString()),
    });
    setShowBannerForm(false);
    setBannerFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      link_type: 'restaurant',
      position: 'home_hero',
      display_order: 0,
      start_date: '',
      end_date: '',
    });
  };

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
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Marketing Campaigns</CardTitle>
                    <Button onClick={() => setShowCampaignForm(!showCampaignForm)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {showCampaignForm && (
                      <form onSubmit={handleCreateCampaign} className="mb-6 p-4 border rounded-lg space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="campaign_name">Campaign Name *</Label>
                            <Input
                              id="campaign_name"
                              value={campaignFormData.name}
                              onChange={(e) => setCampaignFormData({...campaignFormData, name: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="campaign_type">Campaign Type *</Label>
                            <Select 
                              value={campaignFormData.campaign_type}
                              onValueChange={(value) => setCampaignFormData({...campaignFormData, campaign_type: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="push">Push Notification</SelectItem>
                                <SelectItem value="in-app">In-App</SelectItem>
                                <SelectItem value="social">Social Media</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="target_audience">Target Audience *</Label>
                            <Select 
                              value={campaignFormData.target_audience}
                              onValueChange={(value) => setCampaignFormData({...campaignFormData, target_audience: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all_users">All Users</SelectItem>
                                <SelectItem value="new_users">New Users</SelectItem>
                                <SelectItem value="inactive_users">Inactive Users</SelectItem>
                                <SelectItem value="high_value">High Value Customers</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="campaign_promo">Promo Code (Optional)</Label>
                            <Select 
                              value={campaignFormData.promo_code_id}
                              onValueChange={(value) => setCampaignFormData({...campaignFormData, promo_code_id: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select promo code" />
                              </SelectTrigger>
                              <SelectContent>
                                {promoCodes?.map((promo) => (
                                  <SelectItem key={promo.id} value={promo.id}>
                                    {promo.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="campaign_start_date">Start Date *</Label>
                            <Input
                              id="campaign_start_date"
                              type="datetime-local"
                              value={campaignFormData.start_date}
                              onChange={(e) => setCampaignFormData({...campaignFormData, start_date: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="campaign_end_date">End Date *</Label>
                            <Input
                              id="campaign_end_date"
                              type="datetime-local"
                              value={campaignFormData.end_date}
                              onChange={(e) => setCampaignFormData({...campaignFormData, end_date: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="campaign_description">Description</Label>
                          <Textarea
                            id="campaign_description"
                            value={campaignFormData.description}
                            onChange={(e) => setCampaignFormData({...campaignFormData, description: e.target.value})}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit">Create Campaign</Button>
                          <Button type="button" variant="outline" onClick={() => setShowCampaignForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}

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
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns?.map((campaign: any) => (
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
                              {campaign.impressions || 0} views • {campaign.clicks || 0} clicks • {campaign.conversions || 0} conversions
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateCampaign({ 
                                    id: campaign.id, 
                                    updates: { status: campaign.status === 'active' ? 'paused' : 'active' } 
                                  })}
                                >
                                  {campaign.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteCampaign(campaign.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Promotional Banners</CardTitle>
                    <Button onClick={() => setShowBannerForm(!showBannerForm)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Banner
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {showBannerForm && (
                      <form onSubmit={handleCreateBanner} className="mb-6 p-4 border rounded-lg space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="banner_title">Title *</Label>
                            <Input
                              id="banner_title"
                              value={bannerFormData.title}
                              onChange={(e) => setBannerFormData({...bannerFormData, title: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="banner_image_url">Image URL *</Label>
                            <Input
                              id="banner_image_url"
                              value={bannerFormData.image_url}
                              onChange={(e) => setBannerFormData({...bannerFormData, image_url: e.target.value})}
                              placeholder="https://example.com/banner.jpg"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="banner_link_url">Link URL</Label>
                            <Input
                              id="banner_link_url"
                              value={bannerFormData.link_url}
                              onChange={(e) => setBannerFormData({...bannerFormData, link_url: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="banner_link_type">Link Type</Label>
                            <Select 
                              value={bannerFormData.link_type}
                              onValueChange={(value) => setBannerFormData({...bannerFormData, link_type: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="restaurant">Restaurant</SelectItem>
                                <SelectItem value="category">Category</SelectItem>
                                <SelectItem value="promo">Promo</SelectItem>
                                <SelectItem value="external">External</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="banner_position">Position</Label>
                            <Select 
                              value={bannerFormData.position}
                              onValueChange={(value) => setBannerFormData({...bannerFormData, position: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="home_hero">Home Hero</SelectItem>
                                <SelectItem value="home_secondary">Home Secondary</SelectItem>
                                <SelectItem value="restaurant_page">Restaurant Page</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="banner_display_order">Display Order</Label>
                            <Input
                              id="banner_display_order"
                              type="number"
                              value={bannerFormData.display_order}
                              onChange={(e) => setBannerFormData({...bannerFormData, display_order: parseInt(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="banner_start_date">Start Date *</Label>
                            <Input
                              id="banner_start_date"
                              type="datetime-local"
                              value={bannerFormData.start_date}
                              onChange={(e) => setBannerFormData({...bannerFormData, start_date: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="banner_end_date">End Date *</Label>
                            <Input
                              id="banner_end_date"
                              type="datetime-local"
                              value={bannerFormData.end_date}
                              onChange={(e) => setBannerFormData({...bannerFormData, end_date: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="banner_description">Description</Label>
                          <Textarea
                            id="banner_description"
                            value={bannerFormData.description}
                            onChange={(e) => setBannerFormData({...bannerFormData, description: e.target.value})}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit">Create Banner</Button>
                          <Button type="button" variant="outline" onClick={() => setShowBannerForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Link Type</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Performance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {banners?.map((banner: any) => (
                          <TableRow key={banner.id}>
                            <TableCell className="font-medium">{banner.title}</TableCell>
                            <TableCell className="capitalize">{banner.position.replace('_', ' ')}</TableCell>
                            <TableCell className="capitalize">{banner.link_type}</TableCell>
                            <TableCell className="text-sm">
                              {new Date(banner.start_date).toLocaleDateString()} - {new Date(banner.end_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-sm">
                              {banner.impressions || 0} views • {banner.clicks || 0} clicks
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={banner.is_active}
                                onCheckedChange={(checked) => updateBanner({ 
                                  id: banner.id, 
                                  updates: { is_active: checked } 
                                })}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteBanner(banner.id)}
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
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
