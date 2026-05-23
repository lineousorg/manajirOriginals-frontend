"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApplicableAttribute } from "@/types";

interface VariantSelectorProps {
  applicableAttributes: ApplicableAttribute[];
  setSelectedAttribute: (attributeId: number, valueId: number) => void;
  getSelectedValue: (attributeId: number) => number | undefined;
  getValuesForAttribute: (attribute: ApplicableAttribute) => { id: number; value: string }[];
  isValueAvailable?: (attributeId: number, valueId: number) => boolean;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  remainingStock: number;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  applicableAttributes,
  setSelectedAttribute,
  getSelectedValue,
  getValuesForAttribute,
  isValueAvailable,
  quantity,
  onQuantityChange,
  remainingStock,
}) => {
  // Filter to only variant-selectable attributes, sorted so Size always appears first.
  // Size is the natural anchor in clothing ecommerce — selecting it first immediately
  // partitions the variant space and prevents impossible combinations downstream.
  const sortedAttributes = useMemo(() => {
    return [...applicableAttributes]
      .filter((attr) => attr.isVariantSelectable)
      .sort((a, b) => {
        const aIsSize = a.name.toLowerCase() === "size" ? 0 : 1;
        const bIsSize = b.name.toLowerCase() === "size" ? 0 : 1;
        return aIsSize - bIsSize;
      });
  }, [applicableAttributes]);

  if (sortedAttributes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5 mb-6">
      {sortedAttributes.map((attribute, index) => {
        const isRequired = attribute.isRequired;
        const availableValues = getValuesForAttribute(attribute);
        const selectedValueId = getSelectedValue(attribute.attributeId);

        return (
          <motion.div
            key={attribute.attributeId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 + index * 0.05 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-16 shrink-0">
                {attribute.name}
                {isRequired ? " *" : ""}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableValues.map((value) => {
                  const isDisabled =
                    isValueAvailable != null
                      ? !isValueAvailable(attribute.attributeId, value.id)
                      : false;
                  const isSelected = selectedValueId === value.id;

                  return (
                    <button
                      key={value.id}
                      onClick={() => {
                        if (!isDisabled) {
                          setSelectedAttribute(attribute.attributeId, value.id);
                        }
                      }}
                      disabled={isDisabled}
                      className={cn(
                        "relative px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150",
                        isSelected
                          ? "bg-foreground text-background shadow-md scale-105"
                          : isDisabled
                          ? "bg-muted/20 text-muted-foreground/40 border border-border/30 cursor-not-allowed"
                          : "bg-muted/40 text-foreground hover:bg-muted border border-border/60 cursor-pointer"
                      )}
                    >
                      {value.value}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-sm"
                        >
                          <Check size={8} className="text-background" strokeWidth={3} />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Quantity */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.4 }}
        className="flex items-center gap-3"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-16 shrink-0">
          Qty
        </span>
        <div className="inline-flex items-center bg-muted/30 rounded-lg border border-border/60 h-8">
          <button
            onClick={() => onQuantityChange(Math.max(quantity - 1, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-sm font-medium"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center font-semibold text-sm tabular-nums">
            {quantity}
          </span>
          <button
            onClick={() => onQuantityChange(Math.min(quantity + 1, remainingStock))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-sm font-medium"
            disabled={remainingStock <= 0 || quantity >= remainingStock}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </motion.div>
    </div>
  );
};