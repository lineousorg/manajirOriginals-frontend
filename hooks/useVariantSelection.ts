/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo } from "react";
import { ProductVariant, ApiProduct } from "@/types";
import {
  getActiveCategoryAttributes,
  getAvailableValuesForAttribute,
  findVariantByAttributes,
  getStockForAttributeCombo,
} from "@/lib/attribute-utils";
import { calculatePrice } from "@/lib/variant-utils";

interface UseVariantSelectionProps {
  variants?: ProductVariant[];
  product?: ApiProduct;
  productPrice?: number;
}

export const useVariantSelection = ({
  variants = [],
  product,
  productPrice = 0,
}: UseVariantSelectionProps) => {
  // Dynamic state: stores all selected attributes by name
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(1);

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
    quantity,
    setQuantity,
  };
};
