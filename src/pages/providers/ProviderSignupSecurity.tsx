import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Check,
  ArrowRight,
  Clock,
  TrendingUp,
  Users,
  MapPin,
  Phone,
  Mail,
  Siren,
  Radio,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Navbar from '@/components/shared/Navbar';

const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
];

const SERVICES = [
  { id: 'armed_response', label: 'Armed Response', icon: Siren },
  { id: 'patrol', label: 'Patrol Services', icon: Eye },
  { id: 'monitoring', label: 'Alarm Monitoring', icon: Radio },
  { id: 'guarding', label: 'Static Guarding', icon: Shield },
  { id: 'escort', label: 'Escort Services', icon: Users },
  { id: 'events', label: 'Event Security', icon: Users },
  { id: 'investigation', label: 'Investigation Services', icon: Eye },
  { id: 'k9', label: 'K9 Units', icon: Shield },
];

const benefits = [
  {
    icon: AlertTriangle,
    title: 'Panic Alert Integration',
    description: 'Receive real-time panic alerts from app users in your coverage area',
  },
  {
    icon: MapPin,
    title: 'Location Tracking',
    description: 'Precise GPS locations for faster response times',
  },
  {
    icon: TrendingUp,
    title: 'Grow Your Business',
    description: 'Connect with individuals and businesses needing security',
  },
  {
    icon: Clock,
    title: '24/7 Platform',
    description: 'Our platform works around the clock, just like you',
  },
];

export function ProviderSignupSecurity() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    registrationNumber: '',
    psiraNumber: '',
    vatNumber: '',
    contactName: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    emergencyPhone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    coverageProvinces: [] as string[],
    coverageCities: '',
    coverageRadius: '50',
    description: '',
    services: [] as string[],
    responseTimeMinutes: '15',
    is24Hours: true,
    totalVehicles: '',
    totalPersonnel: '',
    yearsInOperation: '',
    agreedToTerms: false,
    agreedToVerification: false,
  });

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleServiceToggle = (service: string) => {
    const current = formData.services;
    if (current.includes(service)) {
      handleChange('services', current.filter((s) => s !== service));
    } else {
      handleChange('services', [...current, service]);
    }
  };

  const handleProvinceToggle = (province: string) => {
    const current = formData.coverageProvinces;
    if (current.includes(province)) {
      handleChange('coverageProvinces', current.filter((p) => p !== province));
    } else {
      handleChange('coverageProvinces', [...current, province]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.agreedToTerms || !formData.agreedToVerification) {
      toast.error('Please agree to all terms and conditions');
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert into provider_applications
      const { error: appError } = await supabase.from('provider_applications').insert({
        user_id: user?.id || null,
        provider_type: 'security',
        business_name: formData.companyName,
        business_type: 'Security Provider',
        registration_number: formData.registrationNumber || null,
        vat_number: formData.vatNumber || null,
        contact_name: formData.contactName,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        postal_code: formData.postalCode,
        status: 'pending',
        documents: {
          psira_number: formData.psiraNumber,
          emergency_phone: formData.emergencyPhone,
          coverage_provinces: formData.coverageProvinces,
          coverage_cities: formData.coverageCities,
          coverage_radius: formData.coverageRadius,
          description: formData.description,
          services: formData.services,
          response_time_minutes: formData.responseTimeMinutes,
          is_24_hours: formData.is24Hours,
          total_vehicles: formData.totalVehicles,
          total_personnel: formData.totalPersonnel,
          years_in_operation: formData.yearsInOperation,
        },
      });

      if (appError) throw appError;

      toast.success('Application submitted successfully!');
      setStep(4);
    } catch (error) {
      // Error logged via toast notification - no console.error in production
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar type="customer" />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-white/20 text-white">Security Partner</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Join the Smash Local Security Network
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Become a verified security provider and receive panic alerts from
              users in your coverage area. Help keep South Africa safe.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Badge variant="secondary" className="text-sm py-2 px-4">
                <Check className="h-4 w-4 mr-2" /> PSIRA verified
              </Badge>
              <Badge variant="secondary" className="text-sm py-2 px-4">
                <Check className="h-4 w-4 mr-2" /> Real-time alerts
              </Badge>
              <Badge variant="secondary" className="text-sm py-2 px-4">
                <Check className="h-4 w-4 mr-2" /> GPS tracking
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                      step >= s
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step > s ? <Check className="h-5 w-5" /> : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`h-1 w-20 md:w-32 ${
                        step > s ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {step === 4 ? (
              <Card>
                <CardContent className="pt-12 pb-8 text-center">
                  <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <Check className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Application Submitted!</h2>
                  <p className="text-muted-foreground mb-4">
                    Thank you for applying to join the Smash Local Security Network.
                  </p>
                  <p className="text-sm text-muted-foreground mb-8">
                    We'll verify your PSIRA registration and company details.
                    Once approved, you'll receive panic alerts from users in your coverage area.
                  </p>
                  <Button onClick={() => navigate('/')}>Return to Home</Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {step === 1 && 'Company Information'}
                    {step === 2 && 'Contact & Location'}
                    {step === 3 && 'Services & Coverage'}
                  </CardTitle>
                  <CardDescription>
                    {step === 1 && 'Your company and registration details'}
                    {step === 2 && 'How to reach you and your service area'}
                    {step === 3 && 'What services you provide'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {step === 1 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name *</Label>
                        <Input
                          id="companyName"
                          value={formData.companyName}
                          onChange={(e) => handleChange('companyName', e.target.value)}
                          placeholder="e.g., XYZ Security Services"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="registrationNumber">Company Registration No. *</Label>
                          <Input
                            id="registrationNumber"
                            value={formData.registrationNumber}
                            onChange={(e) => handleChange('registrationNumber', e.target.value)}
                            placeholder="e.g., 2020/123456/07"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="psiraNumber">PSIRA Registration No. *</Label>
                          <Input
                            id="psiraNumber"
                            value={formData.psiraNumber}
                            onChange={(e) => handleChange('psiraNumber', e.target.value)}
                            placeholder="e.g., 1234567"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vatNumber">VAT Number</Label>
                        <Input
                          id="vatNumber"
                          value={formData.vatNumber}
                          onChange={(e) => handleChange('vatNumber', e.target.value)}
                          placeholder="Optional"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="yearsInOperation">Years in Operation</Label>
                          <Select
                            value={formData.yearsInOperation}
                            onValueChange={(v) => handleChange('yearsInOperation', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="less_than_1">Less than 1 year</SelectItem>
                              <SelectItem value="1_to_3">1-3 years</SelectItem>
                              <SelectItem value="3_to_5">3-5 years</SelectItem>
                              <SelectItem value="5_to_10">5-10 years</SelectItem>
                              <SelectItem value="10_plus">10+ years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="totalPersonnel">Total Personnel</Label>
                          <Input
                            id="totalPersonnel"
                            type="number"
                            value={formData.totalPersonnel}
                            onChange={(e) => handleChange('totalPersonnel', e.target.value)}
                            placeholder="e.g., 50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="totalVehicles">Response Vehicles</Label>
                        <Input
                          id="totalVehicles"
                          type="number"
                          value={formData.totalVehicles}
                          onChange={(e) => handleChange('totalVehicles', e.target.value)}
                          placeholder="e.g., 10"
                        />
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="contactName">Contact Person *</Label>
                        <div className="relative">
                          <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="contactName"
                            className="pl-10"
                            value={formData.contactName}
                            onChange={(e) => handleChange('contactName', e.target.value)}
                            placeholder="Full name"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contactEmail">Email *</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="contactEmail"
                              type="email"
                              className="pl-10"
                              value={formData.contactEmail}
                              onChange={(e) => handleChange('contactEmail', e.target.value)}
                              placeholder="email@example.com"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactPhone">Office Phone *</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="contactPhone"
                              className="pl-10"
                              value={formData.contactPhone}
                              onChange={(e) => handleChange('contactPhone', e.target.value)}
                              placeholder="011 123 4567"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergencyPhone">24/7 Emergency Line *</Label>
                        <div className="relative">
                          <Siren className="absolute left-3 top-3 h-4 w-4 text-red-500" />
                          <Input
                            id="emergencyPhone"
                            className="pl-10 border-red-200"
                            value={formData.emergencyPhone}
                            onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                            placeholder="Emergency response number"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This number will be provided to users during emergencies
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Office Address *</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="address"
                            className="pl-10"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            placeholder="123 Main Street"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => handleChange('city', e.target.value)}
                            placeholder="Pretoria"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="province">Province *</Label>
                          <Select
                            value={formData.province}
                            onValueChange={(v) => handleChange('province', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select province..." />
                            </SelectTrigger>
                            <SelectContent>
                              {SA_PROVINCES.map((province) => (
                                <SelectItem key={province} value={province}>
                                  {province}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div className="space-y-3">
                        <Label>Services Offered *</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {SERVICES.map((service) => (
                            <div key={service.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={service.id}
                                checked={formData.services.includes(service.id)}
                                onCheckedChange={() => handleServiceToggle(service.id)}
                              />
                              <Label htmlFor={service.id} className="font-normal flex items-center gap-2">
                                <service.icon className="h-4 w-4 text-muted-foreground" />
                                {service.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Coverage Provinces *</Label>
                        <div className="flex flex-wrap gap-2">
                          {SA_PROVINCES.map((province) => (
                            <Badge
                              key={province}
                              variant={formData.coverageProvinces.includes(province) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => handleProvinceToggle(province)}
                            >
                              {province}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="coverageCities">Coverage Cities/Areas</Label>
                        <Textarea
                          id="coverageCities"
                          value={formData.coverageCities}
                          onChange={(e) => handleChange('coverageCities', e.target.value)}
                          placeholder="List the specific cities and suburbs you cover..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="coverageRadius">Coverage Radius (km)</Label>
                          <Select
                            value={formData.coverageRadius}
                            onValueChange={(v) => handleChange('coverageRadius', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10 km</SelectItem>
                              <SelectItem value="25">25 km</SelectItem>
                              <SelectItem value="50">50 km</SelectItem>
                              <SelectItem value="100">100 km</SelectItem>
                              <SelectItem value="unlimited">Unlimited</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="responseTimeMinutes">Avg. Response Time</Label>
                          <Select
                            value={formData.responseTimeMinutes}
                            onValueChange={(v) => handleChange('responseTimeMinutes', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">Under 5 minutes</SelectItem>
                              <SelectItem value="10">5-10 minutes</SelectItem>
                              <SelectItem value="15">10-15 minutes</SelectItem>
                              <SelectItem value="20">15-20 minutes</SelectItem>
                              <SelectItem value="30">20-30 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is24Hours"
                          checked={formData.is24Hours}
                          onCheckedChange={(c) => handleChange('is24Hours', !!c)}
                        />
                        <Label htmlFor="is24Hours" className="font-normal">
                          We provide 24/7 response services
                        </Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Company Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => handleChange('description', e.target.value)}
                          placeholder="Tell us about your company, experience, and what makes you stand out..."
                          rows={4}
                        />
                      </div>

                      <div className="border-t pt-4 space-y-3">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="verification"
                            checked={formData.agreedToVerification}
                            onCheckedChange={(c) => handleChange('agreedToVerification', !!c)}
                          />
                          <Label htmlFor="verification" className="text-sm font-normal leading-relaxed">
                            I consent to verification of our PSIRA registration and company details.
                            I confirm our company is legally registered and compliant with all security
                            industry regulations.
                          </Label>
                        </div>

                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="terms"
                            checked={formData.agreedToTerms}
                            onCheckedChange={(c) => handleChange('agreedToTerms', !!c)}
                          />
                          <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
                            I agree to the{' '}
                            <a href="/terms" className="text-primary underline">
                              Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="/privacy" className="text-primary underline">
                              Privacy Policy
                            </a>
                            . I confirm that all information provided is accurate.
                          </Label>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between pt-4">
                    {step > 1 ? (
                      <Button variant="outline" onClick={() => setStep(step - 1)}>
                        Back
                      </Button>
                    ) : (
                      <div />
                    )}

                    {step < 3 ? (
                      <Button
                        onClick={() => setStep(step + 1)}
                        disabled={
                          (step === 1 &&
                            (!formData.companyName ||
                              !formData.registrationNumber ||
                              !formData.psiraNumber)) ||
                          (step === 2 &&
                            (!formData.contactName ||
                              !formData.contactEmail ||
                              !formData.contactPhone ||
                              !formData.emergencyPhone ||
                              !formData.address ||
                              !formData.city ||
                              !formData.province))
                        }
                      >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={
                          isSubmitting ||
                          !formData.agreedToTerms ||
                          !formData.agreedToVerification ||
                          formData.services.length === 0 ||
                          formData.coverageProvinces.length === 0
                        }
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Button variant="link" onClick={() => navigate('/auth')}>
              Sign in to your dashboard
            </Button>
          </p>
        </div>
      </section>
    </div>
  );
}

export default ProviderSignupSecurity;
