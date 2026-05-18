"use client";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Minus, Plus, X, ShoppingBag, ArrowRight, Clock } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { trackBeginCheckout, type GTMItem } from "@/lib/gtm";
import { DELIVERY_CHARGES } from "@/lib/constants";
import toast from "react-hot-toast";

const CartPage = () => {
  const { items, removeItem, updateQuantity, getTotal, clearCart, isHydrated } =
    useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [deliveryLocation, setDeliveryLocation] = useState<
    "inside_dhaka" | "outside_dhaka"
  >("inside_dhaka");

  // Show loading skeleton while hydrating to prevent layout shift
  if (!isHydrated) {
    return (
      <div className="container-fashion py-8 md:py-12 mt-20 min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div className="h-10 w-40 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-6 pb-6 border-b border-border">
                <div className="w-28 h-36 bg-gray-200 animate-pulse rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-3/4 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-6 w-20 bg-gray-200 animate-pulse rounded mt-4"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-8 w-full bg-gray-200 animate-pulse rounded"></div>
            <div className="h-12 w-full bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getTotal();
  const shipping =
    deliveryLocation === "inside_dhaka"
      ? DELIVERY_CHARGES.INSIDE_DHAKA
      : DELIVERY_CHARGES.OUTSIDE_DHAKA;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="border flex items-center justify-center py-16 min-h-[90dvh] pt-40">
        <EmptyState
          icon={<ShoppingBag size={64} />}
          title="Your bag is empty"
          description="Looks like you haven't added anything to your bag yet."
          action={
            <Link href="/products" className="btn-primary-fashion rounded-lg">
              Start Shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-fashion py-6 md:py-10 mt-16 md:mt-20 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <h1 className="font-serif text-xl md:text-2xl font-medium tracking-tight">
          Shopping Bag
        </h1>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs md:text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-20 md:py-28 text-center"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted/40 flex items-center justify-center mb-4">
            <ShoppingBag
              size={28}
              className="text-muted-foreground/40"
              strokeWidth={1.5}
            />
          </div>
          <h2 className="font-serif text-lg md:text-xl mb-1.5">
            Your bag is empty
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-[260px]">
            Discover our latest collection and add something beautiful
          </p>
          <Link
            href="/products"
            className="btn-primary-fashion rounded-full px-6 py-2.5 text-sm"
          >
            Start Shopping
          </Link>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5 md:gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4 md:space-y-5">
            {items.map((item, index) => (
              <motion.div
                key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.35 }}
                className="flex gap-3 md:gap-4 pb-4 md:pb-5 border-b border-border/50 bg-gray-100 p-4 rounded-xl"
              >
                {/* Product Image */}
                <Link
                  href={`/products/${item.productId}`}
                  className="w-[72px] h-[90px] md:w-24 md:h-30 shrink-0 overflow-hidden rounded-lg relative bg-muted"
                >
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    sizes="(max-width: 768px) 72px, 96px"
                    className="object-cover hover:scale-105 transition-transform duration-400"
                  />
                </Link>

                {/* Product Details */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex justify-between gap-3 text-left">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.productId}`}
                        className="text-sm md:text-[15px] font-medium hover:text-primary transition-colors text-left line-clamp-2 leading-snug"
                      >
                        {item.productName}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] md:text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground font-medium">
                          {item.selectedSize}
                        </span>
                        <span className="text-[11px] md:text-xs text-muted-foreground">
                          ·
                        </span>
                        <span className="text-[11px] md:text-xs text-muted-foreground capitalize">
                          {item.selectedColor}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const result = await removeItem(
                          item.productId,
                          item.selectedSize,
                          item.selectedColor,
                        );
                        if (result.success) {
                          toast.success(result.message || "Item removed from your cart.");
                        } else {
                          toast.error(result.message || "Failed to fully remove item from your cart.");
                        }
                      }}
                      className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors h-fit shrink-0 -mr-1 -mt-1"
                      aria-label="Remove item"
                    >
                      <X size={15} strokeWidth={2} />
                    </button>
                  </div>

                  <div className="mt-auto flex items-end justify-between pt-2">
                    <div className="flex items-center gap-1">
                      {item.reservationId && item.expiresAt && (
                        <div className="flex items-center gap-1 text-[11px] text-orange-600 dark:text-orange-400 mr-2">
                          <Clock size={11} />
                          <span className="tabular-nums">
                            {/* {getTimeRemaining(item.expiresAt)} */}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Qty:{" "}
                        <span className="font-medium text-foreground">
                          {item.quantity}
                        </span>
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
                          <span className="text-sm md:text-base font-semibold">
                            ৳
                            {(item.finalPrice * item.quantity).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm md:text-base font-semibold">
                          ৳
                          {(item.productPrice * item.quantity).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <div className="bg-muted/20 rounded-xl p-4 md:p-5 border border-border/40">
              <h2 className="font-serif text-lg md:text-xl mb-4 md:mb-5">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs md:text-sm">
                    Subtotal
                  </span>
                  <span className="font-medium text-sm">৳ {subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs md:text-sm">
                    Shipping
                  </span>
                  <span className="font-medium text-sm">৳ {shipping}</span>
                </div>
                <div className="border-t border-border/60 pt-3 flex justify-between">
                  <span className="font-medium text-sm md:text-[15px]">
                    Total
                  </span>
                  <span className="font-semibold text-base md:text-lg">
                    ৳ {total}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="btn-primary-fashion w-full mt-5 rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight size={16} strokeWidth={2} />
              </Link>

              <Link
                href="/products"
                className="block text-center text-xs md:text-sm text-muted-foreground hover:text-foreground mt-3 py-2 transition-colors rounded-lg hover:bg-muted/40"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
