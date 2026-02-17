/* eslint-disable @next/next/no-img-element */
"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Product } from "@/types";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const router = useRouter();
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const inWishlist = isInWishlist(product.id);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group"
    >
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-lg aspect-3/4 bg-muted">
          {/* Image */}
          <motion.img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {/* Second Image on Hover */}
          {product.images[1] && (
            <img
              src={product.images[1]}
              alt={`${product.name} alternate view`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              loading="lazy"
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNew && <span className="">New</span>}
            {product.isSale && <span className="badge-sale">Sale</span>}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!isAuthenticated) {
                router.push("/login");
                return;
              }
              toggleItem(product);
            }}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 ${
              inWishlist
                ? "bg-primary text-primary-foreground"
                : "bg-primary text-foreground hover:bg-background"
            }`}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={18} fill={inWishlist ? "currentColor" : "none"} />
          </button>

          {/* Quick View Overlay */}
          <div className=" group-hover:translate-y-0 transition-transform duration-300">
            <span className="btn-outline-fashion w-full text-center bg-background/95 backdrop-blur-sm text-sm py-2">
              Quick View
            </span>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="mt-4 space-y-1">
        <p className="text-label">{product.brand}</p>
        <h3 className="font-medium">
          <Link
            href={`/products/${product.id}`}
            className="hover:text-primary transition-colors"
          >
            {product.name}
          </Link>
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-medium">৳{product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ৳{product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Color Swatches */}
        <div className="flex gap-1 pt-2">
          {product.colors.slice(0, 4).map((color) => (
            <span
              key={color.name}
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
          {product.colors.length > 4 && (
            <span className="text-xs text-muted-foreground">
              +{product.colors.length - 4}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
};
