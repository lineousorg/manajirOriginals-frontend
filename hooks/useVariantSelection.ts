/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo } from "react";
import { ProductVariant } from "@/types";
import {
  findVariantBySizeColor,
  getColorsForSize,
  getStockForSize,
  calculatePrice,
} from "@/lib/variant-utils";

interface UseVariantSelectionProps {
  variants?: ProductVariant[];
  sizes?: string[];
  productPrice?: number;
}

export const useVariantSelection = ({
  variants = [],
  sizes = [],
  productPrice = 0,
}: UseVariantSelectionProps) => {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantityBySize, setQuantityBySize] = useState<Record<string, number>>({});

  // Get available colors for selected size
  const availableColorsForSelectedSize = useMemo(() => {
    if (!variants || !selectedSize) return [];
    return getColorsForSize(variants, selectedSize);
  }, [variants, selectedSize]);

  // Get selected variant
  const selectedVariant = useMemo(
    () => findVariantBySizeColor(variants, selectedSize, selectedColor),
    [variants, selectedSize, selectedColor]
  );

  // Calculate price
  const { currentPrice, originalPrice, discountPercentage } = useMemo(
    () => calculatePrice(selectedVariant, productPrice),
    [selectedVariant, productPrice]
  );

  // Get stock for selected size
  const stockForSelectedSize = useMemo(() => {
    if (!variants || !selectedSize) return 0;
    return getStockForSize(variants, selectedSize);
  }, [variants, selectedSize]);

  // Get available stock for selected variant
  // Use availableStock first (as per API structure: availableStock = totalStock - reservedStock)
  const selectedVariantAvailableStock =
    selectedVariant?.availableStock ?? selectedVariant?.stock ?? 0;

  // Derived quantity for currently selected size
  const quantity = selectedSize ? (quantityBySize[selectedSize] ?? 1) : 1;

  // Initialize defaults when product loads
  useEffect(() => {
    if (sizes.length === 0) {
      if (selectedSize) {
        setSelectedSize("");
      }
      if (selectedColor) {
        setSelectedColor("");
      }
      return;
    }

    const selectedSizeExists = selectedSize
      ? sizes.includes(selectedSize)
      : false;
    const selectedSizeHasStock = selectedSizeExists
      ? getStockForSize(variants, selectedSize) > 0
      : false;

    if (selectedSizeHasStock) {
      return;
    }

    const firstAvailableSize =
      sizes.find((size) => getStockForSize(variants, size) > 0) ?? "";

    if (selectedSize !== firstAvailableSize) {
      setSelectedSize(firstAvailableSize);
    }

    const initialColors = firstAvailableSize
      ? getColorsForSize(variants, firstAvailableSize)
      : [];
    const nextColor = initialColors[0] ?? "";

    if (selectedColor !== nextColor) {
      setSelectedColor(nextColor);
    }
  }, [sizes, variants, selectedSize]);

  // Update color when size changes
  useEffect(() => {
    if (!selectedSize || availableColorsForSelectedSize.length === 0) {
      if (selectedColor) {
        setSelectedColor("");
      }
      return;
    }

    if (
      !selectedColor ||
      !availableColorsForSelectedSize.includes(selectedColor)
    ) {
      setSelectedColor(availableColorsForSelectedSize[0]);
    }
  }, [selectedSize, availableColorsForSelectedSize, selectedColor]);

  // Sync quantity when stock changes
  useEffect(() => {
    if (!selectedSize) return;
    setQuantityBySize((prev) => {
      const currentQty = prev[selectedSize] ?? 1;
      if (selectedVariantAvailableStock === 0) return { ...prev, [selectedSize]: 1 };
      if (currentQty > selectedVariantAvailableStock)
        return { ...prev, [selectedSize]: selectedVariantAvailableStock };
      return prev;
    });
  }, [selectedVariantAvailableStock, selectedSize]);

  const setQuantity = (size: string, qty: number) => {
    setQuantityBySize((prev) => ({ ...prev, [size]: qty }));
  };

  return {
    selectedSize,
    setSelectedSize,
    selectedColor,
    setSelectedColor,
    quantity,
    setQuantity,
    quantityBySize,
    setQuantityBySize,
    availableColorsForSelectedSize,
    selectedVariant,
    currentPrice,
    originalPrice,
    discountPercentage,
    stockForSelectedSize,
    selectedVariantAvailableStock,
  };
};
