

# Fix Build Errors in Admin Pages

Three admin pages have broken JSX structure from the previous navigation refactor. Since `AdminLayout` now provides the sidebar, header, and `<main>` wrapper via `<Outlet>`, these pages just need to return their content directly.

## Fixes

### 1. `src/pages/admin/AdminDeliveryPartners.tsx`
- **Problem**: Lines 208-210 have `<> <div> <main>` wrappers and lines 466-468 close `</main></div></div>` — mismatched with the fragment.
- **Fix**: Replace lines 207-210 with `return ( <>` and a simple `<div>` (no `<main>`), and remove the extra `</main></div>` closings at lines 466-468 down to just `</div>`.

### 2. `src/pages/admin/AdminOrders.tsx`  
- **Problem**: Lines 268-276 still contain the old `<SidebarProvider>`, `<AdminSidebar/>`, header, and `<main>` wrapper. The closing tags at the end don't match the fragment.
- **Fix**: Replace lines 268-276 to start with `return ( <>` and a `<div>`, removing the sidebar/header wrapper. Remove corresponding closing tags near the end of the file.

### 3. `src/pages/admin/AdminMarketing.tsx`
- **Problem**: `<Tabs>` opened at line 154 is never closed. Line 653 closes `</TabsContent>` then line 654 closes `</div>`.
- **Fix**: Add `</Tabs>` before `</div>` at line 654.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/admin/AdminDeliveryPartners.tsx` | Remove redundant `<div><main>` wrapper, fix fragment structure |
| `src/pages/admin/AdminOrders.tsx` | Strip old `SidebarProvider`/`AdminSidebar`/header/main wrapper, return content directly |
| `src/pages/admin/AdminMarketing.tsx` | Add missing `</Tabs>` closing tag |

