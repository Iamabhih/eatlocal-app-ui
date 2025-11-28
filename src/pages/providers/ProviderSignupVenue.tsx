import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Check,
  ArrowRight,
  Clock,
  TrendingUp,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  PartyPopper,
  Music,
  Sparkles,
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

const VENUE_TYPES = [
  'Conference Center',
  'Event Hall',
  'Wedding Venue',
  'Restaurant/Bar',
  'Outdoor Space',
  'Theater/Auditorium',
  'Sports Facility',
  'Art Gallery',
  'Club/Nightlife',
  'Rooftop',
  'Beach Venue',
  'Garden/Estate',
  'Hotel Ballroom',
  'Museum',
  'Cultural Center',
];

const EVENT_TYPES = [
  'Weddings',
  'Corporate Events',
  'Conferences',
  'Parties',
  'Concerts',
  'Exhibitions',
  'Workshops',
  'Product Launches',
  'Team Building',
  'Networking Events',
  'Award Ceremonies',
  'Graduations',
];

const AMENITIES = [
  'Audio/Visual Equipment',
  'Catering On-site',
  'Outside Catering Allowed',
  'Parking',
  'WiFi',
  'Air Conditioning',
  'Stage/Platform',
  'Dance Floor',
  'Outdoor Area',
  'Kitchen Facilities',
  'Bridal Suite',
  'Green Room',
  'Security',
  'Disability Access',
];

const benefits = [
  {
    icon: Calendar,
    title: 'Online Bookings',
    description: 'Accept bookings 24/7 through our platform',
  },
  {
    icon: TrendingUp,
    title: 'Increase Revenue',
    description: 'Reach event planners across South Africa',
  },
  {
    icon: Sparkles,
    title: 'Showcase Your Space',
    description: 'Beautiful listings with photos and virtual tours',
  },
  {
    icon: Users,
    title: 'Event Support',
    description: 'Connect with caterers, DJs, and decorators',
  },
];

export function ProviderSignupVenue() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    venueType: '',
    registrationNumber: '',
    vatNumber: '',
    contactName: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    description: '',
    capacity: '',
    minCapacity: '',
    eventTypes: [] as string[],
    amenities: [] as string[],
    agreedToTerms: false,
  });

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEventTypeToggle = (type: string) => {
    const current = formData.eventTypes;
    if (current.includes(type)) {
      handleChange('eventTypes', current.filter((t) => t !== type));
    } else {
      handleChange('eventTypes', [...current, type]);
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    const current = formData.amenities;
    if (current.includes(amenity)) {
      handleChange('amenities', current.filter((a) => a !== amenity));
    } else {
      handleChange('amenities', [...current, amenity]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('provider_applications').insert({
        user_id: user?.id || null,
        provider_type: 'venue',
        business_name: formData.businessName,
        business_type: formData.venueType,
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
          description: formData.description,
          capacity: formData.capacity,
          min_capacity: formData.minCapacity,
          event_types: formData.eventTypes,
          amenities: formData.amenities,
        },
      });

      if (error) throw error;

      toast.success('Application submitted successfully!');
      setStep(4);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar type="customer" />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-white/20 text-white">Venue Partner</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              List Your Venue on Smash Local
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Connect with event planners, wedding coordinators, and corporate clients
              looking for the perfect venue across South Africa.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Badge variant="secondary" className="text-sm py-2 px-4">
                <Check className="h-4 w-4 mr-2" /> Free listing
              </Badge>
              <Badge variant="secondary" className="text-sm py-2 px-4">
                <Check className="h-4 w-4 mr-2" /> Instant inquiries
              </Badge>
              <Badge variant="secondary" className="text-sm py-2 px-4">
                <Check className="h-4 w-4 mr-2" /> Calendar sync
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
                  <p className="text-muted-foreground mb-8">
                    Thank you for applying to list your venue on Smash Local.
                    Our team will review your application and contact you within 2-3 business days.
                  </p>
                  <Button onClick={() => navigate('/')}>Return to Home</Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {step === 1 && 'Venue Information'}
                    {step === 2 && 'Contact & Location'}
                    {step === 3 && 'Venue Details'}
                  </CardTitle>
                  <CardDescription>
                    {step === 1 && 'Tell us about your venue'}
                    {step === 2 && 'Where is your venue located?'}
                    {step === 3 && 'Additional details about your venue'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {step === 1 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Venue Name *</Label>
                        <Input
                          id="businessName"
                          value={formData.businessName}
                          onChange={(e) => handleChange('businessName', e.target.value)}
                          placeholder="e.g., The Grand Ballroom"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="venueType">Venue Type *</Label>
                        <Select
                          value={formData.venueType}
                          onValueChange={(v) => handleChange('venueType', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {VENUE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Event Types Hosted *</Label>
                        <div className="flex flex-wrap gap-2">
                          {EVENT_TYPES.map((type) => (
                            <Badge
                              key={type}
                              variant={formData.eventTypes.includes(type) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => handleEventTypeToggle(type)}
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="registrationNumber">Business Registration No.</Label>
                          <Input
                            id="registrationNumber"
                            value={formData.registrationNumber}
                            onChange={(e) => handleChange('registrationNumber', e.target.value)}
                            placeholder="Optional"
                          />
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
                            placeholder="Durban"
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

                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={(e) => handleChange('postalCode', e.target.value)}
                          placeholder="4001"
                          className="w-32"
                        />
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="description">Venue Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => handleChange('description', e.target.value)}
                          placeholder="Describe your venue, its atmosphere, and what makes it special for events..."
                          rows={4}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="minCapacity">Minimum Capacity</Label>
                          <div className="relative">
                            <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="minCapacity"
                              type="number"
                              className="pl-10"
                              value={formData.minCapacity}
                              onChange={(e) => handleChange('minCapacity', e.target.value)}
                              placeholder="10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="capacity">Maximum Capacity</Label>
                          <div className="relative">
                            <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="capacity"
                              type="number"
                              className="pl-10"
                              value={formData.capacity}
                              onChange={(e) => handleChange('capacity', e.target.value)}
                              placeholder="500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Amenities & Features</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {AMENITIES.map((amenity) => (
                            <div key={amenity} className="flex items-center space-x-2">
                              <Checkbox
                                id={amenity}
                                checked={formData.amenities.includes(amenity)}
                                onCheckedChange={() => handleAmenityToggle(amenity)}
                              />
                              <Label htmlFor={amenity} className="font-normal">
                                {amenity}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-3">
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
                          (step === 1 && (!formData.businessName || !formData.venueType || formData.eventTypes.length === 0)) ||
                          (step === 2 &&
                            (!formData.contactName ||
                              !formData.contactEmail ||
                              !formData.contactPhone ||
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
                        disabled={isSubmitting || !formData.agreedToTerms}
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

export default ProviderSignupVenue;
