import { ProductVariant } from "@/types";

type VariantAttribute = {
  attributeValueId: number;
  attributeValue?: {
    id: number;
    value: string;
    attributeId: number;
    attribute?: {
      id: number;
      name: string;
    };
  };
};

/**
 * Get a specific attribute value from a variant
 */
export const getVariantAttribute = (
  variant: ProductVariant,
  attributeName: string
): string | null => {
  const attr = variant.attributes?.find(
    (a: VariantAttribute) => a.attributeValue?.attribute?.name === attributeName
  );
  return attr?.attributeValue?.value ?? null;
};

/**
 * Find a variant by matching all selected attributes
 */
export const findVariantByAttributes = (
  variants: ProductVariant[],
  selectedAttributes: Map<number, number>
): ProductVariant | null => {
  if (!variants || variants.length === 0 || selectedAttributes.size === 0) return null;

  return variants.find(variant => 
    Array.from(selectedAttributes.entries()).every(([attributeId, valueId]) => 
      variant.attributes?.some(attr => 
        attr.attributeValue?.attribute?.id === attributeId && 
        attr.attributeValue?.id === valueId
      ) ?? false
    )
  ) ?? null;
};

/**
 * Get all values available for a specific attribute (considering valueRestrictionMode)
 * Now considers actual variant values, not just applicableAttributes
 */
export const getValuesForAttribute = (
  variants: ProductVariant[],
  attributeId: number,
  applicableAttributes: { attributeId: number; valueRestrictionMode: "NONE" | "ALL" | "SELECTED"; valueIds: number[]; values: { id: number; value: string }[] }[]
): { id: number; value: string }[] => {
  const attribute = applicableAttributes.find(attr => attr.attributeId === attributeId);
  if (!attribute) return [];

  // Get values that actually exist in variants for this product
  const variantValues = new Map<number, string>();
  variants.forEach(variant => {
    variant.attributes?.forEach(attr => {
      if (attr.attributeValue?.attribute?.id === attributeId) {
        variantValues.set(attr.attributeValue.id, attr.attributeValue.value);
      }
    });
  });

  // For SELECTED mode, only return values that are in valueIds AND exist in variants
  if (attribute.valueRestrictionMode === "SELECTED") {
    return attribute.values.filter(value =>
      attribute.valueIds.includes(value.id) && variantValues.has(value.id)
    );
  }
  
  // For NONE or ALL, return values that exist in variants
  return Array.from(variantValues.entries()).map(([id, value]) => ({ id, value }));
};

/**
 * Get available values for a target attribute, filtered by compatibility with
 * all currently selected attributes EXCEPT the target attribute itself.
 *
 * This is the core of dynamic availability: if the user has already selected
 * Color = Black, the Size list should only show sizes that have a Black variant.
 *
 * @param variants         All product variants
 * @param targetAttributeId  The attribute whose values we are computing
 * @param selectedAttributes  Currently selected attributeId → valueId map
 * @param applicableAttributes  UI schema (for SELECTED mode filtering)
 */
export const getAvailableValuesForAttributeWithFilter = (
  variants: ProductVariant[],
  targetAttributeId: number,
  selectedAttributes: Map<number, number>,
  applicableAttributes: { attributeId: number; valueRestrictionMode: "NONE" | "ALL" | "SELECTED"; valueIds: number[]; values: { id: number; value: string }[] }[]
): { id: number; value: string }[] => {
  // 1. Filter variants to only those matching ALL other selected attributes
  const compatibleVariants = variants.filter(variant => {
    for (const [attrId, valueId] of selectedAttributes.entries()) {
      if (attrId === targetAttributeId) continue; // skip the attribute we are computing

      const hasMatch = variant.attributes?.some(
        attr =>
          attr.attributeValue?.attribute?.id === attrId &&
          attr.attributeValue?.id === valueId
      );

      if (!hasMatch) return false;
    }
    return true;
  });

  // 2. Collect the target attribute's values from those compatible variants
  return getValuesForAttribute(compatibleVariants, targetAttributeId, applicableAttributes);
};

/**
 * Get available stock for a specific variant
 * Uses availableStock from API which is totalStock - reservedStock
 */
export const getStockForVariant = (
  variant: ProductVariant | null | undefined
): number => {
  if (!variant) return 0;
  
  // Use availableStock (total - reserved) as per API structure
  return variant.availableStock ?? variant.stock ?? 0;
};

/**
 * Calculate price with discount support
 */
export const calculatePrice = (
  variant: ProductVariant | null | undefined,
  fallbackPrice: number
): { currentPrice: number; originalPrice: number | null; discountPercentage: number } => {
  if (!variant) {
    return { currentPrice: fallbackPrice, originalPrice: null, discountPercentage: 0 };
  }

  const hasDiscount = variant.hasDiscount;
  const currentPrice = hasDiscount
    ? (variant.finalPrice ?? variant.price ?? fallbackPrice)
    : (variant.price ?? fallbackPrice);

  const originalPrice = hasDiscount
    ? (variant.price ?? fallbackPrice)
    : null;

  let discountPercentage = 0;
  if (hasDiscount) {
    if (variant.discountValue) {
      discountPercentage = parseInt(variant.discountValue);
    } else if (originalPrice && currentPrice < originalPrice) {
      discountPercentage = Math.round((1 - currentPrice / originalPrice) * 100);
    }
  }

  return { currentPrice, originalPrice, discountPercentage };
};