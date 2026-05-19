"use client";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWishlistStore } from "@/store/wishlist.store";
import { useCartStore } from "@/store/cart.store";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { Product } from "@/types";
import toast from "react-hot-toast";

type SortOption = "newest" | "price-low" | "price-high" | "name";

const WishlistPage = () => {
  const router = useRouter();
  const { items, removeItem, clearWishlist, isHydrated, setHydrated } = useWishlistStore();
  const cartItems = useCartStore((state) => state.items);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Set hydrated state on mount
  useEffect(() => {
    setHydrated(true);
  }, [setHydrated]);

  // Filter out inactive and out of stock products
  const activeItems = items.filter((item) => {
    if (item.product.isActive === false) return false;
    
    // Check stock availability
    const hasVariants = (item.product.variants?.length ?? 0) > 0;
    if (hasVariants) {
      const hasStock = item.product.variants?.some(
        (v) => (v.availableStock ?? v.stock ?? 0) > 0
      );
      return hasStock;
    }
    
    const availableStock = item.product.availableStock ?? item.product.stock ?? 0;
    return availableStock > 0;
  });

  // Sort items
  const sortedItems = useMemo(() => {
    return [...activeItems].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          const priceA = a.product.pricing?.minPrice ?? a.product.price ?? 0;
          const priceB = b.product.pricing?.minPrice ?? b.product.price ?? 0;
          return priceA - priceB;
        case "price-high":
          const priceA2 = a.product.pricing?.minPrice ?? a.product.price ?? 0;
          const priceB2 = b.product.pricing?.minPrice ?? b.product.price ?? 0;
          return priceB2 - priceA2;
        case "name":
          return (a.product.name || "").localeCompare(b.product.name || "");
        case "newest":
        default:
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
    });
  }, [activeItems, sortBy]);

  // Check if product is in cart
  const isInCart = (productId: string | number) => {
    return cartItems.some((item) => String(item.productId) === String(productId));
  };

  // Get stock status
  const getStockStatus = (product: Product) => {
    const hasVariants = (product.variants?.length ?? 0) > 0;
    if (hasVariants) {
      const totalStock = product.variants?.reduce(
        (sum, v) => sum + (v.availableStock ?? v.stock ?? 0),
        0
      ) ?? 0;
      if (totalStock <= 0) return { status: "out" as const, label: "Out of Stock" };
      if (totalStock < 10) return { status: "low" as const, label: `Only ${totalStock} left` };
      return { status: "in" as const, label: "In Stock" };
    }
    const stock = product.availableStock ?? product.stock ?? 0;
    if (stock <= 0) return { status: "out" as const, label: "Out of Stock" };
    if (stock < 10) return { status: "low" as const, label: `Only ${stock} left` };
    return { status: "in" as const, label: "In Stock" };
  };

  // Get price display
  const getPriceDisplay = (product: Product) => {
    const hasDiscount = product.pricing?.hasDiscount ?? product.hasDiscount ?? false;
    const minPrice = product.pricing?.minPrice ?? product.minPrice ?? product.price ?? 0;
    const maxPrice = product.pricing?.maxPrice ?? product.maxPrice ?? product.price ?? 0;
    const finalMinPrice = product.pricing?.finalMinPrice ?? product.minFinalPrice ?? minPrice;
    const originalPrice = product.originalPrice ?? maxPrice;

    if (hasDiscount && finalMinPrice > 0 && finalMinPrice < minPrice) {
      return {
        current: finalMinPrice,
        original: originalPrice,
        hasDiscount: true,
      };
    }
    return {
      current: minPrice,
      original: originalPrice,
      hasDiscount: false,
    };
  };

  const handleClearWishlist = () => {
    if (window.confirm("Are you sure you want to clear your wishlist?")) {
      clearWishlist();
      toast.success("Wishlist cleared");
    }
  };

  if (sortedItems.length === 0) {
    return (
      <div className="border flex items-center justify-center py-16 min-h-[90dvh] pt-40">
        <EmptyState
          icon={<Heart size={64} />}
          title="Your wishlist is empty"
          description="Save your favorite items to revisit them later."
          action={
            <Link href="/products" className="btn-primary-fashion rounded-lg">
              Explore Products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-fashion py-6 md:py-10 mt-16 md:mt-20 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-tight">
            Wishlist ({sortedItems.length})
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background hover:bg-muted transition-colors"
          >
            <option value="newest">Recently Added</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name: A-Z</option>
          </select>

          {/* Clear All Button */}
          <button
            onClick={handleClearWishlist}
            className="inline-flex items-center gap-2 text-xs md:text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={14} />
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {sortedItems.map((item, index) => {
          const stockStatus = getStockStatus(item.product);
          const priceDisplay = getPriceDisplay(item.product);
          const inCart = isInCart(item.product.id);

          return (
            <motion.article
              key={item.product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-shadow duration-500"
            >
              <div className="relative aspect-3/4 overflow-hidden bg-muted">
                <Link
                  href={`/products/${item.product.id}`}
                  className="absolute inset-0"
                >
                  <Image
                    src={item?.product?.thumbnail || "/placeholder-product.jpg"}
                    alt={item.product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-product.jpg";
                    }}
                  />
                </Link>

                {/* Remove Button */}
                <button
                  onClick={() => {
                    removeItem(String(item.product.id));
                    toast.success("Removed from wishlist");
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-background transition-colors z-10"
                  aria-label="Remove from wishlist"
                >
                  <X size={18} />
                </button>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                  {item.product.isNew && (
                    <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-semibold bg-white text-black rounded-lg">
                      New
                    </span>
                  )}
                  {item.product.isSale && (
                    <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-semibold bg-red-500 text-white rounded-lg">
                      Sale
                    </span>
                  )}
                </div>

                {/* Stock Status Badge */}
                {stockStatus.status === "low" && (
                  <div className="absolute bottom-3 left-3 z-10">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                      {stockStatus.label}
                    </span>
                  </div>
                )}

                {/* In Cart Indicator */}
                {inCart && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <span className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-full">
                      In Bag
                    </span>
                  </div>
                )}

                {/* Buy Now Button */}
                <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <Link
                    href={`/products/${item.product.id}`}
                    className="inline-flex items-center justify-center gap-2 w-full bg-neutral-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors shadow-lg"
                  >
                    <ShoppingBag size={16} />
                    Buy Now
                  </Link>
                </div>
              </div>

              <div className="p-3 md:p-4 space-y-1.5">
                {/* Category */}
                {item.product.category?.name && (
                  <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                    {item.product.category.name}
                  </span>
                )}

                {/* Brand */}
                {item.product.brand && (
                  <p className="text-label text-xs">{item.product.brand}</p>
                )}

                {/* Product Name */}
                <h3 className="font-medium text-sm line-clamp-2 leading-snug">
                  <Link
                    href={`/products/${item.product.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {item.product.name}
                  </Link>
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-sm font-bold text-neutral-900">
                    ৳{priceDisplay.current.toLocaleString()}
                  </span>
                  {priceDisplay.hasDiscount && priceDisplay.original > priceDisplay.current && (
                    <span className="text-xs text-neutral-400 line-through">
                      ৳{priceDisplay.original.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
};

export default WishlistPage;
