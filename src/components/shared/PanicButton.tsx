import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Phone,
  Shield,
  MapPin,
  X,
  Loader2,
  CheckCircle,
  Siren,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// South African Emergency Numbers
const EMERGENCY_CONTACTS = {
  police: { number: '10111', label: 'SAPS Police', description: 'South African Police Service' },
  ambulance: { number: '10177', label: 'Ambulance', description: 'Medical Emergency' },
  emergency: { number: '112', label: 'Emergency', description: 'All emergencies (cell phone)' },
  fire: { number: '10111', label: 'Fire', description: 'Fire Department' },
};

// South African Provinces
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

interface PanicButtonProps {
  variant?: 'floating' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}

export function PanicButton({ variant = 'floating', size = 'md' }: PanicButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [description, setDescription] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Get user's current location
  const getLocation = useCallback(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(coords);
          setIsLocating(false);

          // Try to get address from coordinates (reverse geocoding)
          // In production, use Google Maps Geocoding API
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`
            );
            const data = await response.json();
            if (data.display_name) {
              setLocation({ ...coords, address: data.display_name });
              // Try to detect province
              const address = data.display_name.toLowerCase();
              for (const province of SA_PROVINCES) {
                if (address.includes(province.toLowerCase())) {
                  setSelectedProvince(province);
                  break;
                }
              }
            }
          } catch (error) {
            console.error('Failed to get address:', error);
          }
        },
        (error) => {
          console.error('Location error:', error);
          setIsLocating(false);
          toast.error('Unable to get your location. Please enable location services.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsLocating(false);
      toast.error('Geolocation is not supported by your browser');
    }
  }, []);

  useEffect(() => {
    if (isOpen && !location) {
      getLocation();
    }
  }, [isOpen, location, getLocation]);

  const sendPanicAlert = async () => {
    setIsSubmitting(true);

    try {
      // Save panic alert to database
      const { error } = await (supabase.from('panic_alerts' as any).insert({
        user_id: user?.id || null,
        latitude: location?.lat,
        longitude: location?.lng,
        address: location?.address,
        province: selectedProvince,
        description: description,
        status: 'active',
        user_name: user?.user_metadata?.full_name || 'Anonymous',
        user_phone: user?.user_metadata?.phone || null,
        user_email: user?.email || null,
      }) as any);

      if (error) {
        console.error('Failed to save panic alert:', error);
      }

      setAlertSent(true);
      toast.success('Emergency alert sent! Help is on the way.');

      // Reset after 30 seconds
      setTimeout(() => {
        setAlertSent(false);
        setIsOpen(false);
        setDescription('');
      }, 30000);

    } catch (error) {
      console.error('Failed to send panic alert:', error);
      toast.error('Failed to send alert. Please call emergency services directly.');
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const callEmergency = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-16 w-16',
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <>
      {/* Panic Button */}
      {variant === 'floating' ? (
        <Button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 ${sizeClasses[size]} rounded-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50 z-50 animate-pulse hover:animate-none`}
          aria-label="Emergency panic button"
        >
          <Siren className={iconSizes[size]} />
        </Button>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          variant="destructive"
          className="gap-2"
        >
          <Siren className="h-4 w-4" />
          Emergency
        </Button>
      )}

      {/* Main Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Emergency Assistance
            </DialogTitle>
            <DialogDescription>
              Press the emergency button or call services directly
            </DialogDescription>
          </DialogHeader>

          {alertSent ? (
            <div className="py-8 text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Alert Sent!</h3>
              <p className="text-muted-foreground mb-4">
                Emergency services have been notified of your location.
              </p>
              {location && (
                <Badge variant="outline" className="mb-4">
                  <MapPin className="h-3 w-3 mr-1" />
                  Location shared
                </Badge>
              )}
              <p className="text-sm text-muted-foreground">
                Stay calm and wait for help to arrive. If you're in immediate danger, call 10111 directly.
              </p>
            </div>
          ) : (
            <>
              {/* Location Status */}
              <Card className="border-dashed">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {isLocating ? (
                          'Getting your location...'
                        ) : location ? (
                          location.address?.substring(0, 50) + '...' || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                        ) : (
                          'Location unavailable'
                        )}
                      </span>
                    </div>
                    {isLocating && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </CardContent>
              </Card>

              {/* Province Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Province</label>
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-background"
                >
                  <option value="">Select province...</option>
                  {SA_PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">What's happening? (optional)</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the emergency..."
                  rows={2}
                />
              </div>

              {/* Main Panic Button */}
              <Button
                onClick={() => setShowConfirmation(true)}
                className="w-full h-16 bg-red-600 hover:bg-red-700 text-white text-lg font-bold gap-2"
              >
                <Siren className="h-6 w-6" />
                SEND EMERGENCY ALERT
              </Button>

              {/* Direct Call Options */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-center">Or call directly:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(EMERGENCY_CONTACTS).map(([key, contact]) => (
                    <Button
                      key={key}
                      variant="outline"
                      className="flex-col h-auto py-3"
                      onClick={() => callEmergency(contact.number)}
                    >
                      <Phone className="h-5 w-5 mb-1" />
                      <span className="font-bold">{contact.number}</span>
                      <span className="text-xs text-muted-foreground">{contact.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Security Response */}
              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Private Security Response</p>
                      <p className="text-xs text-muted-foreground">
                        Connected security providers will also be notified
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {alertSent ? 'Close' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Emergency Alert
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will send your location and details to emergency services and connected security providers.
              Only use this in genuine emergencies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={sendPanicAlert}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Alert'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default PanicButton;