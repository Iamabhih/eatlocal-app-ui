import { useState } from 'react';
import { Heart, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TipSelectorProps {
  subtotal: number;
  onTipChange: (tipAmount: number) => void;
  selectedTip?: number;
}

const TIP_PRESETS = [
  { label: 'No Tip', percentage: 0 },
  { label: '10%', percentage: 10 },
  { label: '15%', percentage: 15 },
  { label: '20%', percentage: 20 },
];

export function TipSelector({ subtotal, onTipChange, selectedTip = 0 }: TipSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(0);
  const [customAmount, setCustomAmount] = useState('');

  const handlePresetSelect = (percentage: number) => {
    setSelectedPreset(percentage);
    setCustomAmount('');
    const tipAmount = (subtotal * percentage) / 100;
    onTipChange(tipAmount);
  };

  const handleCustomAmountChange = (value: string) => {
    // Only allow numbers and single decimal point
    const sanitized = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setCustomAmount(sanitized);
    setSelectedPreset('custom');
    const amount = parseFloat(sanitized) || 0;
    onTipChange(amount);
  };

  const getPresetAmount = (percentage: number) => {
    return (subtotal * percentage) / 100;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Heart className="h-4 w-4 text-red-500" />
        <Label className="text-sm font-medium">Add a tip for your driver</Label>
      </div>

      <p className="text-xs text-muted-foreground">
        100% of your tip goes directly to your delivery driver
      </p>

      {/* Preset Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {TIP_PRESETS.map(({ label, percentage }) => {
          const isSelected = selectedPreset === percentage;
          const amount = getPresetAmount(percentage);

          return (
            <Button
              key={percentage}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'flex-col h-auto py-3 relative',
                isSelected && 'ring-2 ring-offset-2 ring-primary'
              )}
              onClick={() => handlePresetSelect(percentage)}
            >
              <span className="font-semibold">{label}</span>
              {percentage > 0 && (
                <span className="text-xs opacity-80">R{amount.toFixed(2)}</span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Custom Amount */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Custom amount"
            value={customAmount}
            onChange={(e) => handleCustomAmountChange(e.target.value)}
            className={cn(
              'pl-9',
              selectedPreset === 'custom' && 'ring-2 ring-primary'
            )}
          />
        </div>
        <span className="text-sm text-muted-foreground">ZAR</span>
      </div>

      {/* Selected Tip Summary */}
      {selectedTip > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-primary">
              <Heart className="h-4 w-4 fill-current" />
              <span>Tip for driver</span>
            </span>
            <span className="font-semibold text-primary">R{selectedTip.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
