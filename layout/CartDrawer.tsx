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
import { GTMItem, trackBeginCheckout } from "@/lib/gtm";
import { DELIVERY_CHARGES } from "@/lib/constants";
import { isInAppBrowser } from "@/lib/isInAppBrowser";

export const CartDrawer = () => {
  const { items, isOpen, closeCart, removeItem, getTotal, isHydrated } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [variantStockMap, setVariantStockMap] = useState<
    Record<string | number, number>
  >({});
  const [, setTick] = useState(0);
  const [deliveryLocation, setDeliveryLocation] = useState<
    "inside_dhaka" | "outside_dhaka"
  >("inside_dhaka");

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
            const accessToken =
              typeof window !== "undefined"
                ? localStorage.getItem("accessToken")
                : null;

            if (accessToken) {
              await stockReservationService.releaseReservation(
                item.reservationId,
              );
            } else {
              const guestToken = getGuestToken();
              if (guestToken) {
                await removeFromCart(item.reservationId);
              } else {
                await stockReservationService.releaseReservation(
                  item.reservationId,
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
                item.reservationId,
              );
            } else {
              console.error("Failed to release expired reservation:", error);
            }
          }
          removeItem(
            item.productId,
            item.selectedAttributes,
            true,
          );
        }
      }
    }

    if (hasExpiredItems) {
      toast.error(
        "Some items in your cart have expired and were removed. Please add them again.",
      );
    }
  };

  // Function to check stock availability
  const checkStockAvailability = async () => {
    const itemsToRemove: Array<{
      productId: string | number;
      selectedAttributes: Record<string, string>;
      name: string;
    }> = [];
    const itemsToUpdate: Array<{
      productId: string | number;
      selectedAttributes: Record<string, string>;
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
          Number(item.variantId),
        );
        if (result.success && result.data) {
          newStockMap[item.variantId] = result.data.availableStock;

          if (result.data.availableStock < item.quantity) {
            if (result.data.availableStock === 0) {
              itemsToRemove.push({
                productId: item.productId,
                selectedAttributes: item.selectedAttributes,
                name: item.productName,
              });
            } else {
              itemsToUpdate.push({
                productId: item.productId,
                selectedAttributes: item.selectedAttributes,
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
          error,
        );
      }
    }

    setVariantStockMap(newStockMap);

    if (itemsToRemove.length > 0) {
      itemsToRemove.forEach((item) => {
        removeItem(item.productId, item.selectedAttributes);
      });
      toast.error(
        `${itemsToRemove.length} item(s) in your cart are no longer available. Please review your cart.`,
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

  // In-app browsers (Facebook, Instagram, Messenger) cannot render the drawer
  // reliably due to WebView limitations. Hide the drawer in those environments.
  if (isInAppBrowser()) {
    return null;
  }

  const subtotal = getTotal();
  const shipping =
    deliveryLocation === "inside_dhaka"
      ? DELIVERY_CHARGES.INSIDE_DHAKA
      : DELIVERY_CHARGES.OUTSIDE_DHAKA;
  const total = subtotal + shipping;

   const checkoutItems: GTMItem[] = items.map((item) => {
     // Extract first two attributes for GTM tracking (maintaining backward compatibility)
     const attributes = Object.entries(item.selectedAttributes);
     const itemCategory = attributes.length > 0 ? attributes[0][1] : "";
     const itemBrand = attributes.length > 1 ? attributes[1][1] : "";
     
     return {
       item_id: String(item.variantId ?? item.productId),
       item_name: item.productName,
       price: item.finalPrice ?? item.productPrice,
       quantity: item.quantity,
       item_category: itemCategory,
       item_brand: itemBrand,
     };
   });

  const handleCheckout = () => {
    closeCart();
    trackBeginCheckout(checkoutItems, total);
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
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-background z-[9999] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag
                      className="w-4 h-4 text-primary"
                      strokeWidth={2}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-serif text-lg font-medium">Your Bag</h2>
                    <span className="text-[11px] text-muted-foreground">
                      ({items?.length})
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeCart}
                  className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                  aria-label="Close cart"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="w-20 h-20 rounded-full bg-muted/40 flex items-center justify-center mb-5"
                    >
                      <ShoppingBag
                        size={32}
                        className="text-muted-foreground/50"
                        strokeWidth={1.5}
                      />
                    </motion.div>
                    <h3 className="font-serif text-lg mb-1.5">
                      Your bag is empty
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-[220px]">
                      Discover our latest collection and add something beautiful
                    </p>
                    <button
                      onClick={closeCart}
                      className="btn-primary-fashion rounded-full px-7 py-2.5 text-sm"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {items.map((item, index) => (
                      <motion.li
                        key={`${item.productId}-${JSON.stringify(item.selectedAttributes)}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.3 }}
                        exit={{ opacity: 0, x: -80 }}
                        className="flex gap-3 group"
                      >
                        {/* Product Image */}
                        <div className="w-16 h-20 relative rounded-lg overflow-hidden bg-muted shrink-0 ring-1 ring-border/40">
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            sizes="64px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 flex flex-col min-w-0 py-0.5">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors text-left">
                                {item.productName}
                              </h4>
                               <div className="flex items-center gap-1.5 mt-1">
                                 {Object.entries(item.selectedAttributes).map(([name, value]) => (
                                   <>
                                     <span key={name} className="text-[11px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground font-medium">
                                       {value}
                                     </span>
                                     <span className="text-[11px] text-muted-foreground">
                                       ·
                                     </span>
                                   </>
                                 ))}
                               </div>
                            </div>
                            <button
                              onClick={async () => {
                                const result = await removeItem(
                                  item.productId,
                                  item.selectedAttributes,
                                );
                                if (result.success) {
                                  toast.success(
                                    result.message || "Item removed from your cart.",
                                  );
                                } else {
                                  toast.error(
                                    result.message ||
                                    "Failed to fully remove item from your cart.",
                                  );
                                }
                              }}
                              className="opacity-100 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-full transition-all -mr-1 -mt-1 shrink-0"
                              aria-label="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                            {item.reservationId && item.expiresAt && (
                              <div className="flex items-center gap-1 text-[11px] text-orange-600 dark:text-orange-400">
                                <Clock size={11} />
                                <span className="tabular-nums">
                                  {getTimeRemaining(item.expiresAt)}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 ml-auto">
                              <span className="text-xs text-muted-foreground">
                                ×{item.quantity}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {item.hasDiscount && item.finalPrice ? (
                                <>
                                  <span className="text-xs text-muted-foreground line-through decoration-2">
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

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-border/40 bg-muted/10 px-4 py-4 space-y-3 shrink-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">
                      Subtotal
                    </span>
                    <span className="text-xl font-semibold tracking-tight">
                      ৳{getTotal().toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleCheckout}
                      className="w-full btn-primary-fashion rounded-xl py-3 text-sm font-medium cursor-pointer"
                    >
                      Checkout
                    </button>
                    <button
                      onClick={closeCart}
                      className="w-full text-center py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-xl hover:bg-muted/50"
                    >
                      Continue Shopping
                    </button>
                  </div>

                  <p className="text-[11px] text-muted-foreground text-center">
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
