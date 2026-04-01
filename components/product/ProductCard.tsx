"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { ApiProduct } from "@/types";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
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

  const maxPrice = Number(product.minPrice || product.maxPrice || 0);
  const originalPrice = product.originalPrice
    ? Number(product.originalPrice)
    : null;

  const discountPercent =
    originalPrice && originalPrice > maxPrice
      ? Math.round(((originalPrice - maxPrice) / originalPrice) * 100)
      : null;

  const lowStock = (product.totalStock ?? 0) < 10;
  const isOutOfStock = !product.totalStock || product.totalStock === 0;

  // Check if product has multiple colors (and has valid color values, not empty/placeholder)
  const hasMultipleColors = product.colors && product.colors.length > 1 && product.colors.some(c => c.name && c.name.trim() !== "");

  return (
    <Link href={`/products/${product.id}`}>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.08,
          duration: 0.5,
          ease: [0.23, 1, 0.32, 1],
        }}
        // whileHover={{ y: -6 }}
        className="grid grid-rows-2 group relative bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-slate-200 drop-shadow-lg hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 pb-2"
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-slate-50 rounded-2xl p-2 row-span-2">
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
            {discountPercent && discountPercent > 0 && (
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
          {lowStock && product.totalStock > 0 && (
            <div className="absolute bottom-4 left-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-medium rounded-full border border-amber-200">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                Only {product.totalStock} left
              </span>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {product.totalStock === 0 && (
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

        <div className="flex flex-col justify-between px-2">
          {/* Product Info */}
          <div className=" space-y-4 mb-3">
            <div className="mt-3">
              {/* Product Name */}
              <h3 className="text-base font-sans text-slate-600 leading-tight line-clamp-2 group-hover:text-slate-700 transition-colors text-left">
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
          <div className={`grid grid-cols-2 rounded-full px-1 py-1 mt-8`}>
            {/* Price Section */}
            <div className="flex gap-3">
              <span className="">
                ৳{" "}
                <span className="text-lg font-bold text-slate-700">
                  {maxPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </span>
              {originalPrice && originalPrice > maxPrice && (
                <span className="text-sm text-slate-400 line-through">
                  ৳
                  {originalPrice.toLocaleString("en-US", {
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
                <Link
                  href={`/products/${product.id}`}
                  className="group relative flex items-center bg-white group-hover:bg-[#741111] hover:bg-primary hover:font-bold text-[#741111] group-hover:text-white rounded-full h-8 px-2 overflow-hidden transition-all duration-300"
                >
                  {/* Icon */}
                  <MdArrowOutward className="text-lg transition-all duration-300 rotate-45" />

                  {/* Animated Text */}
                  {/* <span className="whitespace-nowrap translate-x-2 max-w-0 overflow-hidden transition-all duration-300 text-sm">
                    View Details
                  </span> */}
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
};
