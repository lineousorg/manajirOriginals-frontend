"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cart.store";
import { isInAppBrowser } from "@/lib/isInAppBrowser";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Floating Cart Button
 *
 * A mobile-friendly floating button that appears in the bottom-right corner
 * when the cart has items. Replaces the broken drawer experience in in-app
 * browsers (Facebook, Instagram, Messenger) by navigating directly to /cart.
 *
 * Behavior:
 * - Hidden on desktop (md+ screens)
 * - Only visible when cart has items
 * - Navigates to /cart on click (no drawer)
 */
export const FloatingCartButton = () => {
  const { getItemCount, isHydrated } = useCartStore();
  const isMobile = useIsMobile();
  const cartCount = getItemCount();
  const inAppBrowser = isInAppBrowser();

  // Only show on mobile/in-app browsers, and only when cart has items
  if (!isHydrated || cartCount === 0) return null;
  if (!isMobile && !inAppBrowser) return null;

  return (
    <Link
      href="/cart"
      className="fixed bottom-6 right-6 z-50 md:hidden flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-black/25 hover:bg-primary/90 active:scale-90 transition-all duration-200"
      aria-label={`View cart with ${cartCount} item${cartCount === 1 ? "" : "s"}`}
    >
      <div className="relative">
        <ShoppingBag size={24} strokeWidth={2} />
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-black text-[10px] font-bold rounded-full flex items-center justify-center">
          {cartCount}
        </span>
      </div>
    </Link>
  );
};