"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/Loader";

interface AddToCartButtonProps {
  isAdding: boolean;
  isOutOfStock: boolean;
  isStockExceeded: boolean;
  isInCart: boolean;
  quantity: number;
  totalPrice: number;
  onAddToCart: () => void;
  className?: string;
}

export const AddToCartButton = ({
  isAdding,
  isOutOfStock,
  isStockExceeded,
  isInCart,
  quantity,
  totalPrice,
  onAddToCart,
  className,
}: AddToCartButtonProps) => {
  const isDisabled = isAdding || isOutOfStock || isStockExceeded || quantity <= 0;

  const getButtonContent = () => {
    if (isOutOfStock) {
      return (
        <motion.span
          key="outofstock"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center justify-center gap-2"
        >
          Out of Stock
        </motion.span>
      );
    }

    if (isStockExceeded) {
      return (
        <motion.span
          key="stockexceeded"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center justify-center gap-2"
        >
          Max Stock Reached
        </motion.span>
      );
    }

    if (isInCart) {
      return (
        <motion.span
          key="incart"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center justify-center gap-2"
        >
          <Check size={18} />
          Added to Bag
        </motion.span>
      );
    }

    if (isAdding) {
      return (
        <motion.span
          key="adding"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center justify-center gap-2"
        >
          <Loader size="sm" />
          Adding...
        </motion.span>
      );
    }

    return (
      <motion.span
        key="add"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        Add to Bag — ৳{totalPrice.toLocaleString()}
      </motion.span>
    );
  };

  return (
    <motion.button
      onClick={onAddToCart}
      disabled={isDisabled}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex-1 btn-primary-fashion h-14 text-base font-medium disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden rounded-lg",
        isStockExceeded ? "cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {getButtonContent()}
      </AnimatePresence>
    </motion.button>
  );
};