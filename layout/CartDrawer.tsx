"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, Clock } from "lucide-react";

import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { stockReservationService } from "@/services/stock-reservation.service";
import { getGuestToken, removeFromCart } from "@/lib/cart";

export const CartDrawer = () => {
  const { items, isOpen, closeCart, removeItem, getTotal, isHydrated } =
    useCartStore();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [variantStockMap, setVariantStockMap] = useState<
    Record<string | number, number>
  >({});
  const [, setTick] = useState(0);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Function to check and release expired reservations
  const checkExpiredReservations = async () => {
    const now = new Date();
    let hasExpiredItems = false;

    for (const item of items) {
      if (item.expiresAt && item.reservationId) {
        const expiresAt = new Date(item.expiresAt);
        if (expiresAt < now) {
          hasExpiredItems = true;
          try {
            const accessToken = typeof window !== 'undefined'
              ? localStorage.getItem('accessToken')
              : null;

            if (accessToken) {
              await stockReservationService.releaseReservation(
                item.reservationId
              );
            } else {
              const guestToken = getGuestToken();
              if (guestToken) {
                await removeFromCart(item.reservationId);
              } else {
                await stockReservationService.releaseReservation(
                  item.reservationId
                );
              }
            }
          } catch (error) {
            const errorObj = error as {
              response?: { data?: { message?: string } };
            };
            const errorMessage = errorObj?.response?.data?.message || "";
            if (
              errorMessage.includes("not found") ||
              errorMessage.includes("already released") ||
              errorMessage.includes("expired")
            ) {
              console.log(
                "Reservation already expired on backend, removing from cart:",
                item.reservationId
              );
            } else {
              console.error("Failed to release expired reservation:", error);
            }
          }
          removeItem(item.productId, item.selectedSize, item.selectedColor);
        }
      }
    }

    if (hasExpiredItems) {
      toast.error(
        "Some items in your cart have expired and were removed. Please add them again."
      );
    }
  };

  // Function to check stock availability
  const checkStockAvailability = async () => {
    const itemsToRemove: Array<{
      productId: string | number;
      size: string;
      color: string;
      name: string;
    }> = [];
    const itemsToUpdate: Array<{
      productId: string | number;
      size: string;
      color: string;
      newQuantity: number;
      name: string;
    }> = [];
    const newStockMap: Record<string | number, number> = {};

    for (const item of items) {
      if (!item.variantId) continue;

      if (item.reservationId) {
        newStockMap[item.variantId] = item.quantity;
        continue;
      }

      try {
        const result = await stockReservationService.getAvailableStock(
          Number(item.variantId)
        );
        if (result.success && result.data) {
          newStockMap[item.variantId] = result.data.availableStock;

          if (result.data.availableStock < item.quantity) {
            if (result.data.availableStock === 0) {
              itemsToRemove.push({
                productId: item.productId,
                size: item.selectedSize,
                color: item.selectedColor,
                name: item.productName,
              });
            } else {
              itemsToUpdate.push({
                productId: item.productId,
                size: item.selectedSize,
                color: item.selectedColor,
                newQuantity: result.data.availableStock,
                name: item.productName,
              });
            }
          }
        }
      } catch (error) {
        console.error(
          "Failed to check stock for item:",
          item.productName,
          error
        );
      }
    }

    setVariantStockMap(newStockMap);

    if (itemsToRemove.length > 0) {
      itemsToRemove.forEach((item) => {
        removeItem(item.productId, item.size, item.color);
      });
      toast.error(
        `${itemsToRemove.length} item(s) in your cart are no longer available. Please review your cart.`
      );
    }
  };

  const getTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Check for expired reservations and stock availability when cart opens
  useEffect(() => {
    if (!isOpen || !items.length) return;
    const checkCart = async () => {
      setVariantStockMap({});
      await checkExpiredReservations();
      await checkStockAvailability();
    };
    checkCart();
  }, [isOpen]);

  if (!isHydrated) {
    return null;
  }

  const handleCheckout = () => {
    closeCart();
    setTimeout(() => {
      router.push("/checkout");
    }, 350);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCart}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-9999 shadow-2xl flex flex-col"
            >
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
                        <div className="w-16 md:w-20 md:h-24 lg:w-24 lg:h-32 relative rounded-xl overflow-hidden bg-muted shrink-0 ring-1 ring-border/50 group-hover:ring-border transition-all">
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>

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
                            {item.reservationId && item.expiresAt && (
                              <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                                <Clock size={12} />
                                <span className="tabular-nums">
                                  {getTimeRemaining(item.expiresAt)}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                Qty:
                              </span>
                              <span className="text-sm font-medium tabular-nums">
                                {item.quantity}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {item.hasDiscount && item.finalPrice ? (
                                <>
                                  <span className="text-sm text-muted-foreground line-through decoration-2">
                                    ৳
                                    {(
                                      item.productPrice * item.quantity
                                    ).toLocaleString()}
                                  </span>
                                  <span className="font-semibold text-sm">
                                    ৳
                                    {(
                                      item.finalPrice * item.quantity
                                    ).toLocaleString()}
                                  </span>
                                </>
                              ) : (
                                <span className="font-semibold text-sm">
                                  ৳
                                  {(
                                    item.productPrice * item.quantity
                                  ).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-border/50 bg-muted/20 px-6 py-6 space-y-5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">
                      Subtotal
                    </span>
                    <span className="text-2xl font-semibold tracking-tight">
                      ৳{getTotal().toLocaleString()}
                    </span>
                  </div>

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

                  <p className="text-xs text-muted-foreground text-center">
                    Shipping & taxes calculated at checkout
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
    </>
  );
};
