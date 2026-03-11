/* eslint-disable @next/next/no-img-element */
"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { ApiProduct, TypeImage } from "@/types";
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

  const basePrice = Number(product.variants?.[0]?.price || 0);
  const originalPrice = product.originalPrice
    ? Number(product.originalPrice)
    : null;

  const discountPercent =
    originalPrice && originalPrice > basePrice
      ? Math.round(((originalPrice - basePrice) / originalPrice) * 100)
      : null;

  const lowStock = (product.variants?.[0]?.stock ?? 0) < 10;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1],
      }}
      // whileHover={{ y: -6 }}
      className="grid grid-rows-3 group relative bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-slate-200 drop-shadow-lg hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 pb-2"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-50 rounded-2xl p-2 row-span-2">
        <motion.img
          src={
            (product?.images && product?.images[0]?.url) ||
            "/placeholder-product.jpg"
          }
          alt={
            (product?.images && product?.images[0]?.altText) || product.name
          }
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 rounded-2xl"
          loading="lazy"
          whileHover={{ scale: 1.05 }}
        />

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
        {lowStock && (product.variants?.[0]?.stock ?? 0) > 0 && (
          <div className="absolute bottom-4 left-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-medium rounded-full border border-amber-200">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Only {product.variants?.[0]?.stock} left
            </span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {product.variants?.[0]?.stock === 0 && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
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
          className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all duration-300 transform hover:scale-110 cursor-pointer ${inWishlist
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
          {/* Category & Brand */}
          {/* <div className="text-left">
            <span className="text-[10px] font-semibold tracking-widest text-[#e68c8c] uppercase border border-[#e68c8c] rounded-full p-1">
              {product.category?.name || "Uncategorized"}
            </span>
          </div> */}

          <div className="grid grid-cols-1 lg:grid-cols-2 mt-3">
            {/* Product Name */}
            <h3 className="text-base font-sans font-bold text-slate-700 leading-tight line-clamp-2 group-hover:text-slate-700 transition-colors text-left">
              {product.name}
            </h3>

            {/* Price Section */}
            <div className="flex gap-3 justify-end">
              <span className="">
                ৳{" "}
                <span className="text-base font-bold text-slate-700">
                  {basePrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </span>
              {originalPrice && originalPrice > basePrice && (
                <span className="text-sm text-slate-400 line-through">
                  ৳
                  {originalPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs font-sans text-slate-400 leading-tight line-clamp-2 group-hover:text-slate-700 transition-colors text-left -mt-2">
            {product.description}
          </p>
        </div>
        {/* Attributes Preview */}
        <div
          className={`grid grid-cols-2 ${product.colors &&
            product?.colors?.length > 0 &&
            "bg-secondary-foreground"
            } rounded-full px-1 py-1`}
        >
          {/* Colors */}
          {product.colors && (
            <div className="flex items-center gap-1.5">
              {product.colors.slice(0, 3).map((color, idx) => (
                <span
                  key={color.name}
                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200"
                  style={{ backgroundColor: color.value.toLowerCase() }}
                  title={color.name}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="w-5 h-5 rounded-full bg-slate-100 text-[9px] font-medium text-slate-600 flex items-center justify-center border-2 border-white ring-1 ring-slate-200">
                  +{product.colors.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-end px-1">
            <Link
              href={`/products/${product.id}`}
              className="group relative flex items-center bg-[#741111] hover:bg-primary hover:font-bold text-white rounded-full h-8 px-2 overflow-hidden transition-all duration-300"
            >
              {/* Icon */}
              <MdArrowOutward className="text-lg transition-all duration-300 rotate-45 group-hover:rotate-12" />

              {/* Animated Text */}
              <span className="group-hover:ml-1 whitespace-nowrap opacity-0 translate-x-2 max-w-0 overflow-hidden transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:max-w-52 text-sm">
                View Details
              </span>
            </Link>
          </div>

          {/* Sizes */}
          {/* {product.sizes && product.sizes.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Size
                </span>
                <span className="text-xs font-medium text-slate-700">
                  {product.sizes[0]}
                  {product.sizes.length > 1 && ` +${product.sizes.length - 1}`}
                </span>
              </div>
            )} */}

          {/* Variant Count */}
          {/* {product.variants && product.variants.length > 1 && (
              <span className="text-[10px] text-slate-400">
                {product.variants.length} options
              </span>
            )} */}
        </div>

      </div>
    </motion.article>
  );
};
