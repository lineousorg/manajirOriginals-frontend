import { ProductVariant } from "@/types";
import {
  getVariantAttribute as getVariantAttributeDynamic,
  findVariantByAttributes,
  getAvailableValuesForAttribute,
  getStockForAttributeCombo,
} from "./attribute-utils";

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
 * @deprecated Use getVariantAttributeDynamic from attribute-utils instead
 */
export const getVariantAttribute = (
  variant: ProductVariant,
  attributeName: string
): string | null => {
  return getVariantAttributeDynamic(variant, attributeName);
};

/**
 * @deprecated Use findVariantByAttributes from attribute-utils instead. Kept for backward compatibility.
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
 * @deprecated Use getAvailableValuesForAttribute from attribute-utils instead. Kept for backward compatibility.
 * Get all colors available for a specific size
 */
export const getColorsForSize = (
  variants: ProductVariant[],
  size: string
): string[] => {
  return getAvailableValuesForAttribute(variants, "Color", { Size: size });
};

/**
 * @deprecated Use getStockForAttributeCombo from attribute-utils instead. Kept for backward compatibility.
 * Get available stock for a specific size (sum of availableStock across all colors)
 * Uses availableStock from API which is totalStock - reservedStock
 */
export const getStockForSize = (
  variants: ProductVariant[],
  size: string
): number => {
  return variants
    .filter((v) => getVariantAttribute(v, "Size") === size)
    .reduce((total, v) => total + (v.availableStock ?? v.stock ?? 0), 0);
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