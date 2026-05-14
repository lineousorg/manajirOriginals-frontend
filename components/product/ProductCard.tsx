"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Heart, ShoppingBag, Eye, ArrowUpRight, Sparkles } from "lucide-react";
import { ApiProduct, ProductVariant } from "@/types";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: ApiProduct;
  index?: number;
}

export const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const router = useRouter();
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageHovered, setImageHovered] = useState(false);

  const productId = String(product.id);
  const inWishlist = isInWishlist(productId);

  // ─── Pricing Data ───
  const hasDiscount =
    product.pricing?.hasDiscount ?? product.hasDiscount ?? false;
  const minPrice = Number(product.pricing?.minPrice ?? product.minPrice ?? 0);
  const maxPrice = Number(product.pricing?.maxPrice ?? product.maxPrice ?? 0);
  const minFinalPrice =
    product.pricing?.finalMinPrice ?? product.minFinalPrice ?? 0;
  const discountValue =
    product.pricing?.discount?.value ?? product.discountAmount ?? 0;
  const discountType =
    product.pricing?.discount?.type ?? product.discountType ?? null;
  const savedAmount = product.pricing?.discount?.savedAmount ?? 0;

  // ─── Stock Calculation ───
  const cartItems = useCartStore((state) => state.items);

  const cartQuantity = useMemo(() => {
    return cartItems
      .filter((item) => String(item.productId) === String(product.id))
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems, product.id]);

  const availableStockCount = useMemo(() => {
    let totalStock: number;
    if (!product?.variants || product.variants.length === 0) {
      totalStock = product?.totalStock ?? product?.stock ?? 0;
    } else {
      totalStock = product.variants.reduce(
        (total: number, variant: ProductVariant) => {
          return total + (variant.stock > 0 ? variant.stock : 0);
        },
        0,
      );
    }
    return Math.max(0, totalStock - cartQuantity);
  }, [product, cartQuantity]);

  const hasAvailableVariants = availableStockCount > 0;
  const isLowStock = hasAvailableVariants && availableStockCount < 10;
  const isOutOfStock = !hasAvailableVariants;

  // ─── Color Handling ───
  const hasMultipleColors =
    product.colors &&
    product.colors.length > 1 &&
    product.colors.some((c) => c.name && c.name.trim() !== "");

  const displayColors = product.colors?.slice(0, 5) ?? [];
  const remainingColors = (product.colors?.length ?? 0) - 5;

  // ─── Handlers ───
  const handleWishlistClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
      toggleItem({
        ...product,
        id: productId,
        images: product.images,
      });
    },
    [isAuthenticated, product, productId, router, toggleItem],
  );

  const handleProductClick = useCallback(() => {
    router.push(`/products/${product.id}`);
  }, [router, product.id]);

  // ─── Animation Variants ───
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.06,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  const imageZoomVariants: Variants = {
    rest: { scale: 1 },
    hover: {
      scale: 1.08,
      transition: {
        duration: 0.7,
        ease: [0.33, 1, 0.68, 1] as [number, number, number, number],
      },
    },
  };

  const overlayVariants: Variants = {
    rest: { opacity: 0 },
    hover: {
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const buttonVariants: Variants = {
    rest: { y: 20, opacity: 0 },
    hover: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.35,
        ease: [0.33, 1, 0.68, 1] as [number, number, number, number],
      },
    },
  };

  const badgeVariants: Variants = {
    initial: { scale: 0, rotate: -10 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 300, damping: 15, delay: 0.2 },
    },
  };

  // ─── Price Formatter ───
  const formatPrice = (price: number) => {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Calculate discount percentage for display
  const discountPercentage =
    hasDiscount && discountType === "PERCENTAGE"
      ? discountValue
      : hasDiscount && minPrice > 0
        ? Math.round(
            ((minPrice - (minFinalPrice || minPrice)) / minPrice) * 100,
          )
        : 0;

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer
                 shadow-[0_2px_8px_rgba(0,0,0,0.04)] 
                 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]
                 transition-shadow duration-500 ease-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setImageHovered(false);
      }}
      onClick={handleProductClick}
    >
      {/* ═══════════════════════════════════════
          IMAGE CONTAINER
         ═══════════════════════════════════════ */}
      <div className="relative aspect-4/4 overflow-hidden bg-neutral-100">
        {/* Skeleton Loader */}
        <AnimatePresence>
          {!imageLoaded && !imageError && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-neutral-200"
            >
              <div
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                style={{ backgroundSize: "200% 100%" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Image */}
        <motion.div
          className="w-full h-full"
          variants={imageZoomVariants}
          initial="rest"
          animate={imageHovered ? "hover" : "rest"}
          onMouseEnter={() => setImageHovered(true)}
          onMouseLeave={() => setImageHovered(false)}
        >
          <Image
            src={product?.thumbnail || "/placeholder-product.jpg"}
            alt={product.name || "Product Image"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
            style={{
              opacity: imageLoaded ? 1 : 0,
              transition: "opacity 0.4s ease",
            }}
          />
        </motion.div>

        {/* Dark Gradient Overlay on Hover */}
        <motion.div
          className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent"
          variants={overlayVariants}
          initial="rest"
          animate={isHovered ? "hover" : "rest"}
        />

        {/* ═══════════════════════════════════════
            BADGES - Top Left
           ═══════════════════════════════════════ */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {/* Discount Badge - Premium Style */}
          {hasDiscount && discountPercentage > 0 && (
            <motion.div
              variants={badgeVariants}
              initial="initial"
              animate="animate"
              className="inline-flex items-center gap-1 px-3 py-1.5 
                         bg-red-900/70 text-white text-[11px] font-bold tracking-wide uppercase
                         rounded-lg shadow-lg shadow-rose-500/25"
            >
              <Sparkles size={12} className="fill-white" />
              {discountPercentage}% OFF
            </motion.div>
          )}

          {/* New Arrival / Category Badge */}
          {/* {product.category?.name && (
            <span
              className="inline-flex items-center px-3 py-1 
                           bg-white/90 backdrop-blur-sm text-neutral-700 
                           text-[10px] font-medium tracking-wider uppercase
                           rounded-lg shadow-sm"
            >
              {product.category.name}
            </span>
          )} */}

          {/* Unavailable Badge */}
          {!product.isActive && (
            <span
              className="inline-flex items-center px-3 py-1 
                           bg-neutral-400 text-white text-[10px] font-medium 
                           tracking-wider uppercase rounded-lg"
            >
              Unavailable
            </span>
          )}
        </div>

        {/* ═══════════════════════════════════════
            STOCK INDICATORS
           ═══════════════════════════════════════ */}
        {/* Low Stock Badge */}
        {/* {isLowStock && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute bottom-3 left-3 z-10"
          >
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 
                           bg-amber-50 text-amber-700 text-[11px] font-semibold 
                           rounded-lg border border-amber-200 shadow-sm"
            >
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Only {availableStockCount} left
            </span>
          </motion.div>
        )} */}

        {/* Out of Stock Overlay */}
        <AnimatePresence>
          {isOutOfStock && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/40 backdrop-blur-[2px] 
                         flex items-center justify-center z-20"
            >
              <span
                className="px-5 py-2.5 bg-neutral-900 text-white text-xs 
                             font-semibold tracking-wider uppercase rounded-full
                             shadow-xl"
              >
                Out of Stock
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════
            ACTION BUTTONS - Top Right
           ═══════════════════════════════════════ */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10"></div>

        {/* ═══════════════════════════════════════
            BOTTOM ACTION BAR - Appears on Hover
           ═══════════════════════════════════════ */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-3 z-10"
          variants={buttonVariants}
          initial="rest"
          animate={isHovered ? "hover" : "rest"}
        >
          <div className="flex gap-2">
            {/* Quick View Button */}
            {/* <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/products/${product.id}`);
              }}
              className="flex-1 flex items-center justify-center gap-2 
                         bg-white/95 backdrop-blur-sm text-neutral-800 
                         px-4 py-3 rounded-xl text-sm font-medium
                         hover:bg-white transition-colors duration-200
                         shadow-lg shadow-black/10"
            >
              <Eye size={16} />
              Quick View
            </button> */}

            {/* Add to Cart / Shop Now Button */}
            {!isOutOfStock ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/products/${product.id}`);
                }}
                className="flex items-center justify-center gap-2 
                           bg-neutral-900 text-white 
                           px-5 py-3 rounded-xl text-sm font-semibold
                           hover:bg-neutral-800 transition-colors duration-200
                           shadow-lg shadow-black/20"
              >
                <ShoppingBag size={16} />
                Shop Now
              </button>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-2 
                           bg-neutral-300 text-neutral-500 
                           px-5 py-3 rounded-xl text-sm font-medium
                           cursor-not-allowed"
              >
                <ShoppingBag size={16} />
                Unavailable
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════
          PRODUCT INFO SECTION
         ═══════════════════════════════════════ */}
      <div className="p-4 space-y-3">
        {/* Category Tag */}
        {product.category?.name && (
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            {product.category.name}
          </span>
        )}

        {/* Product Name */}
        <h3 className="text- font-semibold text-neutral-600 leading-snug line-clamp-2 group-hover:text-neutral-600 transition-colors duration-300 font-sans">
          {product.name}
        </h3>

        {/* Color Swatches */}
        {hasMultipleColors && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {displayColors.map((color, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: idx * 0.05,
                    type: "spring",
                    stiffness: 400,
                  }}
                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm 
                             relative hover:z-10 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            {remainingColors > 0 && (
              <span className="text-[11px] text-neutral-400 font-medium">
                +{remainingColors} more
              </span>
            )}
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-end justify-between pt-1">
          <div className="flex items-baseline gap-2">
            {/* Current Price */}
            <span className="text-lg font-bold text-neutral-900 tracking-tight">
              ৳
              {formatPrice(
                hasDiscount && minFinalPrice > 0 ? minFinalPrice : minPrice,
              )}
            </span>

            {/* Original Price (strikethrough) */}
            {hasDiscount && maxPrice > (minFinalPrice || minPrice) && (
              <span className="text-sm text-neutral-400 line-through font-medium">
                ৳{formatPrice(maxPrice)}
              </span>
            )}
          </div>

          {/* Savings Amount */}
          {/* {hasDiscount && savedAmount > 0 && (
            <span
              className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 
                           px-2 py-1 rounded-md"
            >
              Save ৳{formatPrice(savedAmount)}
            </span>
          )} */}
        </div>

        {/* Bottom Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
          {/* Stock Status */}
          <div className="flex items-center gap-1.5">
            {isOutOfStock ? (
              <span className="text-[11px] text-neutral-400 font-medium">
                Out of stock
              </span>
            ) : isLowStock ? (
              <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                <span className="w-1 h-1 bg-amber-500 rounded-full" />
                Low stock
              </span>
            ) : (
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                In stock
              </span>
            )}
          </div>

          <div className="flex gap-3">
            {/* Wishlist Button */}
            <motion.button
              onClick={handleWishlistClick}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`rounded-xl transition-all duration-300 cursor-pointer
                       ${
                         inWishlist
                           ? "bg-rose-500 text-white shadow-rose-500/30"
                           : "bg-white/80 text-neutral-400 hover:bg-white hover:text-rose-500 shadow-black/5"
                       }`}
            >
              <Heart
                size={18}
                fill={inWishlist ? "currentColor" : "none"}
                strokeWidth={inWishlist ? 0 : 2}
              />
            </motion.button>

            {/* Arrow Link */}
            <motion.div
              animate={{ x: isHovered ? 4 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-neutral-400 group-hover:text-neutral-800 transition-colors"
            >
              <ArrowUpRight size={18} strokeWidth={2} />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
