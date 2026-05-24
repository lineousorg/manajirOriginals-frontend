# Dynamic Product Attributes Implementation Guide

## Project Goal

**Transform the hardcoded Size/Color attribute system into a fully dynamic, category-driven attribute management system.**

### Current State
- Attributes are hardcoded as `Size` and `Color` throughout the codebase
- Products can only have these two attributes
- Other attributes like `Print` are ignored or cause errors
- No cascading logic (selecting Size S doesn't filter available Colors)

### Target State
- Attributes are dynamically read from category configuration
- Any number of attributes can be used per product
- Attribute values cascade based on selections (Size S shows different colors than Size M)
- Backward compatibility maintained for existing products

---

## Implementation Steps

### Phase 1: Core Utilities (lib/attribute-utils.ts)

**Goal**: Create centralized attribute handling logic

**Steps**:
1. Create `lib/attribute-utils.ts` with the following functions:
   - `getActiveCategoryAttributes()` - Extract active attributes from product category
   - `getVariantAttribute()` - Get attribute value from variant (reusable)
   - `findVariantByAttributes()` - Dynamic variant matching
   - `getAvailableValuesForAttribute()` - Cascade filtering logic
   - `getStockForAttributeCombo()` - Stock calculation for any attribute combination

**Files to Create**: ✅ New file

---

### Phase 2: Update Variant Utilities (lib/variant-utils.ts)

**Goal**: Maintain backward compatibility while using new dynamic logic

**Steps**:
1. Keep existing `calculatePrice()` function
2. Add wrapper functions that call new dynamic logic:
   - `findVariantBySizeColor()` → calls `findVariantByAttributes()`
   - `getColorsForSize()` → calls `getAvailableValuesForAttribute()`
   - `getStockForSize()` → calls `getStockForAttributeCombo()`

**Files to Modify**: `lib/variant-utils.ts`

---

### Phase 3: Update Hook (hooks/useVariantSelection.ts)

**Goal**: Replace hardcoded size/color state with dynamic attribute map

**Steps**:
1. Replace `selectedSize` and `selectedColor` state with `selectedAttributes: Record<string, string>`
2. Replace `sizes` prop with `activeAttributes` from category
3. Add `availableAttributeValues` memoization
4. Update initialization to auto-select first available value per attribute
5. Return dynamic attribute data instead of size/color specific data

**Files to Modify**: `hooks/useVariantSelection.ts`

---

### Phase 4: Update Cart Store (store/cart.store.ts)

**Goal**: Store attributes dynamically instead of fixed size/color fields

**Steps**:
1. Change `MinimalCartItem`:
   - Replace `selectedSize: string` and `selectedColor: string`
   - Add `selectedAttributes: Record<string, string>`
2. Update `addItem()` signature to accept `selectedAttributes` instead of `size`/`color`
3. Update `removeItem()` to use `selectedAttributes` for matching
4. Update all cart operations (updateQuantity, isItemInCart, etc.)

**Files to Modify**: `store/cart.store.ts`

---

### Phase 5: Update Product Page (app/products/[id]/page.tsx)

**Goal**: Render dynamic attribute selectors

**Steps**:
1. Update `useVariantSelection` hook destructuring
2. Replace hardcoded Size/Color rendering with dynamic attribute loop
3. Update `handleAddToCart()` to use dynamic attributes
4. Update validation to check required attributes dynamically

**Files to Modify**: `app/products/[id]/page.tsx`

---

### Phase 6: Update Cart Drawer (layout/CartDrawer.tsx)

**Goal**: Display stored attributes correctly

**Steps**:
1. Update cart item key to use `JSON.stringify(selectedAttributes)`
2. Replace fixed size/color display with dynamic attribute iteration
3. Update GTM tracking to use attributes

**Files to Modify**: `layout/CartDrawer.tsx`

---

## Complete Code Implementation

### File 1: lib/attribute-utils.ts

```typescript
import { ProductVariant, ApiProduct } from "@/types";

/**
 * Get a specific attribute value from a variant
 */
export const getVariantAttribute = (
  variant: ProductVariant,
  attributeName: string
): string | null => {
  const attr = variant.attributes?.find(
    (a) => a.attributeValue?.attribute?.name === attributeName
  );
  return attr?.attributeValue?.value ?? null;
};

/**
 * Get all unique attribute values for a specific attribute name across variants
 */
export const getAttributeValuesFromVariants = (
  variants: ProductVariant[],
  attributeName: string
): string[] => {
  const values = new Set<string>();
  variants.forEach((variant) => {
    const value = getVariantAttribute(variant, attributeName);
    if (value) values.add(value);
  });
  return Array.from(values);
};

/**
 * Get active attributes from a category that are marked as active
 */
export const getActiveCategoryAttributes = (product: ApiProduct) => {
  if (!product.category?.attributes) return [];

  return product.category.attributes
    .filter((ca) => ca.attribute?.isActive)
    .map((ca) => ({
      id: ca.attribute.id,
      name: ca.attribute.name,
      attributeId: ca.attributeId,
      isRequired: ca.isRequired,
      isVariantSelectable: ca.isVariantSelectable,
      values: ca.selectedValues
        .filter((sv) => sv.value?.isActive)
        .map((sv) => ({
          id: sv.value.id,
          value: sv.value.value,
        })),
    }));
};

/**
 * Check if attribute is required by category
 */
export const isAttributeRequired = (
  product: ApiProduct,
  attributeName: string
): boolean => {
  return (
    product.category?.attributes?.some(
      (ca) => ca.attribute?.name === attributeName && ca.isRequired
    ) ?? false
  );
};

/**
 * Find variant by multiple attributes (dynamic)
 */
export const findVariantByAttributes = (
  variants: ProductVariant[],
  selectedAttributes: Record<string, string>
): ProductVariant | null => {
  if (!variants || variants.length === 0) return null;
  if (Object.keys(selectedAttributes).length === 0) return null;

  return (
    variants.find((variant) => {
      return Object.entries(selectedAttributes).every(
        ([attrName, attrValue]) =>
          getVariantAttribute(variant, attrName) === attrValue
      );
    }) ?? null
  );
};

/**
 * Get available values for an attribute based on current selections
 * This handles cascade filtering (e.g., selecting Size S shows only colors for S)
 */
export const getAvailableValuesForAttribute = (
  variants: ProductVariant[],
  attributeName: string,
  currentSelections: Record<string, string>,
  excludeAttribute: string = attributeName
): string[] => {
  const result = new Set<string>();

  variants.forEach((variant) => {
    const matchesCurrent = Object.entries(currentSelections)
      .filter(([name]) => name !== excludeAttribute)
      .every(([name, value]) =>
        getVariantAttribute(variant, name) === value
      );

    if (matchesCurrent) {
      const value = getVariantAttribute(variant, attributeName);
      if (value) result.add(value);
    }
  });

  return Array.from(result);
};

/**
 * Get stock for specific attribute combination
 */
export const getStockForAttributeCombo = (
  variants: ProductVariant[],
  selectedAttributes: Record<string, string>
): number => {
  const variant = findVariantByAttributes(variants, selectedAttributes);
  return variant?.availableStock ?? variant?.stock ?? 0;
};

/**
 * Get all variants matching a specific attribute value (for inventory counts)
 */
export const getVariantsMatchingAttribute = (
  variants: ProductVariant[],
  attributeName: string,
  attributeValue: string
): ProductVariant[] => {
  return variants.filter(
    (variant) => getVariantAttribute(variant, attributeName) === attributeValue
  );
};
```

### File 2: lib/variant-utils.ts (Add wrappers at the end)

```typescript
import { findVariantByAttributes } from "./attribute-utils";

/**
 * @deprecated Use findVariantByAttributes instead. Kept for backward compatibility.
 * Find a variant by size and optional color
 */
export const findVariantBySizeColor = (
  variants: ProductVariant[],
  size: string,
  color?: string
): ProductVariant | null => {
  const selectedAttributes: Record<string, string> = { Size: size };
  if (color) selectedAttributes.Color = color;
  return findVariantByAttributes(variants, selectedAttributes);
};

/**
 * @deprecated Use getAvailableValuesForAttribute instead. Kept for backward compatibility.
 * Get all colors available for a specific size
 */
export const getColorsForSize = (
  variants: ProductVariant[],
  size: string
): string[] => {
  return getAvailableValuesForAttribute(variants, "Color", { Size: size });
};

/**
 * @deprecated Use getStockForAttributeCombo instead. Kept for backward compatibility.
 * Get available stock for a specific size (sum of availableStock across colors)
 */
export const getStockForSize = (
  variants: ProductVariant[],
  size: string
): number => {
  const colors = getColorsForSize(variants, size);
  return variants
    .filter((v) => getVariantAttribute(v, "Size") === size)
    .reduce((total, v) => total + (v.availableStock ?? v.stock ?? 0), 0);
};
```

### File 3: hooks/useVariantSelection.ts

```typescript
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo } from "react";
import { ProductVariant } from "@/types";
import {
  getActiveCategoryAttributes,
  getAvailableValuesForAttribute,
  findVariantByAttributes,
  getStockForAttributeCombo,
} from "@/lib/attribute-utils";
import { calculatePrice } from "@/lib/variant-utils";

interface UseVariantSelectionProps {
  variants?: ProductVariant[];
  product?: any; // ApiProduct
  productPrice?: number;
}

export const useVariantSelection = ({
  variants = [],
  product,
  productPrice = 0,
}: UseVariantSelectionProps) => {
  // Dynamic state: stores all selected attributes by name
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // Get active attributes from category
  const activeAttributes = useMemo(() => {
    return product ? getActiveCategoryAttributes(product) : [];
  }, [product]);

  // Get required attribute names (for validation)
  const requiredAttributes = useMemo(() => {
    return activeAttributes.filter((attr) => attr.isRequired).map((attr) => attr.name);
  }, [activeAttributes]);

  // Get available values for each attribute based on current selections
  const availableAttributeValues = useMemo(() => {
    const result: Record<string, string[]> = {};

    activeAttributes.forEach((attr) => {
      result[attr.name] = getAvailableValuesForAttribute(
        variants,
        attr.name,
        selectedAttributes,
        attr.name
      );
    });

    return result;
  }, [variants, activeAttributes, selectedAttributes]);

  // Find selected variant dynamically
  const selectedVariant = useMemo(() => {
    return findVariantByAttributes(variants, selectedAttributes);
  }, [variants, selectedAttributes]);

  // Price calculation
  const { currentPrice, originalPrice, discountPercentage } = useMemo(() => {
    return calculatePrice(selectedVariant, productPrice);
  }, [selectedVariant, productPrice]);

  // Stock for current selection
  const selectedVariantStock = useMemo(() => {
    return selectedVariant?.availableStock ?? selectedVariant?.stock ?? 0;
  }, [selectedVariant]);

  // Check if all required attributes are selected
  const hasAllRequiredSelected = useMemo(() => {
    return requiredAttributes.every((attrName) => !!selectedAttributes[attrName]);
  }, [requiredAttributes, selectedAttributes]);

  // Initialize defaults when product loads
  useEffect(() => {
    if (!variants.length || !activeAttributes.length) return;

    // Auto-select first available value for each attribute
    const initialSelections: Record<string, string> = {};

    activeAttributes.forEach((attr) => {
      const available = getAvailableValuesForAttribute(
        variants,
        attr.name,
        initialSelections,
        attr.name
      );
      if (available.length > 0) {
        initialSelections[attr.name] = available[0];
      }
    });

    setSelectedAttributes(initialSelections);
  }, [variants, activeAttributes]);

  const setAttribute = (attributeName: string, value: string) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attributeName]: value,
    }));
  };

  const resetAttributes = () => {
    setSelectedAttributes({});
  };

  return {
    selectedAttributes,
    setAttribute,
    resetAttributes,
    activeAttributes,
    availableAttributeValues,
    selectedVariant,
    currentPrice,
    originalPrice,
    discountPercentage,
    selectedVariantStock,
    requiredAttributes,
    hasAllRequiredSelected,
  };
};
```

### File 4: store/cart.store.ts (Interface and Logic Changes)

```typescript
// Update MinimalCartItem interface
interface MinimalCartItem {
  productId: number | string;
  productName: string;
  productImage: string;
  productPrice: number;
  hasDiscount?: boolean;
  finalPrice?: number;
  variantId?: number | string;
  variantStock?: number;
  reservationId?: number;
  expiresAt?: string;
  quantity: number;
  // Changed from selectedSize/selectedColor to dynamic selectedAttributes
  selectedAttributes: Record<string, string>;
}

// Update CartState interface
interface CartState {
  items: MinimalCartItem[];
  isOpen: boolean;
  isHydrated: boolean;
  lastCartChange: number;
  addItem: (
    product: Product,
    selectedAttributes: Record<string, string>,  // Changed parameter
    quantity?: number,
    reservationId?: number,
    expiresAt?: string,
  ) => Promise<{ success: boolean; isExisting: boolean }>;
  removeItem: (
    productId: string | number,
    selectedAttributes: Record<string, string>,
    skipRelease?: boolean,
  ) => Promise<{ success: boolean; message?: string }>;
  // ... rest of interface with similar changes
}
```

---

## Migration Checklist

- [ ] Create `lib/attribute-utils.ts` with dynamic functions
- [ ] Update `lib/variant-utils.ts` with backward-compatible wrappers
- [ ] Replace `hooks/useVariantSelection.ts` with dynamic version
- [ ] Update `store/cart.store.ts` to use `selectedAttributes`
- [ ] Update `app/products/[id]/page.tsx` to render dynamic selectors
- [ ] Update `layout/CartDrawer.tsx` for attribute display
- [ ] Verify existing Size/Color products still work (backward compatibility)
- [ ] Test new attribute combinations (Print, Material, etc.)

## Testing Scenarios

1. **Product with Size S, Color Red/Green, Print Premium**
2. **Product with Size M, Color Black, no Print**
3. **Product with only Size attribute (no Color)**
4. **Product with Material, Style attributes instead of Size/Color**
5. **Product with 4+ different attributes**

---

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| Attribute Types | Fixed: Size, Color | Dynamic: Any category-defined |
| Code Changes for New Attributes | Required | None |
| Interdependent Logic | None | Full cascade support |
| Variant Matching | Limited | Unlimited combinations |
| Backward Compatibility | N/A | Maintained |
| Type Safety | Partial | Complete |









List of things that was working before but now it doesnt: 
QTY needs to be set to default 1 not 0. (it was fine before but now it has changed. Fix it)
Size selection needs to at the top then the rest of the attributes
Hovering on each size before it used to show the individual stock for each variant. Now it doesnt
No stock check when adding to cart. No validation for available stock. If Size s has 1 in stock user can add 2,3,4 in the cart.