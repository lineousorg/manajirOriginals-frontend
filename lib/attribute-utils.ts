import { ProductVariant, ApiProduct, CategoryAttributeLink } from "@/types";

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
      (ca) =>
        ca.attribute?.name === attributeName && ca.isRequired
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