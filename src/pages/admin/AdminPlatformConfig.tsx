import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useOutletContext, Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  UtensilsCrossed,
  Hotel,
  Building2,
  Car,
  Gift,
  CreditCard,
  Globe,
  AlertTriangle,
  Save,
  RotateCcw,
  Percent,
  DollarSign,
  Shield,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { usePlatformConfig, PlatformConfig } from '@/hooks/usePlatformConfig';
import { toast } from 'sonner';

export default function AdminPlatformConfig() {
  const { isSuperadmin } = useOutletContext<{ isSuperadmin: boolean }>();
  const { config, updateConfig, resetConfig, isUpdating, DEFAULT_CONFIG } = usePlatformConfig();

  // Local state for form management
  const [localConfig, setLocalConfig] = useState<PlatformConfig>(config);
  const [hasChanges, setHasChanges] = useState(false);

  // Redirect non-superadmins
  if (!isSuperadmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Update local config
  const updateLocalConfig = <K extends keyof PlatformConfig>(
    section: K,
    field: keyof PlatformConfig[K],
    value: PlatformConfig[K][keyof PlatformConfig[K]]
  ) => {
    setLocalConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  // Save all changes
  const handleSave = () => {
    updateConfig(localConfig);
    setHasChanges(false);
  };

  // Reset to defaults
  const handleReset = () => {
    if (confirm('Are you sure you want to reset all configurations to default values? This cannot be undone.')) {
      resetConfig();
      setLocalConfig(DEFAULT_CONFIG);
      setHasChanges(false);
    }
  };

  // Helper component for percentage inputs
  const PercentInput = ({
    label,
    value,
    onChange,
    description
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    description?: string;
  }) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Percent className="h-4 w-4 text-muted-foreground" />
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-24"
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );

  // Helper component for currency inputs
  const CurrencyInput = ({
    label,
    value,
    onChange,
    description
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    description?: string;
  }) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">R</span>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-32"
        />
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar isSuperadmin={isSuperadmin} />

        <div className="flex-1">
          <header className="h-16 border-b flex items-center justify-between px-6 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Platform Configuration</h1>
              </div>
              <Badge variant="default" className="bg-primary">
                SuperAdmin Only
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Unsaved Changes
                </Badge>
              )}
              <Button variant="outline" onClick={handleReset} disabled={isUpdating}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button onClick={handleSave} disabled={isUpdating || !hasChanges}>
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </header>

          <main className="p-6">
            {/* Warning Banner */}
            <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10 mb-6">
              <CardContent className="flex items-center gap-4 py-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Configuration Changes Affect Platform-Wide Operations
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Changes here will affect fees, commissions, and functionality across all services. Review carefully before saving.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="food" className="space-y-6">
              <TabsList className="grid grid-cols-7 gap-2 h-auto p-1">
                <TabsTrigger value="food" className="flex items-center gap-2 py-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  <span className="hidden md:inline">Food Delivery</span>
                </TabsTrigger>
                <TabsTrigger value="hotels" className="flex items-center gap-2 py-2">
                  <Hotel className="h-4 w-4" />
                  <span className="hidden md:inline">Hotels</span>
                </TabsTrigger>
                <TabsTrigger value="venues" className="flex items-center gap-2 py-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden md:inline">Venues</span>
                </TabsTrigger>
                <TabsTrigger value="rides" className="flex items-center gap-2 py-2">
                  <Car className="h-4 w-4" />
                  <span className="hidden md:inline">Rides</span>
                </TabsTrigger>
                <TabsTrigger value="loyalty" className="flex items-center gap-2 py-2">
                  <Gift className="h-4 w-4" />
                  <span className="hidden md:inline">Loyalty</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2 py-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden md:inline">Payments</span>
                </TabsTrigger>
                <TabsTrigger value="platform" className="flex items-center gap-2 py-2">
                  <Globe className="h-4 w-4" />
                  <span className="hidden md:inline">Platform</span>
                </TabsTrigger>
              </TabsList>

              {/* Food Delivery Configuration */}
              <TabsContent value="food">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5" />
                        Restaurant Commissions
                      </CardTitle>
                      <CardDescription>
                        Configure platform fees for restaurant orders
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <PercentInput
                        label="Platform Commission Rate"
                        value={localConfig.food.platformCommissionRate}
                        onChange={(v) => updateLocalConfig('food', 'platformCommissionRate', v)}
                        description="Default commission charged to restaurants per order"
                      />
                      <PercentInput
                        label="Customer Service Fee"
                        value={localConfig.food.serviceFeeRate}
                        onChange={(v) => updateLocalConfig('food', 'serviceFeeRate', v)}
                        description="Service fee charged to customers on orders"
                      />
                      <PercentInput
                        label="VAT Rate"
                        value={localConfig.food.taxRate}
                        onChange={(v) => updateLocalConfig('food', 'taxRate', v)}
                        description="Value Added Tax rate applied to orders"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Delivery Fees</CardTitle>
                      <CardDescription>
                        Configure delivery fee structure
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <CurrencyInput
                        label="Base Delivery Fee"
                        value={localConfig.food.deliveryBaseFee}
                        onChange={(v) => updateLocalConfig('food', 'deliveryBaseFee', v)}
                        description="Minimum delivery fee charged"
                      />
                      <CurrencyInput
                        label="Per Kilometer Fee"
                        value={localConfig.food.deliveryPerKmFee}
                        onChange={(v) => updateLocalConfig('food', 'deliveryPerKmFee', v)}
                        description="Additional fee per kilometer of delivery distance"
                      />
                      <CurrencyInput
                        label="Default Minimum Order"
                        value={localConfig.food.minimumOrderDefault}
                        onChange={(v) => updateLocalConfig('food', 'minimumOrderDefault', v)}
                        description="Default minimum order value for new restaurants"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Delivery Partner Earnings</CardTitle>
                      <CardDescription>
                        Configure delivery partner payment structure
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <PercentInput
                        label="Partner Earning Rate"
                        value={localConfig.food.deliveryPartnerRate}
                        onChange={(v) => updateLocalConfig('food', 'deliveryPartnerRate', v)}
                        description="Percentage of delivery fee paid to partners"
                      />
                      <PercentInput
                        label="Platform Fee from Partners"
                        value={localConfig.food.deliveryPartnerPlatformFee}
                        onChange={(v) => updateLocalConfig('food', 'deliveryPartnerPlatformFee', v)}
                        description="Platform commission on delivery earnings"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Hotels Configuration */}
              <TabsContent value="hotels">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Hotel className="h-5 w-5" />
                        Hotel Booking Fees
                      </CardTitle>
                      <CardDescription>
                        Configure platform fees for hotel bookings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <PercentInput
                        label="Platform Commission Rate"
                        value={localConfig.hotels.platformCommissionRate}
                        onChange={(v) => updateLocalConfig('hotels', 'platformCommissionRate', v)}
                        description="Commission charged on hotel bookings"
                      />
                      <CurrencyInput
                        label="Service Fee (Flat)"
                        value={localConfig.hotels.serviceFeeFlat}
                        onChange={(v) => updateLocalConfig('hotels', 'serviceFeeFlat', v)}
                        description="Flat service fee per booking"
                      />
                      <PercentInput
                        label="VAT Rate"
                        value={localConfig.hotels.vatRate}
                        onChange={(v) => updateLocalConfig('hotels', 'vatRate', v)}
                        description="VAT applied to hotel bookings"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Booking Policies</CardTitle>
                      <CardDescription>
                        Configure booking and cancellation settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Free Cancellation Period (Hours)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={localConfig.hotels.cancellationPeriodHours}
                          onChange={(e) => updateLocalConfig('hotels', 'cancellationPeriodHours', parseInt(e.target.value) || 0)}
                          className="w-32"
                        />
                        <p className="text-xs text-muted-foreground">Hours before check-in for free cancellation</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Instant Booking</Label>
                          <p className="text-xs text-muted-foreground">Allow instant booking without approval</p>
                        </div>
                        <Switch
                          checked={localConfig.hotels.instantBookingEnabled}
                          onCheckedChange={(v) => updateLocalConfig('hotels', 'instantBookingEnabled', v)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Venues & Experiences Configuration */}
              <TabsContent value="venues">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Venue Booking Fees
                      </CardTitle>
                      <CardDescription>
                        Configure platform fees for venue bookings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <PercentInput
                        label="Venue Commission Rate"
                        value={localConfig.venues.platformCommissionRate}
                        onChange={(v) => updateLocalConfig('venues', 'platformCommissionRate', v)}
                        description="Commission on venue bookings"
                      />
                      <PercentInput
                        label="Experience Commission Rate"
                        value={localConfig.venues.experienceCommissionRate}
                        onChange={(v) => updateLocalConfig('venues', 'experienceCommissionRate', v)}
                        description="Commission on experience bookings"
                      />
                      <PercentInput
                        label="Service Fee Rate"
                        value={localConfig.venues.serviceFeeRate}
                        onChange={(v) => updateLocalConfig('venues', 'serviceFeeRate', v)}
                        description="Service fee charged to customers"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Private Bookings</CardTitle>
                      <CardDescription>
                        Configure private booking multipliers
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Private Booking Multiplier</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="1"
                          value={localConfig.venues.privateBookingMultiplier}
                          onChange={(e) => updateLocalConfig('venues', 'privateBookingMultiplier', parseFloat(e.target.value) || 1)}
                          className="w-32"
                        />
                        <p className="text-xs text-muted-foreground">Price multiplier for private experience bookings (e.g., 1.5 = 50% extra)</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Rides Configuration */}
              <TabsContent value="rides">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        Ride Pricing Tiers
                      </CardTitle>
                      <CardDescription>
                        Configure base fare and per-km rates for each tier
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Badge variant="outline">Budget</Badge>
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <CurrencyInput
                            label="Base Fare"
                            value={localConfig.rides.budgetBaseFare}
                            onChange={(v) => updateLocalConfig('rides', 'budgetBaseFare', v)}
                          />
                          <CurrencyInput
                            label="Per Km Rate"
                            value={localConfig.rides.budgetPerKmRate}
                            onChange={(v) => updateLocalConfig('rides', 'budgetPerKmRate', v)}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Badge variant="secondary">Enhanced</Badge>
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <CurrencyInput
                            label="Base Fare"
                            value={localConfig.rides.enhancedBaseFare}
                            onChange={(v) => updateLocalConfig('rides', 'enhancedBaseFare', v)}
                          />
                          <CurrencyInput
                            label="Per Km Rate"
                            value={localConfig.rides.enhancedPerKmRate}
                            onChange={(v) => updateLocalConfig('rides', 'enhancedPerKmRate', v)}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Badge>Premium</Badge>
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <CurrencyInput
                            label="Base Fare"
                            value={localConfig.rides.premiumBaseFare}
                            onChange={(v) => updateLocalConfig('rides', 'premiumBaseFare', v)}
                          />
                          <CurrencyInput
                            label="Per Km Rate"
                            value={localConfig.rides.premiumPerKmRate}
                            onChange={(v) => updateLocalConfig('rides', 'premiumPerKmRate', v)}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Badge className="bg-yellow-500">Luxury</Badge>
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <CurrencyInput
                            label="Base Fare"
                            value={localConfig.rides.luxuryBaseFare}
                            onChange={(v) => updateLocalConfig('rides', 'luxuryBaseFare', v)}
                          />
                          <CurrencyInput
                            label="Per Km Rate"
                            value={localConfig.rides.luxuryPerKmRate}
                            onChange={(v) => updateLocalConfig('rides', 'luxuryPerKmRate', v)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Platform & Surge Pricing</CardTitle>
                      <CardDescription>
                        Configure commission and surge settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <PercentInput
                        label="Platform Commission"
                        value={localConfig.rides.platformCommissionRate}
                        onChange={(v) => updateLocalConfig('rides', 'platformCommissionRate', v)}
                        description="Platform commission on ride fares"
                      />

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Surge Pricing</Label>
                          <p className="text-xs text-muted-foreground">Enable surge pricing during high demand</p>
                        </div>
                        <Switch
                          checked={localConfig.rides.surgePricingEnabled}
                          onCheckedChange={(v) => updateLocalConfig('rides', 'surgePricingEnabled', v)}
                        />
                      </div>

                      {localConfig.rides.surgePricingEnabled && (
                        <div className="space-y-2">
                          <Label>Surge Multiplier</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            value={localConfig.rides.surgePricingMultiplier}
                            onChange={(e) => updateLocalConfig('rides', 'surgePricingMultiplier', parseFloat(e.target.value) || 1)}
                            className="w-32"
                          />
                          <p className="text-xs text-muted-foreground">Maximum surge multiplier (e.g., 1.5 = 50% extra)</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Loyalty Program Configuration */}
              <TabsContent value="loyalty">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5" />
                        Points System
                      </CardTitle>
                      <CardDescription>
                        Configure how points are earned and redeemed
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Points Per Rand</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={localConfig.loyalty.pointsPerRand}
                          onChange={(e) => updateLocalConfig('loyalty', 'pointsPerRand', parseFloat(e.target.value) || 0)}
                          className="w-32"
                        />
                        <p className="text-xs text-muted-foreground">Points earned per R1 spent (0.1 = 1 point per R10)</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Point Value (Rand)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={localConfig.loyalty.pointValueInRand}
                          onChange={(e) => updateLocalConfig('loyalty', 'pointValueInRand', parseFloat(e.target.value) || 0)}
                          className="w-32"
                        />
                        <p className="text-xs text-muted-foreground">Value in Rand per loyalty point when redeeming</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tier Thresholds</CardTitle>
                      <CardDescription>
                        Configure points required for each tier
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-amber-100">Bronze</Badge>
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={localConfig.loyalty.bronzeThreshold}
                            onChange={(e) => updateLocalConfig('loyalty', 'bronzeThreshold', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Multiplier</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="1"
                            value={localConfig.loyalty.bronzeMultiplier}
                            onChange={(e) => updateLocalConfig('loyalty', 'bronzeMultiplier', parseFloat(e.target.value) || 1)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-gray-200">Silver</Badge>
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={localConfig.loyalty.silverThreshold}
                            onChange={(e) => updateLocalConfig('loyalty', 'silverThreshold', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Multiplier</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="1"
                            value={localConfig.loyalty.silverMultiplier}
                            onChange={(e) => updateLocalConfig('loyalty', 'silverMultiplier', parseFloat(e.target.value) || 1)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Badge className="bg-yellow-500">Gold</Badge>
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={localConfig.loyalty.goldThreshold}
                            onChange={(e) => updateLocalConfig('loyalty', 'goldThreshold', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Multiplier</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="1"
                            value={localConfig.loyalty.goldMultiplier}
                            onChange={(e) => updateLocalConfig('loyalty', 'goldMultiplier', parseFloat(e.target.value) || 1)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Badge className="bg-purple-500">Platinum</Badge>
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={localConfig.loyalty.platinumThreshold}
                            onChange={(e) => updateLocalConfig('loyalty', 'platinumThreshold', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Multiplier</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="1"
                            value={localConfig.loyalty.platinumMultiplier}
                            onChange={(e) => updateLocalConfig('loyalty', 'platinumMultiplier', parseFloat(e.target.value) || 1)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Payments Configuration */}
              <TabsContent value="payments">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        PayFast Integration
                      </CardTitle>
                      <CardDescription>
                        Configure PayFast payment gateway credentials
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Sandbox Mode</Label>
                          <p className="text-xs text-muted-foreground">Use test environment for payments</p>
                        </div>
                        <Switch
                          checked={localConfig.payments.sandboxMode}
                          onCheckedChange={(v) => updateLocalConfig('payments', 'sandboxMode', v)}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Merchant ID</Label>
                        <Input
                          type="text"
                          value={localConfig.payments.payfastMerchantId}
                          onChange={(e) => updateLocalConfig('payments', 'payfastMerchantId', e.target.value)}
                          placeholder="Enter merchant ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Merchant Key</Label>
                        <Input
                          type="password"
                          value={localConfig.payments.payfastMerchantKey}
                          onChange={(e) => updateLocalConfig('payments', 'payfastMerchantKey', e.target.value)}
                          placeholder="Enter merchant key"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Passphrase</Label>
                        <Input
                          type="password"
                          value={localConfig.payments.payfastPassphrase}
                          onChange={(e) => updateLocalConfig('payments', 'payfastPassphrase', e.target.value)}
                          placeholder="Enter passphrase"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Wallet Settings</CardTitle>
                      <CardDescription>
                        Configure in-app wallet functionality
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Wallet</Label>
                          <p className="text-xs text-muted-foreground">Allow customers to use wallet payments</p>
                        </div>
                        <Switch
                          checked={localConfig.payments.walletEnabled}
                          onCheckedChange={(v) => updateLocalConfig('payments', 'walletEnabled', v)}
                        />
                      </div>

                      <CurrencyInput
                        label="Maximum Wallet Balance"
                        value={localConfig.payments.maxWalletBalance}
                        onChange={(v) => updateLocalConfig('payments', 'maxWalletBalance', v)}
                        description="Maximum amount a user can hold in their wallet"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Platform Settings */}
              <TabsContent value="platform">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Platform Status
                      </CardTitle>
                      <CardDescription>
                        Control platform-wide settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            Maintenance Mode
                          </Label>
                          <p className="text-xs text-muted-foreground">Disable all user access to the platform</p>
                        </div>
                        <Switch
                          checked={localConfig.platform.maintenanceMode}
                          onCheckedChange={(v) => updateLocalConfig('platform', 'maintenanceMode', v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>New Registrations</Label>
                          <p className="text-xs text-muted-foreground">Allow new user sign-ups</p>
                        </div>
                        <Switch
                          checked={localConfig.platform.newRegistrationsEnabled}
                          onCheckedChange={(v) => updateLocalConfig('platform', 'newRegistrationsEnabled', v)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Active Provinces
                      </CardTitle>
                      <CardDescription>
                        Service coverage areas in South Africa
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Gauteng',
                          'Western Cape',
                          'KwaZulu-Natal',
                          'Eastern Cape',
                          'Free State',
                          'Limpopo',
                          'Mpumalanga',
                          'Northern Cape',
                          'North West',
                        ].map((province) => (
                          <Badge
                            key={province}
                            variant={localConfig.platform.provinces.includes(province) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => {
                              const current = localConfig.platform.provinces;
                              const updated = current.includes(province)
                                ? current.filter(p => p !== province)
                                : [...current, province];
                              updateLocalConfig('platform', 'provinces', updated as any);
                            }}
                          >
                            {province}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Click to toggle province availability</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Support Contact
                      </CardTitle>
                      <CardDescription>
                        Configure customer support information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Support Email
                        </Label>
                        <Input
                          type="email"
                          value={localConfig.platform.supportEmail}
                          onChange={(e) => updateLocalConfig('platform', 'supportEmail', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Support Phone
                        </Label>
                        <Input
                          type="tel"
                          value={localConfig.platform.supportPhone}
                          onChange={(e) => updateLocalConfig('platform', 'supportPhone', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Emergency Numbers
                      </CardTitle>
                      <CardDescription>
                        Configure SA emergency contact numbers
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>SAPS (Police)</Label>
                        <Input
                          type="tel"
                          value={localConfig.platform.emergencyNumbers.saps}
                          onChange={(e) => {
                            const updated = { ...localConfig.platform.emergencyNumbers, saps: e.target.value };
                            setLocalConfig(prev => ({
                              ...prev,
                              platform: { ...prev.platform, emergencyNumbers: updated }
                            }));
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ambulance</Label>
                        <Input
                          type="tel"
                          value={localConfig.platform.emergencyNumbers.ambulance}
                          onChange={(e) => {
                            const updated = { ...localConfig.platform.emergencyNumbers, ambulance: e.target.value };
                            setLocalConfig(prev => ({
                              ...prev,
                              platform: { ...prev.platform, emergencyNumbers: updated }
                            }));
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Universal Emergency</Label>
                        <Input
                          type="tel"
                          value={localConfig.platform.emergencyNumbers.universal}
                          onChange={(e) => {
                            const updated = { ...localConfig.platform.emergencyNumbers, universal: e.target.value };
                            setLocalConfig(prev => ({
                              ...prev,
                              platform: { ...prev.platform, emergencyNumbers: updated }
                            }));
                            setHasChanges(true);
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
