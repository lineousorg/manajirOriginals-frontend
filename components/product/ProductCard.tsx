"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { ApiProduct, ProductVariant } from "@/types";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MdArrowOutward } from "react-icons/md";

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

  const productId = String(product.id);
  const inWishlist = isInWishlist(productId);

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [
          {
            url: "https://placehold.co/600x800?text=No+Image",
            altText: "No Image",
          },
        ];

  // Use new API discount fields
  const hasDiscount = product.hasDiscount ?? false;
  const discountAmount = product.discountAmount ?? 0;
  const minPrice = Number(product.minPrice || 0);
  const maxPrice = Number(product.maxPrice || 0);
  
  // Calculate discount percentage if not provided
  const discountPercent = hasDiscount && maxPrice > minPrice 
    ? Math.round(((maxPrice - minPrice) / maxPrice) * 100)
    : (discountAmount > 0 ? discountAmount : null);
  
  const originalPrice = hasDiscount ? maxPrice : null;

  // Get cart items to calculate available stock
  const cartItems = useCartStore((state) => state.items);
  
  // Calculate quantity of this product already in cart
  const cartQuantity = useMemo(() => {
    return cartItems
      .filter((item) => String(item.productId) === String(product.id))
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems, product.id]);

  // Issue #8: Calculate stock based on variants with available stock
  // This ensures we don't show "In Stock" when all specific variants are out
  // Using [product, cartQuantity] as dependency to match what React Compiler infers
  const availableStockCount = useMemo(() => {
    let totalStock: number;
    if (!product?.variants || product.variants.length === 0) {
      // Use totalStock if available, otherwise fall back to stock
      totalStock = product?.totalStock ?? product?.stock ?? 0;
    } else {
      // Sum up stock from variants that have stock > 0
      totalStock = product.variants.reduce((total: number, variant: ProductVariant) => {
        return total + (variant.stock > 0 ? variant.stock : 0);
      }, 0);
    }
    // Subtract what's already in the cart to show available stock
    return Math.max(0, totalStock - cartQuantity);
  }, [product, cartQuantity]);

  const hasAvailableVariants = availableStockCount > 0;
  const isLowStock = hasAvailableVariants && availableStockCount < 10;
  const isOutOfStock = !hasAvailableVariants;

  // Check if product has multiple colors (and has valid color values, not empty/placeholder)
  const hasMultipleColors = product.colors && product.colors.length > 1 && product.colors.some(c => c.name && c.name.trim() !== "");

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1],
      }}
      className="group relative bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-slate-200 drop-shadow-lg hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 cursor-pointer"
      onClick={() => router.push(`/products/${product.id}`)}
    >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-slate-50 rounded-2xl mx-2 mt-2">
          {/* Image Skeleton Loader */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-slate-200 animate-pulse rounded-2xl" />
          )}

          <motion.div
            className="w-full h-full"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src={product?.thumbnail || "/placeholder-product.jpg"}
              alt={product.name || "Product Image"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 rounded-2xl"
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
              style={{ opacity: imageLoaded ? 1 : 0 }}
            />
          </motion.div>

          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Premium Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {hasDiscount && discountPercent && (
              <span className="inline-flex items-center px-3 py-1.5 bg-slate-900 text-white text-[10px] font-semibold tracking-wider uppercase rounded-full shadow-lg">
                {discountPercent}% Off
              </span>
            )}
            {!product.isActive && (
              <span className="inline-flex items-center px-3 py-1.5 bg-slate-400 text-white text-[10px] font-semibold tracking-wider uppercase rounded-full">
                Unavailable
              </span>
            )}
          </div>

          {/* Stock Indicator */}
          {isLowStock && (
            <div className="absolute bottom-4 left-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-medium rounded-full border border-amber-200">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                Only {availableStockCount} left
              </span>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] flex items-center justify-center">
              <span className="px-4 py-2 bg-slate-900 text-white text-xs font-medium tracking-wider uppercase rounded-full">
                Out of Stock
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
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
            }}
            className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all duration-300 transform hover:scale-110 cursor-pointer ${
              inWishlist
                ? "bg-slate-900 text-white shadow-lg"
                : "text-white/90 bg-slate-600/40 hover:bg-white hover:text-red-500 shadow-md backdrop-blur-xs"
            }`}
          >
            <Heart
              size={18}
              fill={inWishlist ? "currentColor" : "none"}
              strokeWidth={inWishlist ? 0 : 2}
            />
          </button>

          {/* Quick View Hint */}
          {/* <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <span className="inline-flex items-center px-4 py-2 bg-white/95 text-slate-900 text-xs font-medium rounded-full shadow-lg backdrop-blur-sm">
              Quick View
            </span>
          </div> */}
        </div>

        <div className="p-2 pt-0 pb-3">
          {/* Product Info */}
          <div className="space-y-2 mb-2">
            <div className="mt-2">
              {/* Product Name */}
              <h3 className="text-sm md:text-base font-sans text-slate-600 leading-tight line-clamp-2 group-hover:text-slate-700 transition-colors text-left">
                {product.name}
              </h3>
              {/* Color Options - Only show if multiple colors */}
              {hasMultipleColors ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-400">Colors:</span>
                  <div className="flex gap-1">
                    {product.colors?.slice(0, 4).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-4 h-4 rounded-full border border-slate-200 shadow-sm"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                    {product.colors && product.colors.length > 4 && (
                      <span className="text-xs text-slate-400">
                        +{product.colors.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              ) : ""}
            </div>
          </div>
          {/* Attributes Preview */}
          <div className={`flex items-center justify-between rounded-full px-1 py-1 mt-auto`}>
            {/* Price Section */}
            <div className="flex gap-3">
              <span className="">
                ৳{" "}
                <span className="text-lg font-bold text-slate-700">
                  {minPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </span>
              {hasDiscount && maxPrice > minPrice && (
                <span className="text-sm text-slate-400 line-through">
                  ৳
                  {maxPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              )}
            </div>
            <div className="flex items-center justify-end px-1">
              {isOutOfStock ? (
                <span className="group relative flex items-center bg-slate-400 text-white rounded-full h-8 px-2 overflow-hidden cursor-not-allowed text-sm">
                  Out of Stock
                </span>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/products/${product.id}`);
                  }}
                  className="group relative flex items-center bg-white group-hover:bg-[#741111] hover:bg-primary hover:font-bold text-[#741111] group-hover:text-white rounded-full h-8 px-2 overflow-hidden transition-all duration-300"
                >
                  {/* Icon */}
                  <MdArrowOutward className="text-lg transition-all duration-300 rotate-45" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.article>
  );
};
