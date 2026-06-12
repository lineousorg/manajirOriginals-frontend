/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { ProductSizeChart } from "@/components/product/ProductSizeChart";
import { Loader, ProductDetailsSkeleton } from "@/components/ui/Loader";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useProductById,
  getProductCategories,
  useRelatedProducts,
} from "@/hooks/useProduct";
import { TypeImage, ProductVariant } from "@/types";
import toast, { Toaster } from "react-hot-toast";
import { isInAppBrowser } from "@/lib/isInAppBrowser";
import { stockReservationService } from "@/services/stock-reservation.service";
import { policyData } from "@/lib/policy-data";
import { useVariantSelection } from "@/hooks/useVariantSelection";
import { findVariantBySizeColor, getStockForSize } from "@/lib/variant-utils";
import { trackAddToCart, trackViewItem } from "@/lib/gtm";
import { sanitizeHtml } from "@/src/utils/sanitizeHtml";

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
  const { relatedProducts } = useRelatedProducts(
    product?.id,
    product?.category?.slug,
  );

  const addToCart = useCartStore((state) => state.addItem);
  const closeCart = useCartStore((state) => state.closeCart);
  const isItemInCart = useCartStore((state) => state.isItemInCart);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  const lastCartChange = useCartStore((state) => state.lastCartChange);
  const { isInWishlist, toggleItem } = useWishlistStore();

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isRefetchingStock, setIsRefetchingStock] = useState(false);
  const prevLastCartChange = useRef<number>(0);
  const [isVisible, setIsVisible] = useState(false);

  // Track in-flight add-to-cart requests per variant to prevent duplicate calls
  const inFlightAddRef = useRef<Set<string>>(new Set());

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

    const size = selectedSize || "One Size";
    const color = selectedColor || "Default";
    const existingCartQuantity = getItemQuantity(productId, size, color);

    const selectedVariantInAddToCart = findVariantBySizeColor(
      product.variants || [],
      size,
      color,
    );
    const variantId = selectedVariantInAddToCart?.id;

    if (!variantId) {
      toast.error("Selected variant is not available");
      return;
    }

    // Fix 2: In-flight deduplication — ignore duplicate clicks for the same variant
    const variantKey = `${productId}-${variantId}`;
    if (inFlightAddRef.current.has(variantKey)) {
      return;
    }
    inFlightAddRef.current.add(variantKey);

    setIsAddingToCart(true);

    const normalizedImages: TypeImage[] = Array.isArray(product.images)
      ? product.images.map((img) =>
          typeof img === "string" ? { url: img, altText: product.name } : img,
        )
      : [];

    try {
      const stockCheck =
        await stockReservationService.getAvailableStock(variantId);
      if (stockCheck.success && stockCheck.data) {
        const maxCartQuantity =
          existingCartQuantity + stockCheck.data.availableStock;
        const requestedTotalQuantity = existingCartQuantity + quantity;

        if (requestedTotalQuantity > maxCartQuantity) {
          if (maxCartQuantity === 0) {
            toast.error(
              "This item is out of stock. Please choose a different option.",
            );
          } else {
            toast.error(
              `Only ${maxCartQuantity} total available for this option. Please adjust quantity.`,
            );
          }
          return;
        }
      }

      const result = await addToCart(
        { ...product, id: productId, images: normalizedImages },
        size,
        color,
        quantity,
      );

      if (!result.success) {
        toast.error(
          "Unable to add item to cart. Please try again or choose different options.",
        );
        return;
      }

      // Fix 1: Read isAlreadyInCart AFTER the await, using current live state
      const isAlreadyInCart = isItemInCart(productId, size, color);

      // Build toast with optional "View Cart" action for in-app browsers
      const toastMessage = result.isExisting
        ? "Updated quantity in your bag!"
        : isAlreadyInCart
          ? `Added ${product.name} to your bag!`
          : "Added to bag!";

      if (isInAppBrowser()) {
        toast.custom(
          (t) => (
            <div
              className={`flex items-center justify-between gap-3 px-4 py-3 bg-background border border-border shadow-lg rounded-lg ${
                t.visible ? "animate-in slide-in-from-bottom" : "animate-out fade-out"
              }`}
            >
              <span className="text-sm font-medium">{toastMessage}</span>
              <button
                onClick={() => {
                  router.push("/checkout");
                  toast.dismiss(t.id);
                }}
                className="text-sm font-semibold text-primary hover:underline"
              >
                View Cart
              </button>
            </div>
          ),
          { duration: 4000 }
        );
      } else {
        toast.success(toastMessage);
      }

      trackAddToCart({
        item_id: String(variantId),
        item_name: product.name,
        price: currentPrice || product.price || product.maxPrice || 0,
        quantity,
        item_category: gtmCategory,
        item_brand: color,
      });
    } finally {
      // Fix 2: Always clear the in-flight flag and loading state
      inFlightAddRef.current.delete(variantKey);
      setIsAddingToCart(false);
      setIsRefetchingStock(true);
      refetch().finally(() => setIsRefetchingStock(false));
    }
  };

  // Buy Now handler
  const handleBuyNow = async () => {
    if (!product) return;

    // Validate variant selection (same as addToCart)
    if ((product.sizes ?? []).length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    if (availableColorsForSelectedSize.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return;
    }

    const size = selectedSize || "One Size";
    const color = selectedColor || "Default";
    const variantId = findVariantBySizeColor(
      product.variants || [],
      size,
      color,
    )?.id;

    if (!variantId) {
      toast.error("Selected variant is not available");
      return;
    }

    // Check stock first
    try {
      const stockCheck = await stockReservationService.getAvailableStock(variantId);
      if (!stockCheck.success || !stockCheck.data) {
        toast.error("Failed to check stock availability");
        return;
      }
      if (stockCheck.data.availableStock < quantity) {
        toast.error(
          stockCheck.data.availableStock === 0
            ? "This item is out of stock"
            : `Only ${stockCheck.data.availableStock} available`,
        );
        return;
      }
    } catch {
      toast.error("Failed to check stock availability");
      return;
    }

    const normalizedImages: TypeImage[] = Array.isArray(product.images)
      ? product.images.map((img) =>
          typeof img === "string" ? { url: img, altText: product.name } : img,
        )
      : [];

    // Use the same addToCart flow - checkout page will handle the rest
    const result = await addToCart(
      { ...product, id: productId, images: normalizedImages },
      size,
      color,
      quantity,
    );

    if (!result.success) {
      toast.error("Unable to process. Please try again.");
      return;
    }

    // Close cart drawer before navigating to checkout
    closeCart();
    router.push("/checkout");
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
    <div className="pt-20 md:pt-28 pb-16 bg-white min-h-screen">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="container-fashion py-3 md:py-4"
      >
        <nav className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground flex-wrap">
          <Link
            href="/"
            className="hover:text-foreground transition-colors duration-200"
          >
            Home
          </Link>
          <ChevronRight size={12} className="opacity-50" />
          <Link
            href="/products"
            className="hover:text-foreground transition-colors duration-200"
          >
            Products
          </Link>
          {categories?.parent && (
            <>
              <ChevronRight size={12} className="opacity-50" />
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
              <ChevronRight size={12} className="opacity-50" />
              <Link
                href={`/products?category=${categories.child.slug}`}
                className="hover:text-foreground transition-colors duration-200"
              >
                {categories.child.name}
              </Link>
            </>
          )}
          <ChevronRight size={12} className="opacity-50" />
          <span className="text-foreground font-medium truncate max-w-32 md:max-w-xs">
            {product.name}
          </span>
        </nav>
      </motion.div>

      {/* Product Details */}
      <div className="container-fashion py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-12">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 z-0 col-span-2 relative"
          >
            <div className="absolute top-2 left-2 z-20">
              {discountPercentage > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={
                    isVisible
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.85 }
                  }
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                >
                  <span className="w-1 h-1 rounded-full bg-emerald-600 mr-1.5 animate-pulse" />
                  Save {discountPercentage}%
                </motion.span>
              )}
            </div>
            <ProductGallery images={images} productName={product.name} />
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 lg:sticky lg:top-24 lg:self-start col-span-3"
          >
            <div className="mb-6">
              {/* Header Row: Title + Share */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="font-serif text-xl md:text-2xl lg:text-3xl font-bold leading-tight tracking-tight text-left flex-1">
                  {product.name}
                </h1>
                <button
                  onClick={handleShare}
                  className="p-2 hover:bg-muted rounded-full transition-colors shrink-0 mt-0.5"
                  aria-label="Share product"
                >
                  <Share2 size={18} strokeWidth={1.5} />
                </button>
              </div>

              {/* Description */}
              {product.description && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="text-muted-foreground text-sm leading-relaxed mb-5 max-w-2xl text-left"
                >
                  {product.description}
                </motion.p>
              )}

              {/* Price Row */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={
                  isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }
                }
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2.5 mb-5 flex-wrap"
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={
                    isVisible
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.95 }
                  }
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="text-2xl md:text-3xl font-semibold tracking-tight"
                >
                  ৳{currentPrice.toLocaleString()}
                </motion.span>

                {originalPrice && originalPrice > currentPrice && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={
                      isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }
                    }
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="text-sm md:text-base text-muted-foreground line-through decoration-2"
                  >
                    ৳{originalPrice.toLocaleString()}
                  </motion.span>
                )}
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isVisible ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="h-px bg-border/80 w-full origin-left"
              />
            </div>

            {/* Variant Selection */}
            <div className="space-y-5 mb-6">
              {/* Color Selection */}
              {availableColorsForSelectedSize.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={
                    isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }
                  }
                  transition={{ duration: 0.35, delay: 0.3 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-16 shrink-0">
                      Color
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableColorsForSelectedSize.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            "relative px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer",
                            selectedColor === color
                              ? "bg-foreground text-background shadow-md scale-105"
                              : "bg-muted/40 text-foreground hover:bg-muted border border-border/60",
                          )}
                        >
                          {color}
                          {selectedColor === color && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-sm"
                            >
                              <Check
                                size={8}
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
                   initial={{ opacity: 0, y: 8 }}
                   animate={
                     isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }
                   }
                   transition={{ duration: 0.35, delay: 0.35 }}
                   className="space-y-2"
                 >
                   <div className="flex items-center gap-3">
                     <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-16 shrink-0">
                       Size
                     </span>
                     <div className="flex flex-wrap gap-2">
                       {product.sizes.map((size) => {
                         const stock = getStockForSize(
                           product.variants || [],
                           size,
                         );
                         const isOutOfStock = stock <= 0;
                         return (
                           <TooltipProvider key={size}>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <div className="relative">
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
                                       "w-8 h-8 rounded-md text-xs font-semibold transition-all duration-150 flex items-center justify-center",
                                       isOutOfStock
                                         ? "opacity-35 cursor-not-allowed line-through bg-muted/30"
                                         : "cursor-pointer",
                                       selectedSize === size
                                         ? "bg-foreground text-background shadow-sm scale-105"
                                         : "bg-background text-foreground border border-border/80 hover:border-primary/40 hover:bg-muted/20",
                                     )}
                                   >
                                     {size}
                                   </button>
                                 </div>
                               </TooltipTrigger>
                               <TooltipContent
                                 side="top"
                                 className="bg-background border border-border/80 shadow-lg rounded-lg px-3 py-2 text-xs font-medium"
                               >
                                 {isOutOfStock
                                   ? "Out of stock"
                                   : `${stock} available`}
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         );
                       })}
                     </div>
                   </div>
                 </motion.div>
               )}

              {/* Quantity */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={
                  isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }
                }
                transition={{ duration: 0.35, delay: 0.4 }}
                className="flex items-center gap-3"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-16 shrink-0">
                  Qty
                </span>
                <div className="inline-flex items-center bg-muted/30 rounded-lg border border-border/60 h-8">
                  <button
                    onClick={() =>
                      setQuantity(selectedSize, Math.max(quantity - 1, 1))
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-sm font-medium"
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-semibold text-sm tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(
                        selectedSize,
                        Math.min(quantity + 1, remainingStock),
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-sm font-medium"
                    disabled={remainingStock <= 0 || quantity >= remainingStock}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
               </motion.div>

              {/* Size Chart */}
              {product?.sizeChartImage && (
                <ProductSizeChart 
                  imageUrl={product.sizeChartImage.url}
                  altText={product.sizeChartImage.publicId || 'Size Chart'}
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 mb-6">
              <div className="flex gap-4 flex-1">
                <AddToCartButton
                  isAdding={isAddingToCart}
                  isOutOfStock={isOutOfStock}
                  isStockExceeded={isStockExceeded}
                  isInCart={isInCart}
                  quantity={quantity}
                  totalPrice={currentPrice * quantity}
                  onAddToCart={handleAddToCart}
                />
                {/* BUY NOW Button */}
                <motion.button
                  onClick={handleBuyNow}
                  disabled={isAddingToCart || isOutOfStock || isStockExceeded || quantity <= 0 || !selectedVariant}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 border-2 border-primary h-14 text-primary font-medium disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden rounded-lg"
                >
                  <AnimatePresence mode="wait">
                    {isAddingToCart ? (
                      <motion.span key="buying" className="flex items-center justify-center gap-2">
                        <Loader size="sm" />
                        Processing...
                      </motion.span>
                    ) : (
                      <motion.span key="buy" className="flex items-center justify-center gap-2">
                        Buy Now
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
              <motion.button
                onClick={() => {
                  toggleItem({ ...product, id: productId, images } as any);
                }}
                whileTap={{ scale: 0.92 }}
                className={cn(
                  "p-3 border rounded-lg transition-all duration-150",
                  inWishlist
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/80 hover:border-foreground bg-background",
                )}
                aria-label={
                  inWishlist ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                <Heart
                  size={20}
                  fill={inWishlist ? "currentColor" : "none"}
                  strokeWidth={inWishlist ? 0 : 1.5}
                />
              </motion.button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 py-4 border-t border-border/60">
              <div className="text-center group px-0.5">
                <div className="bg-muted/50 rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center mx-auto mb-1.5 group-hover:bg-muted transition-colors">
                  <Truck size={13} className="text-muted-foreground" />
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium leading-tight">
                  Cash on Delivery
                </p>
              </div>
              <div className="text-center group px-0.5">
                <div className="bg-muted/50 rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center mx-auto mb-1.5 group-hover:bg-muted transition-colors">
                  <RotateCcw size={13} className="text-muted-foreground" />
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium leading-tight">
                  Easy Returns
                </p>
              </div>
              <div className="text-center group px-0.5">
                <div className="bg-muted/50 rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center mx-auto mb-1.5 group-hover:bg-muted transition-colors">
                  <ShieldCheck size={13} className="text-muted-foreground" />
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium leading-tight">
                  Secure Checkout
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Product Information Tabs */}
      <div className="container-fashion py-6 md:py-10 mb-8">
        <div className="border-t border-border/60 pt-6">
          {/* Tab Navigation */}
          <div className="flex gap-6 md:gap-8 border-b border-border/60 mb-5 overflow-x-auto scrollbar-hide">
            {[
              { id: "details", label: "Details", icon: Info },
              { id: "shipping", label: "Shipping", icon: Truck },
              { id: "returns", label: "Returns", icon: RotateCcw },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as "details" | "shipping" | "returns")
                }
                className={cn(
                  "pb-3 text-xs md:text-sm font-medium uppercase tracking-wider transition-colors relative flex items-center gap-1.5 whitespace-nowrap",
                  activeTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon size={14} />
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="min-h-40 font-sans"
            >
              {activeTab === "details" && (
                <div className="w-full">
                  {product.productDetailsHtml && (
                    <div className="mb-6">
                      <div
                        className="product-details font-sans text-left leading-relaxed text-sm [&>*]:mb-1 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:p-2 [&_td]:border [&_td]:p-2 [&_th]:text-left [&_td]:text-left"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(product.productDetailsHtml),
                        }}
                      />
                    </div>
                  )}
                  {details.length > 0 ? (
                    <ul className="space-y-2.5">
                      {details.map((detail: string, index: number) => (
                        <li
                          key={index}
                          className="flex items-start gap-2.5 text-muted-foreground text-sm"
                        >
                          <span className="w-1 h-1 rounded-full bg-foreground mt-1.5 shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm"></p>
                  )}
                </div>
              )}

              {(activeTab === "shipping" || activeTab === "returns") && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <h3 className="text-lg md:text-xl font-sans text-left font-medium text-foreground">
                    {policyData[activeTab].title}
                  </h3>
                  {policyData[activeTab]?.intro && (
                    <p className="text-sm leading-relaxed text-left text-muted-foreground">
                      {policyData[activeTab]?.intro}
                    </p>
                  )}
                  <div className="space-y-5">
                    {policyData[activeTab].content.map((section, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-0.5 w-6 h-6 text-[10px] font-bold border border-border/80 bg-muted/30 rounded-full flex items-center justify-center shrink-0">
                            {index + 1}
                          </div>
                          <h4 className="font-medium text-foreground text-sm font-sans text-left">
                            {section.heading}
                          </h4>
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed text-left pl-8">
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
        <section className="container-fashion py-12 md:py-16 border-t border-border/60">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-serif text-xl md:text-2xl font-medium mb-1.5 text-center">
              You May Also Like
            </h2>
            <p className="text-muted-foreground text-center mb-8 text-sm">
              Complete your look with these curated pieces
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {relatedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </motion.div>
        </section>
      )}

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#000",
            color: "#fff",
            borderRadius: "10px",
            fontSize: "13px",
          },
        }}
      />
    </div>
  );
}
