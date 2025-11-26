import { useState, useEffect, useRef } from "react";
import { MapPin, Plus, Edit2, Trash2, Star, Navigation, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCustomerAddresses, CreateAddressInput, CustomerAddress } from "@/hooks/useCustomerAddresses";

interface AddressSelectorProps {
  selectedAddressId: string | null;
  onSelectAddress: (addressId: string) => void;
}

const ADDRESS_LABELS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "work", label: "Work", icon: "🏢" },
  { id: "other", label: "Other", icon: "📍" },
];

export function AddressSelector({ selectedAddressId, onSelectAddress }: AddressSelectorProps) {
  const {
    addresses,
    isLoading,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    geocodeAddress,
    isCreating,
    isUpdating,
  } = useCustomerAddresses();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);

  const [newAddress, setNewAddress] = useState<CreateAddressInput>({
    label: 'Home',
    street_address: '',
    apartment: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'South Africa',
    phone: '',
    delivery_instructions: '',
    is_default: false,
  });

  const addressInputRef = useRef<HTMLInputElement>(null);

  // Auto-select default address on load
  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const defaultAddr = addresses.find(a => a.is_default);
      if (defaultAddr) {
        onSelectAddress(defaultAddr.id);
      }
    }
  }, [addresses, selectedAddressId, onSelectAddress]);

  const resetForm = () => {
    setNewAddress({
      label: 'Home',
      street_address: '',
      apartment: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'South Africa',
      phone: '',
      delivery_instructions: '',
      is_default: false,
    });
  };

  const handleCreateAddress = async () => {
    // Geocode the address before saving
    setIsGeocodingAddress(true);
    const fullAddress = `${newAddress.street_address}, ${newAddress.city}, ${newAddress.state} ${newAddress.zip_code}, ${newAddress.country}`;
    const coords = await geocodeAddress(fullAddress);
    setIsGeocodingAddress(false);

    createAddress({
      ...newAddress,
      latitude: coords?.lat,
      longitude: coords?.lng,
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        resetForm();
      },
    });
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress) return;

    // Geocode if address changed
    setIsGeocodingAddress(true);
    const fullAddress = `${editingAddress.street_address}, ${editingAddress.city}, ${editingAddress.state} ${editingAddress.zip_code}, ${editingAddress.country}`;
    const coords = await geocodeAddress(fullAddress);
    setIsGeocodingAddress(false);

    updateAddress({
      id: editingAddress.id,
      label: editingAddress.label,
      street_address: editingAddress.street_address,
      apartment: editingAddress.apartment,
      city: editingAddress.city,
      state: editingAddress.state,
      zip_code: editingAddress.zip_code,
      phone: editingAddress.phone,
      delivery_instructions: editingAddress.delivery_instructions,
      latitude: coords?.lat || editingAddress.latitude,
      longitude: coords?.lng || editingAddress.longitude,
    }, {
      onSuccess: () => {
        setIsEditOpen(false);
        setEditingAddress(null);
      },
    });
  };

  const handleEditClick = (address: CustomerAddress) => {
    setEditingAddress(address);
    setIsEditOpen(true);
  };

  const handleDeleteAddress = (id: string) => {
    deleteAddress(id);
    if (selectedAddressId === id) {
      const remaining = addresses.filter(a => a.id !== id);
      if (remaining.length > 0) {
        onSelectAddress(remaining[0].id);
      }
    }
  };

  // Google Places Autocomplete initialization
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !addressInputRef.current) return;

    // Load Google Maps script if not already loaded
    if (!window.google?.maps?.places) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = initAutocomplete;
      document.head.appendChild(script);
    } else {
      initAutocomplete();
    }

    function initAutocomplete() {
      if (!addressInputRef.current || !window.google?.maps?.places) return;

      const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        componentRestrictions: { country: 'za' },
        fields: ['address_components', 'geometry', 'formatted_address'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;

        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let zipCode = '';

        place.address_components.forEach((component: google.maps.GeocoderAddressComponent) => {
          const type = component.types[0];
          switch (type) {
            case 'street_number':
              streetNumber = component.long_name;
              break;
            case 'route':
              route = component.long_name;
              break;
            case 'locality':
            case 'sublocality':
              city = component.long_name;
              break;
            case 'administrative_area_level_1':
              state = component.short_name;
              break;
            case 'postal_code':
              zipCode = component.long_name;
              break;
          }
        });

        const streetAddress = streetNumber ? `${streetNumber} ${route}` : route;

        setNewAddress(prev => ({
          ...prev,
          street_address: streetAddress,
          city,
          state,
          zip_code: zipCode,
          latitude: place.geometry?.location?.lat(),
          longitude: place.geometry?.location?.lng(),
        }));
      });
    }
  }, [isAddOpen]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Address
          </h3>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Delivery Address</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Address Label */}
                <div>
                  <Label>Address Label</Label>
                  <div className="flex gap-2 mt-2">
                    {ADDRESS_LABELS.map(({ id, label, icon }) => (
                      <Button
                        key={id}
                        type="button"
                        variant={newAddress.label === label ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewAddress({ ...newAddress, label })}
                      >
                        {icon} {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Street Address with Autocomplete */}
                <div>
                  <Label htmlFor="street_address">Street Address *</Label>
                  <Input
                    id="street_address"
                    ref={addressInputRef}
                    value={newAddress.street_address}
                    onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                    placeholder="Start typing your address..."
                    aria-label="Street address"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    <Navigation className="h-3 w-3 inline mr-1" />
                    Start typing for address suggestions
                  </p>
                </div>

                {/* Apartment/Unit */}
                <div>
                  <Label htmlFor="apartment">Apartment/Unit (optional)</Label>
                  <Input
                    id="apartment"
                    value={newAddress.apartment || ''}
                    onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                    placeholder="Apt 4B, Suite 200, etc."
                  />
                </div>

                {/* City and State */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Province *</Label>
                    <Input
                      id="state"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    />
                  </div>
                </div>

                {/* Zip Code and Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zip_code">Postal Code *</Label>
                    <Input
                      id="zip_code"
                      value={newAddress.zip_code}
                      onChange={(e) => setNewAddress({ ...newAddress, zip_code: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newAddress.phone || ''}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      placeholder="+27..."
                    />
                  </div>
                </div>

                {/* Delivery Instructions */}
                <div>
                  <Label htmlFor="delivery_instructions" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Delivery Instructions (optional)
                  </Label>
                  <Textarea
                    id="delivery_instructions"
                    value={newAddress.delivery_instructions || ''}
                    onChange={(e) => setNewAddress({ ...newAddress, delivery_instructions: e.target.value })}
                    placeholder="e.g., Ring doorbell twice, leave at gate, call on arrival..."
                    rows={2}
                  />
                </div>

                {/* Set as Default */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default"
                    checked={newAddress.is_default}
                    onCheckedChange={(checked) =>
                      setNewAddress({ ...newAddress, is_default: checked === true })
                    }
                  />
                  <label htmlFor="is_default" className="text-sm cursor-pointer">
                    Set as default address
                  </label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAddress}
                  disabled={
                    isCreating ||
                    isGeocodingAddress ||
                    !newAddress.street_address ||
                    !newAddress.city ||
                    !newAddress.state ||
                    !newAddress.zip_code
                  }
                >
                  {isCreating || isGeocodingAddress ? 'Saving...' : 'Save Address'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-8 border rounded-lg border-dashed">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No saved addresses</p>
            <Button variant="outline" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Address
            </Button>
          </div>
        ) : (
          <RadioGroup value={selectedAddressId || ''} onValueChange={onSelectAddress}>
            <div className="space-y-3">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedAddressId === address.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value={address.id} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{address.label}</span>
                      {address.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {address.street_address}
                      {address.apartment && `, ${address.apartment}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} {address.zip_code}
                    </p>
                    {address.phone && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📞 {address.phone}
                      </p>
                    )}
                    {address.delivery_instructions && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        📝 {address.delivery_instructions}
                      </p>
                    )}
                    {address.latitude && address.longitude && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Location verified
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!address.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.preventDefault();
                          setDefaultAddress(address.id);
                        }}
                        title="Set as default"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.preventDefault();
                        handleEditClick(address);
                      }}
                      title="Edit address"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => e.preventDefault()}
                          title="Delete address"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Address</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{address.label}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAddress(address.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        )}

        {/* Edit Address Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Address</DialogTitle>
            </DialogHeader>
            {editingAddress && (
              <div className="space-y-4">
                <div>
                  <Label>Address Label</Label>
                  <div className="flex gap-2 mt-2">
                    {ADDRESS_LABELS.map(({ id, label, icon }) => (
                      <Button
                        key={id}
                        type="button"
                        variant={editingAddress.label === label ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditingAddress({ ...editingAddress, label })}
                      >
                        {icon} {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit_street_address">Street Address *</Label>
                  <Input
                    id="edit_street_address"
                    value={editingAddress.street_address}
                    onChange={(e) => setEditingAddress({ ...editingAddress, street_address: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit_apartment">Apartment/Unit</Label>
                  <Input
                    id="edit_apartment"
                    value={editingAddress.apartment || ''}
                    onChange={(e) => setEditingAddress({ ...editingAddress, apartment: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_city">City *</Label>
                    <Input
                      id="edit_city"
                      value={editingAddress.city}
                      onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_state">Province *</Label>
                    <Input
                      id="edit_state"
                      value={editingAddress.state}
                      onChange={(e) => setEditingAddress({ ...editingAddress, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_zip_code">Postal Code *</Label>
                    <Input
                      id="edit_zip_code"
                      value={editingAddress.zip_code}
                      onChange={(e) => setEditingAddress({ ...editingAddress, zip_code: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_phone">Phone</Label>
                    <Input
                      id="edit_phone"
                      type="tel"
                      value={editingAddress.phone || ''}
                      onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit_delivery_instructions" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Delivery Instructions
                  </Label>
                  <Textarea
                    id="edit_delivery_instructions"
                    value={editingAddress.delivery_instructions || ''}
                    onChange={(e) => setEditingAddress({ ...editingAddress, delivery_instructions: e.target.value })}
                    placeholder="e.g., Ring doorbell twice, leave at gate..."
                    rows={2}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateAddress}
                disabled={isUpdating || isGeocodingAddress}
              >
                {isUpdating || isGeocodingAddress ? 'Saving...' : 'Update Address'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Add Google Maps types
declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: google.maps.places.AutocompleteOptions
          ) => google.maps.places.Autocomplete;
        };
      };
    };
  }
}
