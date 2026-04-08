/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

const CartPage = () => {
  const { items, removeItem, updateQuantity, getTotal, clearCart, isHydrated } =
    useCartStore();

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
  const shipping = deliveryLocation === "inside_dhaka" ? 70 : 150;
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
    <div className="container-fashion py-8 md:py-12 mt-20 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="heading-section">Shopping Bag</h1>
        <button
          onClick={clearCart}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item, index) => (
            <motion.div
              key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-3 md:gap-6 pb-6 border-b border-border"
            >
              <Link
                href={`/products/${item.productId}`}
                className="w-20 h-24 md:w-28 md:h-36 shrink-0 overflow-hidden rounded-lg relative"
              >
                <Image
                  src={item.productImage}
                  alt={item.productName}
                  fill
                  sizes="(max-width: 768px) 80px, 112px"
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </Link>

              <div className="flex-1 flex flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.selectedSize} · {item.selectedColor}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      removeItem(
                        item.productId,
                        item.selectedSize,
                        item.selectedColor
                      )
                    }
                    className="p-2 hover:bg-muted rounded-full transition-colors h-fit"
                    aria-label="Remove item"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-auto flex items-end justify-between">
                  <div className="flex items-center border border-border rounded-md py-2 px-4">
                    <span className="text-sm font-medium">
                      {item.quantity}
                    </span>
                  </div>
                  <p className="text-lg font-medium">
                    ৳{item.productPrice * item.quantity}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:sticky lg:top-28 lg:self-start"
        >
          <div className="bg-muted/30 rounded-xl p-4 md:p-6">
            <h2 className="font-serif text-xl mb-6">Order Summary</h2>

            {/* Delivery Location Selection */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3">Delivery Location</h4>
              <div className="space-y-2">
                <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${deliveryLocation === "inside_dhaka" ? "border-primary bg-primary/5" : "border-border hover:border-foreground/50"}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="deliveryLocation"
                      checked={deliveryLocation === "inside_dhaka"}
                      onChange={() => setDeliveryLocation("inside_dhaka")}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Inside Dhaka</span>
                  </div>
                  <span className="font-medium">৳70</span>
                </label>
                <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${deliveryLocation === "outside_dhaka" ? "border-primary bg-primary/5" : "border-border hover:border-foreground/50"}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="deliveryLocation"
                      checked={deliveryLocation === "outside_dhaka"}
                      onChange={() => setDeliveryLocation("outside_dhaka")}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Outside Dhaka</span>
                  </div>
                  <span className="font-medium">৳150</span>
                </label>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>৳ {subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>৳ {shipping}</span>
              </div>
              <div className="border-t border-border pt-4 flex justify-between text-base font-medium">
                <span>Total</span>
                <span>৳ {total}</span>
              </div>
            </div>

            <Link href="/checkout" className="btn-primary-fashion w-full mt-6">
              Proceed to Checkout
              <ArrowRight size={18} className="ml-2" />
            </Link>

            <Link
              href="/products"
              className="block text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CartPage;
