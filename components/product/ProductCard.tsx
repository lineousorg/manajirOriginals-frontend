/* eslint-disable @next/next/no-img-element */
"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { ApiProduct, TypeImage } from "@/types";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  const lowStock = product.variants?.[0]?.stock < 10;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="group border border-border rounded-xl p-3 bg-background hover:shadow-xl transition-all duration-300"
    >
      <Link href={`/products/${product.id}`}>
        <div className="relative overflow-hidden rounded-lg aspect-3/4 bg-muted">
          <motion.img
            src={images[0]?.url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {/* Sale Badge */}
          {discountPercent && (
            <span className="absolute top-3 left-3 bg-black text-white text-xs px-2 py-1 rounded-full">
              -{discountPercent}%
            </span>
          )}

          {/* Low Stock */}
          {lowStock && (
            <span className="absolute bottom-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded">
              Only {product.variants[0].stock} left
            </span>
          )}

          {/* Wishlist */}
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!isAuthenticated) {
                router.push("/login");
                return;
              }

              const normalizedImages: TypeImage[] =
                product.images?.map((img) =>
                  typeof img === "string"
                    ? { url: img, altText: product.name }
                    : img,
                ) ?? [];

              toggleItem({
                ...product,
                id: productId,
                images: normalizedImages,
              });
            }}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition ${
              inWishlist ? "bg-black text-white" : "bg-white/80 hover:bg-white"
            }`}
          >
            <Heart size={16} fill={inWishlist ? "currentColor" : "none"} />
          </button>
        </div>
      </Link>

      {/* Info Section */}
      <div className="mt-4 space-y-2">
        {/* Brand */}
        {product.brand && (
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {product.brand}
          </p>
        )}

        {/* Name */}
        <h3 className="text-sm font-medium leading-snug">
          <Link
            href={`/products/${product.id}`}
            className="hover:text-primary transition"
          >
            {product.name}
          </Link>
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base">
            ৳ {basePrice.toFixed(2)}
          </span>

          {originalPrice && (
            <span className="text-sm line-through text-muted-foreground">
              ৳ {originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Colors */}
        {product.colors && product.colors?.length > 0 && (
          <div className="flex gap-1 pt-1">
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={color.name}
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: color.value.toLowerCase() }}
                title={color.name}
              />
            ))}
          </div>
        )}

        {/* Sizes */}
        {/* {product.sizes && product.sizes?.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Sizes: {product.sizes.join(" · ")}
          </div>
        )} */}
      </div>
    </motion.article>
  );
};
