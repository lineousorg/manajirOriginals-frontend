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

/**
 * Sentinel attribute id used to identify the "Size" attribute by name.
 * We match on the attribute name "size" (case-insensitive) at runtime
 * rather than hardcoding an id, so this works across all products.
 */
const SIZE_ATTRIBUTE_NAME = "size";

export const useVariantSelection = ({
  variants = [],
  applicableAttributes = [],
  productPrice = 0,
}: UseVariantSelectionProps) => {
  // Store selected attributes as Map<attributeId, valueId>
  const [selectedAttributes, setSelectedAttributes] = useState<Map<number, number>>(
    new Map()
  );
  const [quantityByVariant, setQuantityByVariant] = useState<Record<number, number>>({});

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Find the Size ApplicableAttribute by name, or undefined if not present. */
  const sizeAttribute = useMemo(
    () =>
      applicableAttributes.find(
        (attr) => attr.isVariantSelectable && attr.name.toLowerCase() === SIZE_ATTRIBUTE_NAME
      ),
    [applicableAttributes]
  );

  /** attributeId of the Size attribute, or null if the product has no Size. */
  const sizeAttributeId = sizeAttribute?.attributeId ?? null;

  // ── Size-filtered variant set ─────────────────────────────────────────────
  //
  // When a size is selected, every non-size attribute only needs to consider
  // variants that match that size.  This is the key optimisation that prevents
  // impossible combinations: Color = Black + Size = S can never appear because
  // no Black/S variant will survive this filter.
  //
  const sizeFilteredVariants = useMemo(() => {
    if (sizeAttributeId === null) return variants; // no Size attribute → no filtering
    const selectedSizeId = selectedAttributes.get(sizeAttributeId);
    if (selectedSizeId === undefined) return variants; // size not yet chosen → show all
    return variants.filter((v) =>
      v.attributes?.some(
        (a) =>
          a.attributeValue?.attribute?.id === sizeAttributeId &&
          a.attributeValue?.id === selectedSizeId
      )
    );
  }, [variants, selectedAttributes, sizeAttributeId]);

  // ── Candidate variants ─────────────────────────────────────────────────────
  //
  // The set of variants compatible with ALL currently selected attributes.
  // This is the authoritative set for:
  //   - pruning stale selections
  //   - computing which attributes are actually present
  //   - any future feature that needs the narrowed variant set (gallery, price range, etc.)
  //
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

  // ── Stale selection pruning ────────────────────────────────────────────────
  //
  // When the user changes Size (or any anchor attribute), previously-selected
  // values for other attributes may no longer exist in any candidate variant.
  // This effect removes those stale entries so the internal state never diverges
  // from what is actually possible.
  //
  // Example: user had Size=M + Color=Black + Print=Dragon, then changes to Size=XL.
  // If no XL variant has Color or Print, both are pruned automatically.
  //
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

  // ── Available attributes (attribute-exists-in-candidates) ──────────────────
  //
  // An attribute is "available" only when at least one candidate variant
  // actually carries it.  This is distinct from "value available" — it
  // controls whether the entire attribute section is rendered at all.
  //
  // Scenario A: XL variants have no Print attribute at all.
  //   → Print is absent from availableAttributes → section is hidden.
  // Scenario B: XL variants have Print but not Print=Dragon.
  //   → Print IS in availableAttributes, but Dragon is disabled.
  //
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

  const availableAttributes = useMemo(
    () =>
      applicableAttributes.filter(
        (attr) => attr.isVariantSelectable && availableAttributeIds.has(attr.attributeId)
      ),
    [applicableAttributes, availableAttributeIds]
  );

  // Source variants for a given attribute's value list:
  //   - Size itself always uses the full variant set (size cannot filter itself)
  //   - Every other attribute uses sizeFilteredVariants so only compatible
  //     values are shown once a size is locked in.
  const sourceVariantsFor = (attributeId: number): ProductVariant[] => {
    if (attributeId === sizeAttributeId) return variants;
    return sizeFilteredVariants;
  };

  // ── Available values per attribute ────────────────────────────────────────

  const getAvailableValuesForAttribute = useMemo(() => {
    return (attribute: ApplicableAttribute) => {
      return getValuesForAttribute(
        sourceVariantsFor(attribute.attributeId),
        attribute.attributeId,
        applicableAttributes
      );
    };
  }, [applicableAttributes, sizeFilteredVariants, variants, sizeAttributeId]);

  // ── Dynamic compatibility filtering ──────────────────────────────────────
  //
  // For non-size attributes, further narrow available values by checking that
  // each candidate value participates in at least one variant that is also
  // compatible with every OTHER selected attribute (excluding the target).
  // This is the "proper algorithm" from the feedback, applied selectively.
  //
  const getCompatibleValuesForAttribute = useMemo(() => {
    return (attribute: ApplicableAttribute) => {
      // Size is already handled by sizeFilteredVariants above.
      if (attribute.attributeId === sizeAttributeId) {
        return getAvailableValuesForAttribute(attribute);
      }
      // For all other attributes, apply the full compatibility filter.
      return getAvailableValuesForAttributeWithFilter(
        variants,
        attribute.attributeId,
        selectedAttributes,
        applicableAttributes
      );
    };
  }, [
    variants,
    selectedAttributes,
    applicableAttributes,
    sizeAttributeId,
    getAvailableValuesForAttribute,
  ]);

  // ── Disabled / unavailable values per attribute ────────────────────────────
  //
  // A value is "disabled" when it exists in the schema but does NOT appear in
  // the dynamically-filtered compatible set.  The UI can grey these out rather
  // than hiding them, giving the user clear feedback about why a value is
  // unavailable.
  //
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

  // ── Selected variant ──────────────────────────────────────────────────────

  const selectedVariant = useMemo(() => {
    return findVariantByAttributes(variants, selectedAttributes);
  }, [variants, selectedAttributes]);

  // ── Price ─────────────────────────────────────────────────────────────────

  const { currentPrice, originalPrice, discountPercentage } = useMemo(() => {
    return calculatePrice(selectedVariant, productPrice);
  }, [selectedVariant, productPrice]);

  // ── Stock ─────────────────────────────────────────────────────────────────

  const selectedVariantAvailableStock = useMemo(() => {
    return getStockForVariant(selectedVariant);
  }, [selectedVariant]);

  const quantity = selectedVariant ? (quantityByVariant[selectedVariant.id] ?? 1) : 1;

  // ── Default selection: size-first, variant-anchored ───────────────────────
  //
  // Instead of picking a default per attribute independently (which can produce
  // invalid combinations), we find ONE real variant and derive ALL defaults
  // from it.  Size is set first because it is the natural anchor in clothing
  // ecommerce — every variant has a size, and picking size first immediately
  // partitions the variant space.
  //
  useEffect(() => {
    if (applicableAttributes.length === 0) {
      if (selectedAttributes.size > 0) {
        setSelectedAttributes(new Map());
      }
      return;
    }

    const variantSelectableAttributes = applicableAttributes.filter(
      (attr) => attr.isVariantSelectable
    );

    if (variantSelectableAttributes.length === 0) {
      if (selectedAttributes.size > 0) {
        setSelectedAttributes(new Map());
      }
      return;
    }

    // If we already have a complete selection that resolves to a variant, keep it.
    if (selectedAttributes.size > 0 && selectedVariant !== null) {
      return;
    }

    // Pick the first in-stock variant as the anchor.
    const defaultVariant =
      variants.find((v) => getStockForVariant(v) > 0) ?? variants[0];

    if (!defaultVariant) return;

    const defaults = new Map<number, number>();

    // Set Size first (if the product has a Size attribute).
    if (sizeAttributeId !== null) {
      const sizeAttr = defaultVariant.attributes?.find(
        (a) => a.attributeValue?.attributeId === sizeAttributeId
      );
      if (sizeAttr?.attributeValue?.id) {
        defaults.set(sizeAttributeId, sizeAttr.attributeValue.id);
      }
    }

    // Set all other attributes from the same variant.
    // Because they all come from one real variant, the combination is guaranteed valid.
    defaultVariant.attributes?.forEach((attr) => {
      if (
        attr.attributeValue?.attributeId &&
        attr.attributeValue?.id &&
        attr.attributeValue.attributeId !== sizeAttributeId // size already set above
      ) {
        defaults.set(attr.attributeValue.attributeId, attr.attributeValue.id);
      }
    });

    if (defaults.size > 0) {
      setSelectedAttributes(defaults);
    }
  }, [applicableAttributes, variants, selectedAttributes, selectedVariant, sizeAttributeId]);

  // ── Quantity clamping when stock changes ───────────────────────────────────

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

  // ── Selection setter ──────────────────────────────────────────────────────

  const setSelectedAttribute = (attributeId: number, valueId: number) => {
    // Validate that the attributeId exists in applicableAttributes
    const attributeExists = applicableAttributes.some(
      (attr) => attr.attributeId === attributeId
    );
    if (!attributeExists) {
      console.warn(`Attempted to set value for non-existent attributeId: ${attributeId}`);
      return;
    }

    const attribute = applicableAttributes.find(
      (attr) => attr.attributeId === attributeId
    );
    if (!attribute) {
      console.warn(`Attribute not found for attributeId: ${attributeId}`);
      return;
    }

    // Validate against the dynamically-filtered compatible set, not the raw schema.
    const compatibleValues = getCompatibleValuesForAttribute(attribute);
    const valueExists = compatibleValues.some((v) => v.id === valueId);
    if (!valueExists) {
      console.warn(
        `Attempted to set valueId: ${valueId} for attributeId: ${attributeId} — not compatible with current selection`
      );
      return;
    }

    setSelectedAttributes((prev) => {
      const newMap = new Map(prev);
      newMap.set(attributeId, valueId);
      return newMap;
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
    const requiredAttributes = applicableAttributes.filter(
      (attr) => attr.isRequired && attr.isVariantSelectable
    );
    return requiredAttributes.every((attr) =>
      selectedAttributes.has(attr.attributeId)
    );
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
    availableAttributes,          // attributes that actually exist in candidate variants
    candidateVariants,            // variants compatible with current selection
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
