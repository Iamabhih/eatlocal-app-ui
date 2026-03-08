/**
 * Menu Item Customization Modal
 * Allows customers to select options/modifiers before adding to cart
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface OptionGroup {
  id: string;
  name: string;
  description?: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  sort_order: number;
  options: Option[];
}

interface Option {
  id: string;
  name: string;
  price_modifier: number;
  is_default: boolean;
  is_available: boolean;
  sort_order: number;
}

interface MenuItemCustomizationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
  };
  onAddToCart: (item: {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    specialInstructions?: string;
    selectedOptions: Array<{ optionId: string; name: string; priceModifier: number }>;
  }) => void;
}

export function MenuItemCustomization({
  open,
  onOpenChange,
  menuItem,
  onAddToCart,
}: MenuItemCustomizationProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Map<string, Set<string>>>(new Map());
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Fetch option groups for this menu item
  const { data: optionGroups = [] } = useQuery({
    queryKey: ['menu-item-options', menuItem.id],
    queryFn: async () => {
      const { data: groups } = await (supabase as any)
        .from('menu_item_option_groups')
        .select(`
          id, name, description, is_required, min_selections, max_selections, sort_order,
          menu_item_options(id, name, price_modifier, is_default, is_available, sort_order)
        `)
        .eq('menu_item_id', menuItem.id)
        .eq('is_active', true)
        .order('sort_order');

      return (groups || []).map((g: any) => ({
        ...g,
        options: (g.menu_item_options || [])
          .filter((o: any) => o.is_available)
          .sort((a: any, b: any) => a.sort_order - b.sort_order),
      })) as OptionGroup[];
    },
    enabled: open,
  });

  // Initialize defaults when option groups load
  useEffect(() => {
    if (optionGroups.length > 0) {
      const defaults = new Map<string, Set<string>>();
      optionGroups.forEach((group) => {
        const defaultOpts = group.options.filter(o => o.is_default).map(o => o.id);
        if (defaultOpts.length > 0) {
          defaults.set(group.id, new Set(defaultOpts));
        }
      });
      setSelectedOptions(defaults);
    }
  }, [optionGroups]);

  const handleSingleSelect = (groupId: string, optionId: string) => {
    const newMap = new Map(selectedOptions);
    newMap.set(groupId, new Set([optionId]));
    setSelectedOptions(newMap);
  };

  const handleMultiSelect = (groupId: string, optionId: string, checked: boolean, maxSelections: number) => {
    const newMap = new Map(selectedOptions);
    const current = new Set(newMap.get(groupId) || []);

    if (checked) {
      if (current.size < maxSelections) {
        current.add(optionId);
      }
    } else {
      current.delete(optionId);
    }

    newMap.set(groupId, current);
    setSelectedOptions(newMap);
  };

  // Calculate total price with modifiers
  const getModifierTotal = (): number => {
    let total = 0;
    selectedOptions.forEach((optionIds, groupId) => {
      const group = optionGroups.find(g => g.id === groupId);
      if (group) {
        optionIds.forEach(optId => {
          const opt = group.options.find(o => o.id === optId);
          if (opt) total += Number(opt.price_modifier);
        });
      }
    });
    return total;
  };

  const totalPrice = (Number(menuItem.price) + getModifierTotal()) * quantity;

  // Validation: check required groups
  const isValid = optionGroups.every((group) => {
    if (!group.is_required) return true;
    const selected = selectedOptions.get(group.id);
    return selected && selected.size >= group.min_selections;
  });

  const handleAdd = () => {
    const allSelectedOptions: Array<{ optionId: string; name: string; priceModifier: number }> = [];

    selectedOptions.forEach((optionIds, groupId) => {
      const group = optionGroups.find(g => g.id === groupId);
      if (group) {
        optionIds.forEach(optId => {
          const opt = group.options.find(o => o.id === optId);
          if (opt) {
            allSelectedOptions.push({
              optionId: opt.id,
              name: opt.name,
              priceModifier: Number(opt.price_modifier),
            });
          }
        });
      }
    });

    onAddToCart({
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: Number(menuItem.price) + getModifierTotal(),
      quantity,
      specialInstructions: specialInstructions.trim() || undefined,
      selectedOptions: allSelectedOptions,
    });

    // Reset
    setQuantity(1);
    setSpecialInstructions('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{menuItem.name}</DialogTitle>
          {menuItem.description && (
            <p className="text-sm text-muted-foreground">{menuItem.description}</p>
          )}
          <p className="text-lg font-bold text-primary">R{Number(menuItem.price).toFixed(2)}</p>
        </DialogHeader>

        {menuItem.image_url && (
          <img
            src={menuItem.image_url}
            alt={menuItem.name}
            className="w-full h-48 object-cover rounded-lg"
          />
        )}

        {/* Option Groups */}
        <div className="space-y-6">
          {optionGroups.map((group) => (
            <div key={group.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{group.name}</h4>
                  {group.description && (
                    <p className="text-xs text-muted-foreground">{group.description}</p>
                  )}
                </div>
                {group.is_required && (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                )}
              </div>

              {group.max_selections === 1 ? (
                // Single select (radio)
                <RadioGroup
                  value={Array.from(selectedOptions.get(group.id) || [])[0] || ''}
                  onValueChange={(val) => handleSingleSelect(group.id, val)}
                >
                  {group.options.map((option) => (
                    <div key={option.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="cursor-pointer">
                          {option.name}
                        </Label>
                      </div>
                      {Number(option.price_modifier) !== 0 && (
                        <span className="text-sm text-muted-foreground">
                          {Number(option.price_modifier) > 0 ? '+' : ''}R{Number(option.price_modifier).toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                // Multi select (checkboxes)
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Select up to {group.max_selections}
                  </p>
                  {group.options.map((option) => {
                    const isChecked = selectedOptions.get(group.id)?.has(option.id) || false;
                    return (
                      <div key={option.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={option.id}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handleMultiSelect(group.id, option.id, !!checked, group.max_selections)
                            }
                          />
                          <Label htmlFor={option.id} className="cursor-pointer">
                            {option.name}
                          </Label>
                        </div>
                        {Number(option.price_modifier) !== 0 && (
                          <span className="text-sm text-muted-foreground">
                            +R{Number(option.price_modifier).toFixed(2)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions" className="font-semibold">Special Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="E.g., No onions, extra sauce..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              maxLength={200}
              className="resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          {/* Quantity Selector */}
          <div className="flex items-center justify-center gap-4 w-full">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xl font-bold w-8 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.min(20, quantity + 1))}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Add to Cart */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleAdd}
            disabled={!isValid}
          >
            Add to Cart — R{totalPrice.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
