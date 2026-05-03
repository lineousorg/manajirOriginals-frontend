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
 * Find a variant by size and optional color
 */
export const findVariantBySizeColor = (
  variants: ProductVariant[],
  size: string,
  color?: string
): ProductVariant | null => {
  if (!variants || variants.length === 0) return null;

  return variants.find((variant) => {
    const sizeMatch = getVariantAttribute(variant, "Size") === size;
    const colorMatch =
      !color || getVariantAttribute(variant, "Color") === color;
    return sizeMatch && colorMatch;
  }) ?? null;
};

/**
 * Get all colors available for a specific size
 */
export const getColorsForSize = (
  variants: ProductVariant[],
  size: string
): string[] => {
  const colors: string[] = [];

  variants.forEach((variant) => {
    if (getVariantAttribute(variant, "Size") === size) {
      const color = getVariantAttribute(variant, "Color");
      if (color && !colors.includes(color)) {
        colors.push(color);
      }
    }
  });

  return colors;
};

/**
 * Get available stock for a specific size (sum of availableStock across all colors)
 * Uses availableStock from API which is totalStock - reservedStock
 */
export const getStockForSize = (
  variants: ProductVariant[],
  size: string
): number => {
  let totalAvailableStock = 0;

  variants.forEach((variant) => {
    if (getVariantAttribute(variant, "Size") === size) {
      // Use availableStock (total - reserved) as per API structure
      const availableStock = variant.availableStock ?? variant.stock ?? 0;
      if (availableStock > 0) {
        totalAvailableStock += availableStock;
      }
    }
  });

  return totalAvailableStock;
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