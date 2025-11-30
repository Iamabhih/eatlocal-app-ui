import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Car, User, FileText, CreditCard, CheckCircle, ArrowLeft, ArrowRight, Loader2,
  Shield, Calendar, Phone, Mail, MapPin
} from 'lucide-react';

const VEHICLE_TYPES = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'suv', label: 'SUV' },
  { value: 'van', label: 'Van/Minibus' },
  { value: 'luxury', label: 'Luxury Vehicle' },
];

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Vehicle Details', icon: Car },
  { id: 3, title: 'Documents', icon: FileText },
  { id: 4, title: 'Banking', icon: CreditCard },
];

export default function DriverRegistration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    // Personal Info
    full_name: '',
    phone: '',
    email: user?.email || '',
    id_number: '',
    date_of_birth: '',
    address: '',
    city: '',
    province: '',

    // Vehicle Details
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_color: '',
    vehicle_plate: '',
    vehicle_type: '',

    // Documents
    license_number: '',
    license_expiry: '',
    insurance_number: '',
    insurance_expiry: '',

    // Banking
    bank_name: '',
    account_number: '',
    branch_code: '',
    account_holder_name: '',

    // Consents
    background_check_consent: false,
    terms_consent: false,
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const submitApplication = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Create driver record
      const { data: driver, error: driverError } = await (supabase
        .from('drivers')
        .insert({
          user_id: user.id,
          license_number: formData.license_number,
          license_expiry: formData.license_expiry || null,
          vehicle_make: formData.vehicle_make,
          vehicle_model: formData.vehicle_model,
          vehicle_year: parseInt(formData.vehicle_year),
          vehicle_color: formData.vehicle_color,
          vehicle_license_plate: formData.vehicle_plate,
          vehicle_type: formData.vehicle_type,
          insurance_number: formData.insurance_number || null,
          insurance_expiry: formData.insurance_expiry || null,
          is_verified: false,
          is_active: false,
        } as any)
        .select()
        .single() as any);

      if (driverError) throw driverError;

      // Update profile
      await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq('id', user.id);

      // Add driver role
      await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: 'driver',
        });

      return driver;
    },
    onSuccess: () => {
      toast({
        title: 'Application Submitted!',
        description: 'Your driver application has been submitted for review.',
      });
      navigate('/driver/pending');
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return formData.full_name && formData.phone && formData.id_number && formData.date_of_birth;
      case 2:
        return formData.vehicle_make && formData.vehicle_model && formData.vehicle_year &&
               formData.vehicle_color && formData.vehicle_plate && formData.vehicle_type;
      case 3:
        return formData.license_number && formData.license_expiry;
      case 4:
        return formData.bank_name && formData.account_number && formData.branch_code &&
               formData.background_check_consent && formData.terms_consent;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      submitApplication.mutate();
    }
  };

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-2">Become a Driver</h1>
          <p className="text-muted-foreground">
            Join our ride-sharing platform and start earning
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    isActive ? 'text-primary' : isCompleted ? 'text-green-500' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-muted'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Tell us about yourself'}
              {currentStep === 2 && 'Provide your vehicle information'}
              {currentStep === 3 && 'Upload your documents'}
              {currentStep === 4 && 'Set up your payment details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => updateFormData('full_name', e.target.value)}
                      placeholder="As on your ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      placeholder="+27 XX XXX XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_number">SA ID Number *</Label>
                    <Input
                      id="id_number"
                      value={formData.id_number}
                      onChange={(e) => updateFormData('id_number', e.target.value)}
                      placeholder="13-digit ID number"
                      maxLength={13}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => updateFormData('date_of_birth', e.target.value)}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    placeholder="Street address"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Province</Label>
                    <Select value={formData.province} onValueChange={(v) => updateFormData('province', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gauteng">Gauteng</SelectItem>
                        <SelectItem value="western_cape">Western Cape</SelectItem>
                        <SelectItem value="kwazulu_natal">KwaZulu-Natal</SelectItem>
                        <SelectItem value="eastern_cape">Eastern Cape</SelectItem>
                        <SelectItem value="free_state">Free State</SelectItem>
                        <SelectItem value="limpopo">Limpopo</SelectItem>
                        <SelectItem value="mpumalanga">Mpumalanga</SelectItem>
                        <SelectItem value="north_west">North West</SelectItem>
                        <SelectItem value="northern_cape">Northern Cape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Vehicle Details */}
            {currentStep === 2 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_make">Vehicle Make *</Label>
                  <Input
                    id="vehicle_make"
                    value={formData.vehicle_make}
                    onChange={(e) => updateFormData('vehicle_make', e.target.value)}
                    placeholder="e.g., Toyota"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_model">Vehicle Model *</Label>
                  <Input
                    id="vehicle_model"
                    value={formData.vehicle_model}
                    onChange={(e) => updateFormData('vehicle_model', e.target.value)}
                    placeholder="e.g., Corolla"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_year">Year *</Label>
                  <Input
                    id="vehicle_year"
                    type="number"
                    min="2010"
                    max={new Date().getFullYear()}
                    value={formData.vehicle_year}
                    onChange={(e) => updateFormData('vehicle_year', e.target.value)}
                    placeholder="e.g., 2020"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_color">Color *</Label>
                  <Input
                    id="vehicle_color"
                    value={formData.vehicle_color}
                    onChange={(e) => updateFormData('vehicle_color', e.target.value)}
                    placeholder="e.g., White"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_plate">License Plate *</Label>
                  <Input
                    id="vehicle_plate"
                    value={formData.vehicle_plate}
                    onChange={(e) => updateFormData('vehicle_plate', e.target.value.toUpperCase())}
                    placeholder="e.g., ABC 123 GP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                  <Select value={formData.vehicle_type} onValueChange={(v) => updateFormData('vehicle_type', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Documents */}
            {currentStep === 3 && (
              <>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Your documents will be verified by our team. This usually takes 1-2 business days.
                  </AlertDescription>
                </Alert>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="license_number">Driver's License Number *</Label>
                    <Input
                      id="license_number"
                      value={formData.license_number}
                      onChange={(e) => updateFormData('license_number', e.target.value)}
                      placeholder="License number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_expiry">License Expiry Date *</Label>
                    <Input
                      id="license_expiry"
                      type="date"
                      value={formData.license_expiry}
                      onChange={(e) => updateFormData('license_expiry', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insurance_number">Vehicle Insurance Number</Label>
                    <Input
                      id="insurance_number"
                      value={formData.insurance_number}
                      onChange={(e) => updateFormData('insurance_number', e.target.value)}
                      placeholder="Insurance policy number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insurance_expiry">Insurance Expiry Date</Label>
                    <Input
                      id="insurance_expiry"
                      type="date"
                      value={formData.insurance_expiry}
                      onChange={(e) => updateFormData('insurance_expiry', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Banking */}
            {currentStep === 4 && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name *</Label>
                    <Select value={formData.bank_name} onValueChange={(v) => updateFormData('bank_name', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
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
                    <Label htmlFor="account_holder_name">Account Holder Name *</Label>
                    <Input
                      id="account_holder_name"
                      value={formData.account_holder_name}
                      onChange={(e) => updateFormData('account_holder_name', e.target.value)}
                      placeholder="As on bank account"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number *</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => updateFormData('account_number', e.target.value)}
                      placeholder="Bank account number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch_code">Branch Code *</Label>
                    <Input
                      id="branch_code"
                      value={formData.branch_code}
                      onChange={(e) => updateFormData('branch_code', e.target.value)}
                      placeholder="6-digit code"
                      maxLength={6}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="background_check"
                      checked={formData.background_check_consent}
                      onCheckedChange={(checked) => updateFormData('background_check_consent', checked)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="background_check" className="font-medium">
                        Background Check Consent *
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I consent to a background check being conducted for verification purposes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={formData.terms_consent}
                      onCheckedChange={(checked) => updateFormData('terms_consent', checked)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="terms" className="font-medium">
                        Terms & Conditions *
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I agree to the{' '}
                        <Link to="/terms" className="text-primary hover:underline">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={!validateStep() || submitApplication.isPending}
              >
                {submitApplication.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : currentStep === 4 ? (
                  <>
                    Submit Application
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
