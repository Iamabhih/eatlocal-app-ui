import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Check,
  ArrowRight,
  Clock,
  TrendingUp,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  User,
  Car,
  Bike,
  Package,
  Zap,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

const VEHICLE_TYPES = [
  { id: 'bicycle', label: 'Bicycle', icon: Bike },
  { id: 'motorcycle', label: 'Motorcycle/Scooter', icon: Bike },
  { id: 'car', label: 'Car', icon: Car },
  { id: 'bakkie', label: 'Bakkie/Van', icon: Truck },
];

const benefits = [
  {
    icon: DollarSign,
    title: 'Earn Your Way',
    description: 'Keep 100% of your tips and earn competitive rates',
  },
  {
    icon: Clock,
    title: 'Flexible Hours',
    description: 'Work when you want, as much as you want',
  },
  {
    icon: Zap,
    title: 'Weekly Payouts',
    description: 'Get paid every week directly to your bank',
  },
  {
    icon: TrendingUp,
    title: 'Growth Opportunities',
    description: 'Access bonuses, incentives, and career growth',
  },
];

export function ProviderSignupDelivery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    dateOfBirth: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    vehicleType: '',
    vehicleRegistration: '',
    licenseNumber: '',
    hasInsurance: false,
    bankName: '',
    accountNumber: '',
    branchCode: '',
    availability: [] as string[],
    experienceYears: '',
    agreedToTerms: false,
    agreedToBackgroundCheck: false,
  });

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvailabilityToggle = (day: string) => {
    const current = formData.availability;
    if (current.includes(day)) {
      handleChange('availability', current.filter((d) => d !== day));
    } else {
      handleChange('availability', [...current, day]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.agreedToTerms || !formData.agreedToBackgroundCheck) {
      toast.error('Please agree to all terms and conditions');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase.from('provider_applications' as any).insert({
        user_id: user?.id || null,
        provider_type: 'delivery',
        business_name: formData.fullName,
        business_type: 'Delivery Partner',
        contact_name: formData.fullName,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        postal_code: formData.postalCode,
        status: 'pending',
        documents: {
          id_number: formData.idNumber,
          date_of_birth: formData.dateOfBirth,
          vehicle_type: formData.vehicleType,
          vehicle_registration: formData.vehicleRegistration,
          license_number: formData.licenseNumber,
          has_insurance: formData.hasInsurance,
          bank_name: formData.bankName,
          account_number: formData.accountNumber,
          branch_code: formData.branchCode,
          availability: formData.availability,
          experience_years: formData.experienceYears,
        },
      }) as any);

      if (error) throw error;

      toast.success('Application submitted successfully!');
      setStep(4);
    } catch (error) {
      // Error logged via toast notification - no console.error in production
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="min-h-screen bg-background">
      <Navbar type="customer" />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-green-600 to-teal-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-white/20 text-white">Delivery Partner</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Deliver with Smash Local
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Join our delivery fleet and earn money on your own schedule.
              Deliver food, groceries, and packages across South Africa.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Badge variant="secondary" className="text-sm py-2 px-4">
                <Check className="h-4 w-4 mr-2" /> Flexible hours
              </Badge>
              <Badge variant="secondary" className="text-sm py-2 px-4">
                <Check className="h-4 w-4 mr-2" /> Weekly payouts
              </Badge>
              <Badge variant="secondary" className="text-sm py-2 px-4">
                <Check className="h-4 w-4 mr-2" /> Keep your tips
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
                    Thank you for applying to become a Smash Local delivery partner.
                  </p>
                  <p className="text-sm text-muted-foreground mb-8">
                    We'll review your application and conduct a background check.
                    You'll hear from us within 3-5 business days.
                  </p>
                  <Button onClick={() => navigate('/')}>Return to Home</Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {step === 1 && 'Personal Information'}
                    {step === 2 && 'Vehicle & License'}
                    {step === 3 && 'Banking & Availability'}
                  </CardTitle>
                  <CardDescription>
                    {step === 1 && 'Tell us about yourself'}
                    {step === 2 && 'Your vehicle and driver details'}
                    {step === 3 && 'How we pay you and when you work'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {step === 1 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name (as on ID) *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="fullName"
                            className="pl-10"
                            value={formData.fullName}
                            onChange={(e) => handleChange('fullName', e.target.value)}
                            placeholder="Full name"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="idNumber">SA ID Number *</Label>
                          <Input
                            id="idNumber"
                            value={formData.idNumber}
                            onChange={(e) => handleChange('idNumber', e.target.value)}
                            placeholder="13 digit ID number"
                            maxLength={13}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
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
                          <Label htmlFor="contactPhone">Phone *</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="contactPhone"
                              className="pl-10"
                              value={formData.contactPhone}
                              onChange={(e) => handleChange('contactPhone', e.target.value)}
                              placeholder="082 123 4567"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Street Address *</Label>
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
                            placeholder="Johannesburg"
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

                  {step === 2 && (
                    <>
                      <div className="space-y-3">
                        <Label>Vehicle Type *</Label>
                        <RadioGroup
                          value={formData.vehicleType}
                          onValueChange={(v) => handleChange('vehicleType', v)}
                          className="grid grid-cols-2 gap-4"
                        >
                          {VEHICLE_TYPES.map((vehicle) => (
                            <div key={vehicle.id}>
                              <RadioGroupItem
                                value={vehicle.id}
                                id={vehicle.id}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={vehicle.id}
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <vehicle.icon className="mb-2 h-6 w-6" />
                                {vehicle.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {formData.vehicleType && formData.vehicleType !== 'bicycle' && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="vehicleRegistration">Vehicle Registration</Label>
                              <Input
                                id="vehicleRegistration"
                                value={formData.vehicleRegistration}
                                onChange={(e) => handleChange('vehicleRegistration', e.target.value)}
                                placeholder="CA 123-456"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="licenseNumber">Driver's License Number *</Label>
                              <Input
                                id="licenseNumber"
                                value={formData.licenseNumber}
                                onChange={(e) => handleChange('licenseNumber', e.target.value)}
                                placeholder="License number"
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="hasInsurance"
                              checked={formData.hasInsurance}
                              onCheckedChange={(c) => handleChange('hasInsurance', !!c)}
                            />
                            <Label htmlFor="hasInsurance" className="font-normal">
                              I have valid vehicle insurance
                            </Label>
                          </div>
                        </>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="experienceYears">Delivery Experience</Label>
                        <Select
                          value={formData.experienceYears}
                          onValueChange={(v) => handleChange('experienceYears', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No prior experience</SelectItem>
                            <SelectItem value="less_than_1">Less than 1 year</SelectItem>
                            <SelectItem value="1_to_3">1-3 years</SelectItem>
                            <SelectItem value="3_plus">3+ years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div className="space-y-4">
                        <Label>Banking Details (for payouts)</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name *</Label>
                            <Select
                              value={formData.bankName}
                              onValueChange={(v) => handleChange('bankName', v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select bank..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fnb">FNB</SelectItem>
                                <SelectItem value="standard_bank">Standard Bank</SelectItem>
                                <SelectItem value="absa">ABSA</SelectItem>
                                <SelectItem value="nedbank">Nedbank</SelectItem>
                                <SelectItem value="capitec">Capitec</SelectItem>
                                <SelectItem value="investec">Investec</SelectItem>
                                <SelectItem value="tymebank">TymeBank</SelectItem>
                                <SelectItem value="african_bank">African Bank</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="branchCode">Branch Code *</Label>
                            <Input
                              id="branchCode"
                              value={formData.branchCode}
                              onChange={(e) => handleChange('branchCode', e.target.value)}
                              placeholder="250655"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">Account Number *</Label>
                          <Input
                            id="accountNumber"
                            value={formData.accountNumber}
                            onChange={(e) => handleChange('accountNumber', e.target.value)}
                            placeholder="Account number"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Availability (select days you can work) *</Label>
                        <div className="flex flex-wrap gap-2">
                          {days.map((day) => (
                            <Badge
                              key={day}
                              variant={formData.availability.includes(day) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => handleAvailabilityToggle(day)}
                            >
                              {day}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-3">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="backgroundCheck"
                            checked={formData.agreedToBackgroundCheck}
                            onCheckedChange={(c) => handleChange('agreedToBackgroundCheck', !!c)}
                          />
                          <Label htmlFor="backgroundCheck" className="text-sm font-normal leading-relaxed">
                            I consent to a background check and verify that I have no criminal record
                            that would prevent me from performing delivery services.
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
                            (!formData.fullName ||
                              !formData.idNumber ||
                              !formData.contactEmail ||
                              !formData.contactPhone ||
                              !formData.address ||
                              !formData.city ||
                              !formData.province)) ||
                          (step === 2 && !formData.vehicleType)
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
                          !formData.agreedToBackgroundCheck ||
                          !formData.bankName ||
                          !formData.accountNumber ||
                          formData.availability.length === 0
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

export default ProviderSignupDelivery;
