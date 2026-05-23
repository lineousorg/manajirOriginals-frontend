# Dynamic Attribute Handling Refactoring Plan

## Overview
This document outlines the complete refactoring plan to replace hardcoded Size/Color assumptions with a fully dynamic attribute system that works with any number of product attributes (Size, Color, Print, Material, etc.) as provided by the backend API.

## Core Principles
1. **Dynamic UI Rendering**: Render attribute selectors based on `applicableAttributes` from API response
2. **Generic State Management**: Track selected attributes as `Map<attributeId, valueId>` instead of hardcoded size/color
3. **Variant Matching**: Find matching variant by comparing ALL selected attributes against variant attributes
4. **Variant-Centric Operations**: Use only `variantId` for all cart/order operations, never raw attribute values
5. **Backend Compliance**: Follow exactly how the backend expects data to be sent and received

## Files to Modify
1. `app/products/[id]/page.tsx` - Main product details page
2. `hooks/useVariantSelection.ts` - Custom hook for variant selection logic
3. `lib/variant-utils.ts` - Utility functions for variant operations
4. `hooks/useProduct.ts` - Product normalization (may need adjustments)
5. `store/cart.store.ts` - Cart store to handle variantId instead of size/color

## Implementation Breakdown

### Part 1: Foundation - Dynamic Attribute Selection State
**Goal**: Replace hardcoded size/color state with generic attribute selection tracking

**Changes Needed**:
- In `useVariantSelection.ts`: 
  - Replace `selectedSize`/`selectedColor` with `selectedAttributes: Map<number, number>` (attributeId → valueId)
  - Replace individual setters with `setSelectedAttribute(attributeId, valueId)`
  - Remove size/color specific logic
  - Add helper functions to get selected values for UI rendering

**API Contract**: 
- Input: `applicableAttributes` array from product data
- Output: Generic attribute selection state

### Part 2: Dynamic UI Rendering
**Goal**: Render attribute selectors dynamically from `applicableAttributes`

**Changes Needed**:
- In `app/products/[id]/page.tsx`:
  - Replace hardcoded Size/Color sections with dynamic loop over `applicableAttributes`
  - For each attribute, render label and selector (dropdown/buttons/etc.)
  - Filter by `isVariantSelectable` flag
  - Handle `valueRestrictionMode: "SELECTED"` by filtering values to `valueIds`
  - Connect UI to new generic attribute selection state

**API Contract**:
- Uses: `product.applicableAttributes`
- Output: Dynamic attribute selector UI

### Part 3: Variant Matching Logic
**Goal**: Find matching variant based on all selected attributes

**Changes Needed**:
- In `lib/variant-utils.ts`:
  - Replace `findVariantBySizeColor` with `findVariantByAttributes(variants, selectedAttributesMap)`
  - New function checks if variant has ALL selected attributeId:valueId pairs
  - Replace `getColorsForSize` and `getStockForSize` with generic variants
  - Update `getVariantAttribute` to work with attributeId instead of name (optional improvement)

**API Contract**:
- Input: `variants[]` and `selectedAttributes: Map<attributeId, valueId>`
- Output: Matching `ProductVariant` or null

### Part 4: Cart/Order Operations
**Goal**: Use only variantId for all operations, never attribute values

**Changes Needed**:
- In `app/products/[id]/page.tsx`:
  - Update `handleAddToCart` to use only `selectedVariant.id` (variantId)
  - Remove size/color parameters from `addToCart` call
  - Update GTM tracking to use variantId instead of color for brand
  - Update `isInCart`, `isOutOfStock` calculations to use variantId
  - Update quantity handling to be variant-specific

- In `store/cart.store.ts`:
  - Update `MinimalCartItem` interface to remove `selectedSize` and `selectedColor`
  - Update `addItem`, `removeItem`, `updateQuantity`, `isItemInCart`, `getItemQuantity`, `getItemStock`, `getItemReservation` to use `variantId` instead of `size` and `color`
  - Update all internal logic to work with variantId

**API Contract**:
- Input to backend: `{ variantId: number, quantity: number }`
- Backend expects: variantId for all stock/order operations

## Detailed Implementation Steps

### Part 1: Foundation Implementation
1. Modify `hooks/useVariantSelection.ts`:
   - Change state from `{selectedSize, selectedColor, setSelectedSize, setSelectedColor}` 
   - To `{selectedAttributes: Map<number, number>, setSelectedAttribute, clearSelectedAttributes}`
   - Add `getSelectedValue(attributeId)` helper
   - Add `areAllRequiredSelected()` helper using `isRequired` flag
   - Remove size/color specific effects and logic
   - Keep quantityBySize logic but rename to quantityByVariant or make it generic

2. Update `useVariantSelection` hook signature:
   - Add `applicableAttributes` parameter
   - Return generic attribute selection state

### Part 2: Dynamic UI Implementation
1. Modify `app/products/[id]/page.tsx`:
   - Import `useVariantSelection` with `applicableAttributes`
   - Replace hardcoded Size/Color sections (lines 527-638) with:
     ```jsx
     {product.applicableAttributes
       .filter(attr => attr.isVariantSelectable)
       .map(attr => (
         <AttributeSelector 
           key={attr.attributeId}
           attribute={attr}
           selectedAttributes={selectedAttributes}
           onSelect={setSelectedAttribute}
         />
       ))}
     ```
   - Create `AttributeSelector` component that handles:
     - Label rendering from `attr.name`
     - Dropdown/button rendering from `attr.values`
     - Applying `valueRestrictionMode` filtering
     - Connecting to selection state

### Part 3: Variant Matching Implementation
1. Modify `lib/variant-utils.ts`:
   - Add `findVariantByAttributes(variants, selectedAttributesMap)`:
     ```typescript
     export const findVariantByAttributes = (
       variants: ProductVariant[],
       selectedAttributes: Map<number, number>
     ): ProductVariant | null => {
       if (!variants || variants.length === 0 || selectedAttributes.size === 0) return null;
       
       return variants.find(variant => 
         Array.from(selectedAttributes.entries()).every(([attributeId, valueId]) => 
           variant.attributes.some(attr => 
             attr.attributeValue?.attributeId === attributeId && 
             attr.attributeValue?.id === valueId
           )
         )
       ) ?? null;
     };
     ```
   - Update `getVariantAttribute` to work with attributeId if needed
   - Create generic `getStockForVariant` function
   - Keep `calculatePrice` as is (already variant-centric)

### Part 4: Cart/Order Implementation
1. Modify `app/products/[id]/page.tsx`:
   - Update `handleAddToCart`:
     ```typescript
     const handleAddToCart = async () => {
       // Validation: check if all required attributes are selected
       if (!areAllRequiredSelected()) {
         toast.error("Please select all required options");
         return;
       }
       
       const variantId = selectedVariant?.id;
       if (!variantId) {
         toast.error("Selected variant is not available");
         return;
       }
       
       // Use only variantId for cart operations
       await addToCart(
         { ...product, id: productId, images: normalizedImages },
         variantId,
         quantity
       );
     };
     ```
   - Update `addToCart` function in cart store to accept variantId instead of size/color
   - Update all references to use variantId for stock checks, GTM tracking, etc.
   - Update `isInCart` and `isOutOfStock` to use variantId

2. Modify `store/cart.store.ts`:
   - Update `MinimalCartItem` interface to remove `selectedSize` and `selectedColor`
   - Update all cart methods to use `variantId` instead of `size` and `color`
   - Update internal logic to work with variantId for finding matching cart items

## Dependencies and Considerations

### Backend API Contract Verification
Need to confirm:
1. `GET /products/:id` returns `applicableAttributes` and `variants[].attributes` as shown in the example
2. Cart API expects `{ variantId: number, quantity: number }` 
3. Stock reservation service works with variantId
4. Wishlist functionality works with variantId

### Edge Cases to Handle
1. Products with no variants (simple products)
2. Attributes where `isVariantSelectable: false` (display only)
3. `valueRestrictionMode: "SELECTED"` vs "NONE" vs "ALL"
4. Required attributes (`isRequired: true`)
5. Partial attribute matches (some variants may not have all attributes)
6. Loading and error states

## Testing Strategy
After each part:
1. Verify existing Size/Color products still work
2. Test with products that have additional attributes (Print, Material, etc.)
3. Verify cart operations work correctly
4. Verify stock display is accurate
5. Verify UI renders correctly for different attribute combinations

## Next Steps
Before starting implementation, I need to:
1. Verify the exact API response structure for `applicableAttributes` and `variants[].attributes`
2. Check if the cart API already accepts variantId or needs modification
3. Confirm stock reservation service works with variantId

Based on the feedback provided, all APIs are already confirmed and ready for frontend implementation. No backend changes are required.

Now I will wait for permission to start Part 1 implementation.