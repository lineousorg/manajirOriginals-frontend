"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";

import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { SignupModal } from "@/components/auth/SignupModal";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { stockReservationService } from "@/services/stock-reservation.service";

export const CartDrawer = () => {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getTotal,
    isHydrated,
    getItemStock,
  } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Function to check and release expired reservations
  // When a reservation expires, the backend restores the stock
  // We just need to remove expired items from cart
  const checkExpiredReservations = async () => {
    const now = new Date();
    let hasExpiredItems = false;

    for (const item of items) {
      if (item.expiresAt && item.reservationId) {
        const expiresAt = new Date(item.expiresAt);
        if (expiresAt < now) {
          hasExpiredItems = true;
          // Try to release the reservation on backend (restores stock)
          try {
            await stockReservationService.releaseReservation(item.reservationId);
          } catch (error) {
            console.error("Failed to release expired reservation:", error);
          }
          // Remove expired item from cart
          removeItem(item.productId, item.selectedSize, item.selectedColor);
        }
      }
    }

    if (hasExpiredItems) {
      toast.error("Some items in your cart have expired and were removed. Please add them again.");
    }
  };

  // Function to check stock availability for cart items
  // Only removes items that don't have an active reservation and are out of stock
  const checkStockAvailability = async () => {
    const itemsToRemove: Array<{productId: string | number; size: string; color: string; name: string}> = [];
    const itemsToUpdate: Array<{productId: string | number; size: string; color: string; newQuantity: number; name: string}> = [];

    for (const item of items) {
      // Skip items without variantId
      if (!item.variantId) continue;

      // Skip items with active reservation - they're still valid
      // The reservation will either be used (order placed) or released (expired/cancelled)
      if (item.reservationId) continue;

      try {
        const result = await stockReservationService.getAvailableStock(Number(item.variantId));
        if (result.success && result.data) {
          // If available stock is less than cart quantity, item needs adjustment
          if (result.data.availableStock < item.quantity) {
            if (result.data.availableStock === 0) {
              // No stock and no reservation - remove item
              itemsToRemove.push({
                productId: item.productId,
                size: item.selectedSize,
                color: item.selectedColor,
                name: item.productName
              });
            } else {
              // Reduce quantity to available stock
              itemsToUpdate.push({
                productId: item.productId,
                size: item.selectedSize,
                color: item.selectedColor,
                newQuantity: result.data.availableStock,
                name: item.productName
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to check stock for item:", item.productName, error);
      }
    }

    // Remove items that are no longer available
    if (itemsToRemove.length > 0) {
      itemsToRemove.forEach((item) => {
        removeItem(item.productId, item.size, item.color);
      });
      toast.error(
        `${itemsToRemove.length} item(s) in your cart are no longer available. Please review your cart.`
      );
    }

    // Update items with reduced quantity
    if (itemsToUpdate.length > 0) {
      itemsToUpdate.forEach((item) => {
        updateQuantity(item.productId, item.size, item.color, item.newQuantity);
      });
      toast.error(
        `Some items in your cart have reduced availability. Quantities have been updated.`
      );
    }
  };

  // Reset signup modal when cart closes - must be called before early return
  useEffect(() => {
    if (!isOpen) {
      // Small delay to allow animation to complete
      const timer = setTimeout(() => {
        setShowSignupModal(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Check for expired reservations and stock availability when cart opens
  useEffect(() => {
    if (!isOpen || !items.length) return;
    checkExpiredReservations();
    checkStockAvailability();
  }, [isOpen, items]);

  // Don't render until hydrated to prevent flash of empty content
  // The isHydrated flag is set by the persist middleware after rehydration
  if (!isHydrated) {
    return null;
  }

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Close cart and show signup modal
      closeCart();
      // Use setTimeout to ensure cart closes first, then show modal
      setTimeout(() => {
        setShowSignupModal(true);
      }, 350);
    } else {
      // User is logged in, proceed to checkout
      window.location.href = "/checkout";
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCart}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-9999 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag
                      className="w-5 h-5 text-primary"
                      strokeWidth={2}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-xl font-medium">
                      Shopping Bag
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      ({items?.length} {items?.length === 1 ? "item" : "items"})
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeCart}
                  className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                  aria-label="Close cart"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6"
                    >
                      <ShoppingBag
                        size={40}
                        className="text-muted-foreground/60"
                        strokeWidth={1.5}
                      />
                    </motion.div>
                    <h3 className="font-serif text-xl mb-2">
                      Your bag is empty
                    </h3>
                    <p className="text-sm text-muted-foreground mb-8 max-w-[240px]">
                      Discover our latest collection and add something beautiful
                      to your bag
                    </p>
                    <button
                      onClick={closeCart}
                      className="btn-primary-fashion rounded-full px-8"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-5">
                    {items.map((item, index) => (
                      <motion.li
                        key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex gap-4 group"
                      >
                        {/* Image */}
                        <div className="w-16 md:w-20 md:h-24 lg:w-24 lg:h-32 relative rounded-xl overflow-hidden bg-muted shrink-0 ring-1 ring-border/50 group-hover:ring-border transition-all">
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col min-w-0 py-1">
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors text-left">
                                {item.productName}
                              </h4>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs px-2 py-0.5 bg-muted rounded-md text-muted-foreground">
                                  {item.selectedSize}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ·
                                </span>
                                <span className="text-xs text-muted-foreground capitalize">
                                  {item.selectedColor}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                // Release reservation if exists before removing
                                if (item.reservationId) {
                                  const releaseResult = await stockReservationService.releaseReservation(item.reservationId);
                                  if (!releaseResult.success) {
                                    console.error("Failed to release reservation:", releaseResult.error);
                                  }
                                }
                                removeItem(
                                  item.productId,
                                  item.selectedSize,
                                  item.selectedColor
                                );
                              }}
                              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 hover:text-destructive rounded-full transition-all -mr-2 -mt-2"
                              aria-label="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                            <div className="mt-auto flex items-center justify-between gap-3">
                              {/* Quantity */}
                              <div className="flex items-center bg-muted/50 rounded-full border border-border/50">
                                <button
                                  onClick={() => {
                                    const result = updateQuantity(
                                      item.productId,
                                      item.selectedSize,
                                      item.selectedColor,
                                      item.quantity - 1
                                    );
                                    if (!result.success && result.message) {
                                      toast.error(result.message);
                                    }
                                  }}
                                  disabled={item.quantity <= 1}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-l-full"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={14} strokeWidth={2} />
                                </button>
                                <span className="w-8 text-center text-sm font-medium tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={async () => {
                                    // Issue #4: Validate against server stock before increment
                                    if (item.variantId) {
                                      try {
                                        const result = await stockReservationService.getAvailableStock(Number(item.variantId));
                                        if (result.success && result.data) {
                                          const serverAvailable = result.data.availableStock;
                                          const currentTotal = item.quantity; // Current in cart
                                          
                                          if (serverAvailable <= currentTotal) {
                                            if (serverAvailable === 0) {
                                              toast.error("This item is no longer available");
                                            } else {
                                              toast.error(`Only ${serverAvailable} available. You already have ${currentTotal} in your cart.`);
                                            }
                                            return;
                                          }
                                        }
                                      } catch (error) {
                                        console.error("Failed to check stock:", error);
                                        // Fall back to local validation
                                      }
                                    }
                                    
                                    const result = updateQuantity(
                                      item.productId,
                                      item.selectedSize,
                                      item.selectedColor,
                                      item.quantity + 1
                                    );
                                    if (!result.success && result.message) {
                                      toast.error(result.message);
                                    }
                                  }}
                                  disabled={!item.variantStock || item.quantity >= item.variantStock}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-r-full"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={14} strokeWidth={2} />
                                </button>
                              </div>

                              {/* Stock indicator */}
                              {item.variantStock !== undefined && item.variantStock > 0 && (
                                <span className={`text-xs ${item.quantity >= item.variantStock ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                  {item.quantity >= item.variantStock 
                                    ? 'Max stock' 
                                    : `${item.variantStock - item.quantity} left`}
                                </span>
                              )}

                              {/* Price */}
                              <p className="font-semibold text-sm">
                                ৳
                                {(
                                  item.productPrice * item.quantity
                                ).toLocaleString()}
                              </p>
                            </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-border/50 bg-muted/20 px-6 py-6 space-y-5">
                  {/* Subtotal */}
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">
                      Subtotal
                    </span>
                    <span className="text-2xl font-semibold tracking-tight">
                      ৳{getTotal().toLocaleString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <button
                      onClick={closeCart}
                      className="text-center py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-3/4 hover:border-2 hover:border-muted-foreground rounded-lg"
                    >
                      Continue Shopping
                    </button>

                    <button
                      onClick={handleCheckout}
                      className="w-4/5 btn-primary-fashion rounded-lg py-3.5 text-sm font-medium cursor-pointer"
                    >
                      Checkout
                    </button>
                  </div>

                  {/* Shipping Note */}
                  <p className="text-xs text-muted-foreground text-center">
                    Shipping & taxes calculated at checkout
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Signup Modal - rendered independently */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />

      {/* Toast notifications */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  );
};
