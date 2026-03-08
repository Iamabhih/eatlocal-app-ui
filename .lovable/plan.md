

# Menu Item Customization System — Full Cart Integration

## Problem

The customization modal (`MenuItemCustomization.tsx`) already supports option groups with required/optional selections, radio/checkbox UI, and price modifiers. However, **the cart doesn't properly store or display customizations**:

1. Selected options are flattened into the item name string (`"Burger (Large, Extra Cheese)"`) — not structured data
2. Cart deduplicates by `menuItemId`, so two differently-customized versions of the same item get merged
3. Cart page doesn't show selected options or special instructions
4. Checkout doesn't persist `order_item_options` to the database (the table exists but is never written to)

## Plan

### 1. Upgrade CartItem type and store logic (`src/hooks/useCart.ts`)

- Add `selectedOptions: Array<{ optionId: string; name: string; priceModifier: number }>` to `CartItem`
- Add `specialInstructions` already exists but isn't consistently used
- Change deduplication key from `menuItemId` alone to `menuItemId + sorted selectedOptions hash` — so "Large Burger" and "Small Burger" are separate cart lines
- Helper function `getCartItemKey(menuItemId, selectedOptions)` for matching
- Update `addItem`, `removeItem`, `updateQuantity` to use composite key
- Bump persist version to `3` for migration

### 2. Update RestaurantDetail integration (`src/pages/customer/RestaurantDetail.tsx`)

- Pass `selectedOptions` and `specialInstructions` through to `addItem` from the customization modal callback
- Keep the quick-add `+` button behavior: if item has no option groups, add directly; if it has option groups, open customization modal

### 3. Show options in Cart page (`src/pages/customer/Cart.tsx`)

- Display selected options as small badges/text under each cart item name
- Display special instructions in italic text
- Show per-item total including modifier prices

### 4. Persist options at checkout (`src/pages/customer/Checkout.tsx`)

- After inserting `order_items`, iterate returned IDs and insert into `order_item_options` for each selected option
- This writes to the existing `order_item_options` table (columns: `order_item_id`, `option_id`, `option_name`, `price_modifier`)

### 5. No database changes needed

The `menu_item_option_groups`, `menu_item_options`, and `order_item_options` tables already exist with proper schemas and RLS policies.

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useCart.ts` | Add `selectedOptions` to CartItem, composite key dedup, version bump |
| `src/pages/customer/RestaurantDetail.tsx` | Pass structured options to cart, conditional quick-add vs customize |
| `src/pages/customer/Cart.tsx` | Display selected options and special instructions per item |
| `src/pages/customer/Checkout.tsx` | Insert `order_item_options` after creating order items |

