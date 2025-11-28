import { useState } from 'react';
import { CreditCard, Plus, Trash2, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useSavedPaymentMethods,
  useAddPaymentMethod,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod,
  getCardBrandIcon,
  formatExpiryDate,
  SavedPaymentMethod,
} from '@/hooks/useSavedPaymentMethods';
import { cn } from '@/lib/utils';

interface SavedPaymentMethodsProps {
  selectedMethodId: string | null;
  onSelectMethod: (methodId: string | null) => void;
}

export function SavedPaymentMethods({
  selectedMethodId,
  onSelectMethod,
}: SavedPaymentMethodsProps) {
  const { data: paymentMethods = [], isLoading } = useSavedPaymentMethods();
  const addPaymentMethod = useAddPaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();
  const setDefaultPaymentMethod = useSetDefaultPaymentMethod();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  const handleAddCard = () => {
    // Extract last 4 digits
    const lastFour = newCard.cardNumber.slice(-4);

    // Detect card type from first digit
    const firstDigit = newCard.cardNumber.charAt(0);
    let cardType: SavedPaymentMethod['card_type'] = 'other';
    if (firstDigit === '4') cardType = 'visa';
    else if (firstDigit === '5') cardType = 'mastercard';
    else if (firstDigit === '3') cardType = 'amex';

    addPaymentMethod.mutate(
      {
        card_type: cardType,
        last_four: lastFour,
        expiry_month: parseInt(newCard.expiryMonth),
        expiry_year: parseInt(newCard.expiryYear),
        cardholder_name: newCard.cardholderName,
        is_default: paymentMethods.length === 0, // First card is default
      },
      {
        onSuccess: (data) => {
          setIsAddDialogOpen(false);
          setNewCard({
            cardNumber: '',
            cardholderName: '',
            expiryMonth: '',
            expiryYear: '',
            cvv: '',
          });
          onSelectMethod(data.id);
        },
      }
    );
  };

  const handleDeleteCard = (id: string) => {
    if (selectedMethodId === id) {
      onSelectMethod(null);
    }
    deletePaymentMethod.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Loading payment methods...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RadioGroup
        value={selectedMethodId || 'new'}
        onValueChange={(value) => onSelectMethod(value === 'new' ? null : value)}
      >
        {/* Saved Cards */}
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className={cn(
              'cursor-pointer transition-all',
              selectedMethodId === method.id
                ? 'border-primary ring-2 ring-primary'
                : 'hover:border-primary/50'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <RadioGroupItem value={method.id} id={method.id} />
                <div className="flex-1">
                  <Label htmlFor={method.id} className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {getCardBrandIcon(method.card_type)}
                      </span>
                      <span>•••• {method.last_four}</span>
                      {method.is_default && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {method.cardholder_name} • Expires{' '}
                      {formatExpiryDate(method.expiry_month, method.expiry_year)}
                    </p>
                  </Label>
                </div>
                <div className="flex gap-2">
                  {!method.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDefaultPaymentMethod.mutate(method.id);
                      }}
                      title="Set as default"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCard(method.id);
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* New Payment Option */}
        <Card
          className={cn(
            'cursor-pointer transition-all',
            selectedMethodId === null
              ? 'border-primary ring-2 ring-primary'
              : 'hover:border-primary/50'
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <RadioGroupItem value="new" id="new-payment" />
              <Label htmlFor="new-payment" className="cursor-pointer flex-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Pay with PayFast</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Card, EFT, SnapScan, or other payment methods
                </p>
              </Label>
            </div>
          </CardContent>
        </Card>
      </RadioGroup>

      {/* Add New Card Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add New Card
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Card</DialogTitle>
            <DialogDescription>
              Save a card for faster checkout. Your card details are stored securely.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={newCard.cardNumber}
                onChange={(e) =>
                  setNewCard({
                    ...newCard,
                    cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16),
                  })
                }
                maxLength={16}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                placeholder="John Smith"
                value={newCard.cardholderName}
                onChange={(e) =>
                  setNewCard({ ...newCard, cardholderName: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Expiry Month</Label>
                <Select
                  value={newCard.expiryMonth}
                  onValueChange={(value) =>
                    setNewCard({ ...newCard, expiryMonth: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem
                        key={month}
                        value={String(month).padStart(2, '0')}
                      >
                        {String(month).padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expiry Year</Label>
                <Select
                  value={newCard.expiryYear}
                  onValueChange={(value) =>
                    setNewCard({ ...newCard, expiryYear: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="YY" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="password"
                  placeholder="***"
                  value={newCard.cvv}
                  onChange={(e) =>
                    setNewCard({
                      ...newCard,
                      cvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                    })
                  }
                  maxLength={4}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCard}
              disabled={
                addPaymentMethod.isPending ||
                !newCard.cardNumber ||
                newCard.cardNumber.length < 15 ||
                !newCard.cardholderName ||
                !newCard.expiryMonth ||
                !newCard.expiryYear ||
                !newCard.cvv ||
                newCard.cvv.length < 3
              }
            >
              {addPaymentMethod.isPending ? 'Saving...' : 'Save Card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground text-center">
        🔒 Your payment information is encrypted and secure
      </p>
    </div>
  );
}
