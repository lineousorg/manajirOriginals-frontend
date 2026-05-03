"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariantSelectorProps {
  sizes: string[];
  colors: string[];
  selectedSize: string;
  selectedColor: string;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
  getStockForSize: (size: string) => number;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  remainingStock: number;
}

export const VariantSelector = ({
  sizes,
  colors,
  selectedSize,
  selectedColor,
  onSizeChange,
  onColorChange,
  getStockForSize,
  quantity,
  onQuantityChange,
  remainingStock,
}: VariantSelectorProps) => {
  return (
    <div className="space-y-8 mb-8">
      {/* Color Selection - Only show if more than 1 color available */}
      {colors.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground w-24 shrink-0">
              Color
            </span>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={cn(
                    "relative px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
                    selectedColor === color
                      ? "bg-foreground text-background shadow-lg scale-105"
                      : "bg-muted/50 text-foreground hover:bg-muted border border-border"
                  )}
                >
                  {color}
                  {selectedColor === color && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm"
                    >
                      <Check size={10} className="text-background" strokeWidth={3} />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Size Selection - Only show if more than 1 size available */}
      {sizes.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground w-24 shrink-0 text-left pl-3">
              Size
            </span>
            <div className="flex flex-wrap gap-4">
              {sizes.map((size) => {
                const stock = getStockForSize(size);
                const isLowStock = stock > 0 && stock <= 3;
                const isOutOfStock = stock <= 0;
                return (
                  <div key={size} className="relative">
                    <button
                      onClick={() => {
                        onSizeChange(size);
                      }}
                      disabled={isOutOfStock}
                      className={cn(
                        "w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200",
                        isOutOfStock
                          ? "opacity-40 cursor-not-allowed line-through"
                          : "cursor-pointer",
                        selectedSize === size
                          ? "bg-foreground text-background shadow-md scale-105"
                          : "bg-background text-foreground border-2 border-border hover:border-primary/50 hover:bg-muted/30"
                      )}
                    >
                      {size}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Quantity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="flex items-center gap-4"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground w-24 shrink-0">
          Quantity
        </span>
        <div className="inline-flex items-center bg-muted/30 rounded-full border border-border">
          <button
            onClick={() => onQuantityChange(Math.max(quantity - 1, 1))}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="w-12 text-center font-semibold text-lg tabular-nums">
            {quantity}
          </span>
          <button
            onClick={() => onQuantityChange(Math.min(quantity + 1, remainingStock))}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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