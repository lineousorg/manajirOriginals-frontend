/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo } from "react";
import { ProductVariant, ApplicableAttribute } from "@/types";
import {
  findVariantByAttributes,
  getStockForVariant,
  calculatePrice,
  getValuesForAttribute,
  getAvailableValuesForAttributeWithFilter,
} from "@/lib/variant-utils";

interface UseVariantSelectionProps {
  variants?: ProductVariant[];
  applicableAttributes?: ApplicableAttribute[];
  productPrice?: number;
}

const SIZE_ATTRIBUTE_NAME = "size";

/**
 * Ordered size mapping: lowest key = smallest size.
 * Maps string label to a sortable number so S < M < L < XL < 2XL < 3XL.
 */
const SIZE_ORDER: Record<string, number> = {
  "xs": 0,
  "s": 1,
  "m": 2,
  "l": 3,
  "xl": 4,
  "2xl": 5,
  "xxl": 5,
  "3xl": 6,
  "xxxl": 6,
};

/** Stable sort key derived from a size label string. */
function getSizeOrderKey(label: string): number {
  const key = label.trim().toLowerCase();
  return SIZE_ORDER[key] ?? 999;
}

export const useVariantSelection = ({
  variants = [],
  applicableAttributes = [],
  productPrice = 0,
}: UseVariantSelectionProps) => {
  const [selectedAttributes, setSelectedAttributes] = useState<Map<number, number>>(
    new Map()
  );
  const [quantityByVariant, setQuantityByVariant] = useState<Record<number, number>>({});

  const sizeAttribute = useMemo(
    () =>
      applicableAttributes.find(
        (attr) => attr.isVariantSelectable && attr.name.toLowerCase() === SIZE_ATTRIBUTE_NAME
      ),
    [applicableAttributes]
  );

  const sizeAttributeId = sizeAttribute?.attributeId ?? null;

  const sizeFilteredVariants = useMemo(() => {
    if (sizeAttributeId === null) return variants;
    const selectedSizeId = selectedAttributes.get(sizeAttributeId);
    if (selectedSizeId === undefined) return variants;
    return variants.filter((v) =>
      v.attributes?.some(
        (a) =>
          a.attributeValue?.attribute?.id === sizeAttributeId &&
          a.attributeValue?.id === selectedSizeId
      )
    );
  }, [variants, selectedAttributes, sizeAttributeId]);

  const candidateVariants = useMemo(() => {
    if (selectedAttributes.size === 0) return variants;
    return variants.filter((variant) =>
      Array.from(selectedAttributes.entries()).every(([attributeId, valueId]) =>
        variant.attributes?.some(
          (attr) =>
            attr.attributeValue?.attribute?.id === attributeId &&
            attr.attributeValue?.id === valueId
        )
      )
    );
  }, [variants, selectedAttributes]);

  useEffect(() => {
    if (selectedAttributes.size === 0) return;

    setSelectedAttributes((prev) => {
      let changed = false;
      const next = new Map(prev);

      for (const [attributeId, valueId] of next) {
        const stillValid = candidateVariants.some((variant) =>
          variant.attributes?.some(
            (attr) =>
              attr.attributeValue?.attribute?.id === attributeId &&
              attr.attributeValue?.id === valueId
          )
        );

        if (!stillValid) {
          next.delete(attributeId);
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [candidateVariants]);

  const availableAttributeIds = useMemo(() => {
    const ids = new Set<number>();
    candidateVariants.forEach((variant) => {
      variant.attributes?.forEach((attr) => {
        if (attr.attributeValue?.attribute?.id) {
          ids.add(attr.attributeValue.attribute.id);
        }
      });
    });
    return ids;
  }, [candidateVariants]);

  const COLOR_ATTRIBUTE_NAME = "color";

  const availableAttributes = useMemo(() => {
    const matching = applicableAttributes.filter(
      (attr) => attr.isVariantSelectable && availableAttributeIds.has(attr.attributeId)
    );

    const size = matching.find(
      (a) => a.name.toLowerCase() === SIZE_ATTRIBUTE_NAME
    );
    const color = matching.find(
      (a) => a.name.toLowerCase() === COLOR_ATTRIBUTE_NAME
    );
    const rest = matching
      .filter(
        (a) =>
          a.name.toLowerCase() !== SIZE_ATTRIBUTE_NAME &&
          a.name.toLowerCase() !== COLOR_ATTRIBUTE_NAME
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    return [size, color, ...rest].filter(Boolean) as ApplicableAttribute[];
  }, [applicableAttributes, availableAttributeIds]);

  const sourceVariantsFor = (attributeId: number): ProductVariant[] => {
    if (attributeId === sizeAttributeId) return variants;
    return sizeFilteredVariants;
  };

  const getAvailableValuesForAttribute = useMemo(() => {
    return (attribute: ApplicableAttribute) => {
      const srcV = sourceVariantsFor(attribute.attributeId);
      const values = getValuesForAttribute(srcV, attribute.attributeId, applicableAttributes);
      if (attribute.name.toLowerCase() === SIZE_ATTRIBUTE_NAME) {
        return [...values].sort(
          (a, b) => getSizeOrderKey(a.value) - getSizeOrderKey(b.value)
        );
      }
      return values;
    };
  }, [applicableAttributes, sizeFilteredVariants, variants, sizeAttributeId]);

  const getCompatibleValuesForAttribute = useMemo(() => {
    return (attribute: ApplicableAttribute) => {
      if (attribute.attributeId === sizeAttributeId) {
        return getAvailableValuesForAttribute(attribute);
      }
      return getAvailableValuesForAttributeWithFilter(
        variants,
        attribute.attributeId,
        selectedAttributes,
        applicableAttributes
      );
    };
  }, [variants, selectedAttributes, applicableAttributes, sizeAttributeId, getAvailableValuesForAttribute]);

  const disabledValuesByAttribute = useMemo(() => {
    const map = new Map<number, Set<number>>();
    applicableAttributes.forEach((attr) => {
      if (!attr.isVariantSelectable) return;
      const compatible = new Set(
        getCompatibleValuesForAttribute(attr).map((v) => v.id)
      );
      const disabled = new Set<number>();
      attr.values.forEach((v) => {
        if (!compatible.has(v.id)) disabled.add(v.id);
      });
      if (disabled.size > 0) map.set(attr.attributeId, disabled);
    });
    return map;
  }, [applicableAttributes, getCompatibleValuesForAttribute]);

  const isValueAvailable = (attributeId: number, valueId: number): boolean => {
    const disabled = disabledValuesByAttribute.get(attributeId);
    return disabled ? !disabled.has(valueId) : true;
  };

  const selectedVariant = useMemo(() => {
    return findVariantByAttributes(variants, selectedAttributes);
  }, [variants, selectedAttributes]);

  const { currentPrice, originalPrice, discountPercentage } = useMemo(() => {
    return calculatePrice(selectedVariant, productPrice);
  }, [selectedVariant, productPrice]);

  const selectedVariantAvailableStock = useMemo(() => {
    return getStockForVariant(selectedVariant);
  }, [selectedVariant]);

  const quantity = selectedVariant ? (quantityByVariant[selectedVariant.id] ?? 1) : 1;

  // ── Default selection: smallest size ───────────────────────────────────────
  //
  // Finds the smallest available size and selects it on mount.
  // All other attributes are derived from that same variant so the combination
  // is guaranteed valid.
  //
  useEffect(() => {
    if (applicableAttributes.length === 0) {
      if (selectedAttributes.size > 0) setSelectedAttributes(new Map());
      return;
    }

    if (applicableAttributes.filter((a) => a.isVariantSelectable).length === 0) {
      if (selectedAttributes.size > 0) setSelectedAttributes(new Map());
      return;
    }

    // Already have a complete selection resolving to a variant — keep it.
    if (selectedAttributes.size > 0 && selectedVariant !== null) return;

    if (sizeAttributeId === null || !sizeAttribute) {
      // No Size attribute — pick the first variant as anchor.
      if (variants.length > 0 && variants[0]) {
        const defaults = new Map<number, number>();
        variants[0].attributes?.forEach((a) => {
          if (a.attributeValue?.attribute?.id && a.attributeValue?.id) {
            defaults.set(a.attributeValue.attribute.id, a.attributeValue.id);
          }
        });
        if (defaults.size > 0) setSelectedAttributes(defaults);
      }
      return;
    }

    // Build size value id → sort-order map from the schema.
    const sizeValueOrderMap = new Map<number, number>();
    sizeAttribute.values.forEach((sv) => {
      sizeValueOrderMap.set(sv.id, getSizeOrderKey(sv.value));
    });

    // Pick the in-stock variant with the smallest size.
    const defaultVariant = variants
      .filter((v) => getStockForVariant(v) > 0)
      .sort((a, b) => {
        const aSizeId = a.attributes?.find(
          (attr) => attr.attributeValue?.attribute?.id === sizeAttributeId
        )?.attributeValue?.id;
        const bSizeId = b.attributes?.find(
          (attr) => attr.attributeValue?.attribute?.id === sizeAttributeId
        )?.attributeValue?.id;
        const aOrder = aSizeId != null ? sizeValueOrderMap.get(aSizeId) ?? 999 : 999;
        const bOrder = bSizeId != null ? sizeValueOrderMap.get(bSizeId) ?? 999 : 999;
        return aOrder - bOrder;
      })[0];

    // Fall back: if no in-stock variant, sort all variants by size.
    const anchorVariant =
      defaultVariant ??
      [...variants].sort((a, b) => {
        const aSizeId = a.attributes?.find(
          (attr) => attr.attributeValue?.attribute?.id === sizeAttributeId
        )?.attributeValue?.id;
        const bSizeId = b.attributes?.find(
          (attr) => attr.attributeValue?.attribute?.id === sizeAttributeId
        )?.attributeValue?.id;
        const aOrder = aSizeId != null ? sizeValueOrderMap.get(aSizeId) ?? 999 : 999;
        const bOrder = bSizeId != null ? sizeValueOrderMap.get(bSizeId) ?? 999 : 999;
        return aOrder - bOrder;
      })[0] ??
      variants[0];

    if (!anchorVariant) return;

    const defaults = new Map<number, number>();

    // Set Size first.
    const sizeAttr = anchorVariant.attributes?.find(
      (a) => a.attributeValue?.attribute?.id === sizeAttributeId
    );
    if (sizeAttr?.attributeValue?.id) {
      defaults.set(sizeAttributeId, sizeAttr.attributeValue.id);
    }

    // Derive all other attributes from the same anchor variant.
    anchorVariant.attributes?.forEach((av) => {
      const attrId = av.attributeValue?.attribute?.id;
      const valueId = av.attributeValue?.id;
      if (attrId && valueId && attrId !== sizeAttributeId) {
        defaults.set(attrId, valueId);
      }
    });

    if (defaults.size > 0) {
      setSelectedAttributes(defaults);
    }
  }, [applicableAttributes, variants, selectedAttributes, selectedVariant, sizeAttributeId, sizeAttribute]);

  useEffect(() => {
    if (!selectedVariant) return;
    setQuantityByVariant((prev) => {
      const currentQty = prev[selectedVariant.id] ?? 1;
      if (selectedVariantAvailableStock === 0) return { ...prev, [selectedVariant.id]: 1 };
      if (currentQty > selectedVariantAvailableStock)
        return { ...prev, [selectedVariant.id]: selectedVariantAvailableStock };
      return prev;
    });
  }, [selectedVariantAvailableStock, selectedVariant]);

  const setSelectedAttribute = (attributeId: number, valueId: number) => {
    const attribute = applicableAttributes.find((a) => a.attributeId === attributeId);
    if (!attribute) return;

    const compatibleValues = getCompatibleValuesForAttribute(attribute);
    if (!compatibleValues.some((v) => v.id === valueId)) {
      console.warn(`valueId ${valueId} not compatible with attribute ${attributeId}`);
      return;
    }

    setSelectedAttributes((prev) => {
      const next = new Map(prev);
      next.set(attributeId, valueId);
      return next;
    });
  };

  const clearSelectedAttributes = () => {
    setSelectedAttributes(new Map());
    setQuantityByVariant({});
  };

  const getSelectedValue = (attributeId: number): number | undefined => {
    return selectedAttributes.get(attributeId);
  };

  const areAllRequiredSelected = (): boolean => {
    return applicableAttributes
      .filter((a) => a.isRequired && a.isVariantSelectable)
      .every((a) => selectedAttributes.has(a.attributeId));
  };

  return {
    selectedAttributes,
    setSelectedAttribute,
    clearSelectedAttributes,
    getSelectedValue,
    areAllRequiredSelected,
    getAvailableValuesForAttribute,
    getCompatibleValuesForAttribute,
    disabledValuesByAttribute,
    isValueAvailable,
    availableAttributes,
    candidateVariants,
    quantityByVariant,
    setQuantityByVariant: (variantId: number, qty: number) => {
      setQuantityByVariant((prev) => ({ ...prev, [variantId]: qty }));
    },
    quantity,
    selectedVariant,
    currentPrice,
    originalPrice,
    discountPercentage,
    selectedVariantAvailableStock,
  };
};
