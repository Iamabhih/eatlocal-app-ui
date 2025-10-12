import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCustomerAddresses } from "@/hooks/useCustomerAddresses";

interface AddressSelectorProps {
  selectedAddressId: string | null;
  onSelectAddress: (addressId: string) => void;
}

export function AddressSelector({ selectedAddressId, onSelectAddress }: AddressSelectorProps) {
  const { addresses, createAddress } = useCustomerAddresses();
  const [isOpen, setIsOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  const handleCreateAddress = () => {
    createAddress(newAddress, {
      onSuccess: () => {
        setIsOpen(false);
        setNewAddress({ label: '', street_address: '', city: '', state: '', zip_code: '' });
      },
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Address
          </h3>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Delivery Address</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Label (e.g., Home, Work)</Label>
                  <Input
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    placeholder="Home"
                  />
                </div>
                <div>
                  <Label>Street Address</Label>
                  <Input
                    value={newAddress.street_address}
                    onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Zip Code</Label>
                  <Input
                    value={newAddress.zip_code}
                    onChange={(e) => setNewAddress({ ...newAddress, zip_code: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateAddress} className="w-full">
                  Save Address
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {addresses.length === 0 ? (
          <p className="text-muted-foreground text-sm">No saved addresses. Add one to continue.</p>
        ) : (
          <RadioGroup value={selectedAddressId || ''} onValueChange={onSelectAddress}>
            <div className="space-y-2">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <RadioGroupItem value={address.id} />
                  <div className="flex-1">
                    <p className="font-medium">{address.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {address.street_address}, {address.city}, {address.state} {address.zip_code}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}
