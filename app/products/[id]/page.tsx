/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Share2,
  Info,
  Package,
  Check,
} from "lucide-react";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductCard } from "@/components/product/ProductCard";
import { SizeGuide } from "@/components/product/SizeGuide";
import { Loader, ProductDetailsSkeleton } from "@/components/ui/Loader";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProductById, getProductCategories } from "@/hooks/useProduct";
import { useProductStore } from "@/store/product.store";
import { TypeImage, ProductVariant } from "@/types";
import toast, { Toaster } from "react-hot-toast";
import { stockReservationService } from "@/services/stock-reservation.service";
import policyData from "@/lib/policy-data.json";
import { useVariantSelection } from "@/hooks/useVariantSelection";
import { findVariantBySizeColor, getStockForSize } from "@/lib/variant-utils";
import { trackAddToCart, trackViewItem } from "@/lib/gtm";

// Helper function for className
function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "details" | "shipping" | "returns"
  >("details");

  const { product, loading, refetch } = useProductById(id);
  const globalProducts = useProductStore((state) => state.products);

  const addToCart = useCartStore((state) => state.addItem);
  const isItemInCart = useCartStore((state) => state.isItemInCart);
  const lastCartChange = useCartStore((state) => state.lastCartChange);
  const { isInWishlist, toggleItem } = useWishlistStore();

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isRefetchingStock, setIsRefetchingStock] = useState(false);
  const prevLastCartChange = useRef<number>(0);
  const [isVisible, setIsVisible] = useState(false);

  // Use the custom hook for variant selection
  const {
    selectedSize,
    setSelectedSize,
    selectedColor,
    setSelectedColor,
    quantity,
    setQuantity,
    quantityBySize,
    setQuantityBySize,
    availableColorsForSelectedSize,
    selectedVariant,
    currentPrice,
    originalPrice,
    discountPercentage,
    stockForSelectedSize,
    selectedVariantAvailableStock,
  } = useVariantSelection({
    variants: product?.variants,
    sizes: product?.sizes,
    productPrice: product?.price,
  });

  // Page load animation
  useEffect(() => {
    if (product && !loading) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [product, loading]);

  useEffect(() => {
    if (!product || loading) return;

    trackViewItem({
      item_id: String(product.id),
      item_name: product.name,
      price: currentPrice || product.price || product.maxPrice || 0,
      item_category: gtmCategory,
    });
  }, [product, loading]);

  // Refetch product stock when cart changes
  useEffect(() => {
    if (lastCartChange > 0 && lastCartChange !== prevLastCartChange.current) {
      prevLastCartChange.current = lastCartChange;
      setIsRefetchingStock(true);
      refetch().finally(() => setIsRefetchingStock(false));
    }
  }, [lastCartChange, refetch]);

  // Related products
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return globalProducts
      .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
      .slice(0, 4);
  }, [product, globalProducts]);

  const productId = product ? String(product.id) : "";
  const inWishlist = product ? isInWishlist(productId) : false;

  // Images
  const images = useMemo(
    () =>
      product?.images && product.images.length > 0
        ? product.images
        : [
            {
              url: "https://placehold.co/600x800?text=No+Image",
              altText: "No Image",
            },
          ],
    [product?.images],
  );

  const details = product?.details ?? [];
  const categories = product ? getProductCategories(product) : null;
  const gtmCategory =
    [categories?.parent?.name, categories?.child?.name]
      .filter(Boolean)
      .join(" / ") || categories?.raw?.name;

  // Stock calculations - using availableStock from API (totalStock - reservedStock)
  const remainingStock = selectedVariantAvailableStock;
  const displayStock = selectedVariantAvailableStock - quantity;
  const canAddMore = remainingStock > 0;
  const isStockExceeded = !canAddMore;

  // Add to cart handler
  const handleAddToCart = async () => {
    if (!product) return;

    if ((product.sizes ?? []).length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    if (availableColorsForSelectedSize.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return;
    }

    setIsAddingToCart(true);

    const normalizedImages: TypeImage[] = Array.isArray(product.images)
      ? product.images.map((img) =>
          typeof img === "string" ? { url: img, altText: product.name } : img,
        )
      : [];

    const size = selectedSize || "One Size";
    const color = selectedColor || "Default";
    const isAlreadyInCart = isItemInCart(productId, size, color);

    const selectedVariantInAddToCart = findVariantBySizeColor(
      product.variants || [],
      size,
      color,
    );
    const variantId = selectedVariantInAddToCart?.id;

    if (!variantId) {
      toast.error("Selected variant is not available");
      setIsAddingToCart(false);
      return;
    }

    try {
      const stockCheck =
        await stockReservationService.getAvailableStock(variantId);
      if (stockCheck.success && stockCheck.data) {
        if (stockCheck.data.availableStock < quantity) {
          if (stockCheck.data.availableStock === 0) {
            toast.error(
              "This item is out of stock. Please choose a different option.",
            );
          } else {
            toast.error(
              `Only ${stockCheck.data.availableStock} available. Please adjust quantity.`,
            );
          }
          setIsAddingToCart(false);
          return;
        }
      }
    } catch (error) {
      console.error("Failed to check stock:", error);
      toast.error("Unable to verify stock. Please try again.");
      setIsAddingToCart(false);
      return;
    }

    const result = await addToCart(
      { ...product, id: productId, images: normalizedImages },
      size,
      color,
      quantity
    );

    if (!result.success) {
      toast.error(
        "Selected size or color is not available. Please choose different options.",
      );
      setIsAddingToCart(false);
      return;
    }

    if (result.isExisting) {
      toast.success("Updated quantity in your bag!");
    } else if (isAlreadyInCart) {
      toast.success(`Added another ${product.name} to your bag!`);
    } else {
      toast.success("Added to bag!");
    }

    trackAddToCart({
      item_id: String(variantId),
      item_name: product.name,
      price: currentPrice || product.price || product.maxPrice || 0,
      quantity,
      item_category: gtmCategory,
      item_brand: color,
    });

    setIsAddingToCart(false);
    setIsRefetchingStock(true);
    refetch().finally(() => setIsRefetchingStock(false));
  };

  // Share handler
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  // Cart status
  const isInCart = useMemo(() => {
    if (!product) return false;
    const size = selectedSize || "One Size";
    const color = selectedColor || "Default";
    return isItemInCart(productId, size, color);
  }, [product, selectedSize, selectedColor, productId, isItemInCart]);

  // Out of stock check - uses availableStock (totalStock - reservedStock) from API
  const isOutOfStock = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) {
      return !product?.availableStock || product.availableStock === 0;
    }
    const allVariantsOutOfStock = product.variants.every(
      (variant: ProductVariant) => {
        const available = variant.availableStock ?? variant.stock ?? 0;
        return available <= 0;
      },
    );
    return allVariantsOutOfStock;
  }, [product?.variants, product?.availableStock]);

  if (loading && !product) {
    return <ProductDetailsSkeleton />;
  }

  if (!product || product.isActive === false) {
    return (
      <div className="container-fashion py-16 text-center min-h-screen flex flex-col items-center justify-center">
        <div className="mb-6">
          <Package
            size={64}
            className="text-muted-foreground mx-auto mb-4 opacity-50"
          />
          <h2 className="text-2xl font-serif mb-2">Product Not Found</h2>
          <p className="text-muted-foreground">
            The product you are looking for does not exist or has been removed.
          </p>
        </div>
        <Link
          href="/products"
          className="btn-primary-fashion inline-flex items-center gap-2"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 md:pt-32 pb-20 bg-white">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="container-fashion py-4"
      >
        <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <Link
            href="/"
            className="hover:text-foreground transition-colors duration-200"
          >
            Home
          </Link>
          <ChevronRight size={14} className="opacity-60" />
          <Link
            href="/products"
            className="hover:text-foreground transition-colors duration-200"
          >
            Products
          </Link>
          {categories?.parent && (
            <>
              <ChevronRight size={14} className="opacity-60" />
              <Link
                href={`/products?category=${categories.parent.slug}`}
                className="hover:text-foreground transition-colors duration-200"
              >
                {categories.parent.name}
              </Link>
            </>
          )}
          {categories?.child && (
            <>
              <ChevronRight size={14} className="opacity-60" />
              <Link
                href={`/products?category=${categories.child.slug}`}
                className="hover:text-foreground transition-colors duration-200"
              >
                {categories.child.name}
              </Link>
            </>
          )}
          <ChevronRight size={14} className="opacity-60" />
          <span className="text-foreground font-medium truncate max-w-50 md:max-w-xs">
            {product.name}
          </span>
        </nav>
      </motion.div>

      {/* Product Details */}
      <div className="container-fashion py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 z-0"
          >
            <ProductGallery images={images} productName={product.name} />
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 lg:sticky lg:top-28 lg:self-start"
          >
            <div className="mb-8">
              {/* Header Row: Title + Share */}
              <div className="flex items-start justify-between gap-2 md:gap-4 mb-4">
                <h1 className="font-serif text-2xl md:text-3xl lg:text-[42px] font-bold leading-[1.1] tracking-tight text-left break-words max-w-[85%] md:max-w-none">
                  {product.name}
                </h1>
                <button
                  onClick={handleShare}
                  className="p-2.5 hover:bg-muted rounded-full transition-colors shrink-0 mt-1"
                  aria-label="Share product"
                >
                  <Share2 size={20} strokeWidth={1.5} />
                </button>
              </div>

              {/* Description */}
              {product.description && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-muted-foreground text-base leading-relaxed mb-8 max-w-2xl text-left"
                >
                  {product.description}
                </motion.p>
              )}

              {/* Price Row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={
                  isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                }
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3 mb-6"
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={
                    isVisible
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.9 }
                  }
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="text-3xl font-semibold tracking-tight"
                >
                  ৳ {currentPrice.toLocaleString()}
                </motion.span>

                {originalPrice && originalPrice > currentPrice && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={
                      isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }
                    }
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="text-lg text-muted-foreground line-through decoration-2"
                  >
                    ৳{originalPrice.toLocaleString()}
                  </motion.span>
                )}

                {discountPercentage > 0 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={
                      isVisible
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.8 }
                    }
                    transition={{
                      delay: 0.3,
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-700 border border-emerald-500/30 shadow-sm backdrop-blur-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 mr-2 animate-pulse" />
                    Save {discountPercentage}%
                  </motion.span>
                )}
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isVisible ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="h-px bg-border w-full origin-left"
              />
            </div>

            {/* Variant Selection */}
            <div className="space-y-8 mb-8">
              {/* Color Selection */}
              {availableColorsForSelectedSize.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={
                    isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                  }
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground w-24 shrink-0">
                      Color
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {availableColorsForSelectedSize.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            "relative px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
                            selectedColor === color
                              ? "bg-foreground text-background shadow-lg scale-105"
                              : "bg-muted/50 text-foreground hover:bg-muted border border-border",
                          )}
                        >
                          {color}
                          {selectedColor === color && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm"
                            >
                              <Check
                                size={10}
                                className="text-background"
                                strokeWidth={3}
                              />
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={
                    isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                  }
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground w-24 shrink-0 text-left pl-3">
                      Size
                    </span>
                    <div className="flex flex-wrap gap-4">
                      {product.sizes.map((size) => {
                        const stock = getStockForSize(
                          product.variants || [],
                          size,
                        );
                        const isOutOfStock = stock <= 0;
                        return (
                          <div key={size} className="relative">
                            <button
                              onClick={() => {
                                setSelectedSize(size);
                                setQuantityBySize((prev) => ({
                                  ...prev,
                                  [size]: prev[size] ?? 1,
                                }));
                              }}
                              disabled={isOutOfStock}
                              className={cn(
                                "w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200",
                                isOutOfStock
                                  ? "opacity-40 cursor-not-allowed line-through"
                                  : "cursor-pointer",
                                selectedSize === size
                                  ? "bg-foreground text-background shadow-md scale-105"
                                  : "bg-background text-foreground border-2 border-border hover:border-primary/50 hover:bg-muted/30",
                              )}
                            >
                              {size}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quantity */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={
                  isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                }
                transition={{ duration: 0.4, delay: 0.45 }}
                className="flex items-center gap-4"
              >
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground w-24 shrink-0">
                  Quantity
                </span>
                <div className="inline-flex items-center bg-muted/30 rounded-full border border-border">
                  <button
                    onClick={() =>
                      setQuantity(selectedSize, Math.max(quantity - 1, 1))
                    }
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold text-lg tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(
                        selectedSize,
                        Math.min(quantity + 1, remainingStock),
                      )
                    }
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    disabled={remainingStock <= 0 || quantity >= remainingStock}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                {selectedVariantAvailableStock > 0 && (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      remainingStock <= 0
                        ? "text-gray-500"
                        : remainingStock <= 3
                          ? "text-gray-500"
                          : "text-green-600",
                    )}
                  >
                    {isRefetchingStock ? (
                      <span className="flex items-center gap-1">
                        <svg
                          className="animate-spin h-3 w-3"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Updating...
                      </span>
                    ) : remainingStock > 0 ? (
                      quantity > 0 ? (
                        `${displayStock} available`
                      ) : (
                        `${remainingStock} available`
                      )
                    ) : (
                      "Out of stock"
                    )}
                  </span>
                )}
              </motion.div>

              {/* Size Guide */}
              <SizeGuide categorySlug={categories?.raw?.slug} />
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <AddToCartButton
                isAdding={isAddingToCart}
                isOutOfStock={isOutOfStock}
                isStockExceeded={isStockExceeded}
                isInCart={isInCart}
                quantity={quantity}
                totalPrice={currentPrice * quantity}
                onAddToCart={handleAddToCart}
              />
              <motion.button
                onClick={() => {
                  toggleItem({ ...product, id: productId, images } as any);
                }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "p-4 border-2 rounded-lg transition-all duration-200",
                  inWishlist
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-foreground bg-background",
                )}
                aria-label={
                  inWishlist ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                <Heart
                  size={24}
                  fill={inWishlist ? "currentColor" : "none"}
                  strokeWidth={inWishlist ? 0 : 2}
                />
              </motion.button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 py-6 border-t border-border">
              <div className="text-center group px-1">
                <div className="bg-muted rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center mx-auto mb-2 group-hover:bg-muted/80 transition-colors">
                  <Truck
                    size={14}
                    className="text-muted-foreground w-3.5 h-3.5 md:w-4.5 md:h-4.5"
                  />
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  Cash on Delivery
                </p>
              </div>
              <div className="text-center group px-1">
                <div className="bg-muted rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center mx-auto mb-2 group-hover:bg-muted/80 transition-colors">
                  <RotateCcw
                    size={14}
                    className="text-muted-foreground w-3.5 h-3.5 md:w-4.5 md:h-4.5"
                  />
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">
                  Easy Returns
                </p>
              </div>
              <div className="text-center group px-1">
                <div className="bg-muted rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center mx-auto mb-2 group-hover:bg-muted/80 transition-colors">
                  <ShieldCheck
                    size={14}
                    className="text-muted-foreground w-3.5 h-3.5 md:w-4.5 md:h-4.5"
                  />
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  Secure Checkout
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Product Information Tabs */}
      <div className="container-fashion py-8 mb-12">
        <div className="border-t border-border pt-8">
          {/* Tab Navigation */}
          <div className="flex gap-8 border-b border-border mb-6 overflow-x-auto">
            {[
              { id: "details", label: "Product Details", icon: Info },
              { id: "shipping", label: "Shipping & Delivery", icon: Truck },
              { id: "returns", label: "Returns & Exchanges", icon: RotateCcw },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as "details" | "shipping" | "returns")
                }
                className={cn(
                  "pb-4 text-sm font-medium uppercase tracking-wider transition-colors relative flex items-center gap-2 whitespace-nowrap",
                  activeTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon size={16} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-50"
            >
              {activeTab === "details" && (
                <div className="w-full">
                  {details.length > 0 ? (
                    <ul className="space-y-3">
                      {details.map((detail: string, index: number) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-muted-foreground"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">
                      No additional details available for this product.
                    </p>
                  )}
                </div>
              )}

              {(activeTab === "shipping" || activeTab === "returns") && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h3 className="text-2xl font-sans text-left font-medium text-foreground">
                    {policyData[activeTab].title}
                  </h3>
                  {policyData[activeTab]?.intro && (
                    <p className="text- leading-relaxed text-left">
                      {policyData[activeTab]?.intro}
                    </p>
                  )}
                  <div className="space-y-6">
                    {policyData[activeTab].content.map((section, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1 w-8 text-sm font-semibold border-2 border-gray-400 bg- rounded-full">
                            {index + 1}
                          </div>
                          <h4 className="font-medium text-foreground text-lg font-sans text-left">
                            {section.heading}
                          </h4>
                        </div>
                        <div className="text- text-muted-foreground whitespace-pre-line leading-relaxed text-left pl-10">
                          {section.body}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="container-fashion py-16 border-t border-border">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-2xl md:text-3xl font-medium mb-2 text-center">
              You May Also Like
            </h2>
            <p className="text-muted-foreground text-center mb-10">
              Complete your look with these curated pieces
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Mobile Sticky Add to Cart */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 lg:hidden z-50">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-medium">
              ৳{(currentPrice * quantity).toLocaleString()}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={
              isAddingToCart || isOutOfStock || isStockExceeded || quantity <= 0
            }
            className="flex-1 btn-primary-fashion h-12 text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {quantity <= 0
              ? "Select Quantity"
              : isOutOfStock
                ? "Out of Stock"
                : isStockExceeded
                  ? "Max Stock Reached"
                  : isInCart
                    ? "Added to Bag"
                    : isAddingToCart
                      ? "Adding..."
                      : "Add to Bag"}
          </button>
        </div>
      </div>

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: { background: "#000", color: "#fff", borderRadius: "8px" },
        }}
      />
    </div>
  );
}
