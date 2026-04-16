/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Check,
  Share2,
  Info,
  Package,
} from "lucide-react";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductCard } from "@/components/product/ProductCard";
import { Loader } from "@/components/ui/Loader";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProductById, getProductCategories } from "@/hooks/useProduct";
import { useProductStore } from "@/store/product.store";
import { TypeImage } from "@/types";
import toast, { Toaster } from "react-hot-toast";
import { stockReservationService } from "@/services/stock-reservation.service";
import policyData from "@/lib/policy-data.json";

// Helper function to find a variant by size and color
const findVariant = (variants: any[], size: string, color?: string): any => {
  if (!variants || variants.length === 0) return null;

  return variants.find((variant) => {
    const sizeMatch = variant.attributes?.some(
      (attr: any) =>
        attr.attributeValue?.attribute?.name === "Size" &&
        attr.attributeValue?.value === size
    );

    const colorMatch =
      !color ||
      variant.attributes?.some(
        (attr: any) =>
          attr.attributeValue?.attribute?.name === "Color" &&
          attr.attributeValue?.value === color
      );

    return sizeMatch && colorMatch;
  });
};

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quantity, setQuantity] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "details" | "shipping" | "returns"
  >("details");

  const { product, loading, refetch } = useProductById(id);
  // Use global store for related products instead of making separate API call
  const globalProducts = useProductStore((state) => state.products);

  const addToCart = useCartStore((state) => state.addItem);
  const isItemInCart = useCartStore((state) => state.isItemInCart);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  const lastCartChange = useCartStore((state) => state.lastCartChange);
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isRefetchingStock, setIsRefetchingStock] = useState(false);
  const prevLastCartChange = useRef<number>(0);

  // Get all sizes
  const availableSizes = useMemo(() => {
    if (!product?.sizes) return [];
    return product.sizes;
  }, [product?.sizes]);
  const availableColorsForSelectedSize = useMemo(() => {
    if (!product?.variants || !selectedSize) return [];
    const colors: string[] = [];

    product.variants.forEach((variant: any) => {
      if (variant.attributes && Array.isArray(variant.attributes)) {
        const variantSize = variant.attributes.find(
          (attr: any) =>
            attr.attributeValue?.attribute?.name === "Size" &&
            attr.attributeValue?.value === selectedSize
        );
        if (variantSize) {
          const colorAttr = variant.attributes.find(
            (attr: any) => attr.attributeValue?.attribute?.name === "Color"
          );
          if (
            colorAttr?.attributeValue?.value &&
            !colors.includes(colorAttr.attributeValue.value)
          ) {
            colors.push(colorAttr.attributeValue.value);
          }
        }
      }
    });
    return colors;
  }, [product?.variants, selectedSize]);

  // Calculate price based on selected variant using helper
  const selectedVariant = useMemo(
    () => findVariant(product?.variants || [], selectedSize, selectedColor),
    [product?.variants, selectedSize, selectedColor]
  );

  // Determine price using API discount data when available
  const currentPrice = selectedVariant?.hasDiscount
    ? selectedVariant?.finalPrice ??
      selectedVariant?.price ??
      product?.variants?.[0]?.price ??
      product?.price ??
      0
    : selectedVariant?.price ??
      product?.variants?.[0]?.price ??
      product?.price ??
      0;

  const originalPrice = selectedVariant?.hasDiscount
    ? selectedVariant?.price
    : selectedVariant?.price ?? product?.originalPrice;

  const discountPercentage = selectedVariant?.hasDiscount
    ? selectedVariant?.discountValue
      ? parseInt(selectedVariant.discountValue)
      : originalPrice && currentPrice < originalPrice
      ? Math.round((1 - currentPrice / originalPrice) * 100)
      : 0
    : 0;

  // Initialize defaults when product loads
  useEffect(() => {
    if (product && availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0]);
      // Get all colors for the initial size (including out of stock)
      const initialColors: string[] = [];
      product.variants?.forEach((variant: any) => {
        const variantSize = variant.attributes?.find(
          (attr: any) =>
            attr.attributeValue?.attribute?.name === "Size" &&
            attr.attributeValue?.value === availableSizes[0]
        );
        if (variantSize) {
          const colorAttr = variant.attributes.find(
            (attr: any) => attr.attributeValue?.attribute?.name === "Color"
          );
          if (
            colorAttr?.attributeValue?.value &&
            !initialColors.includes(colorAttr.attributeValue.value)
          ) {
            initialColors.push(colorAttr.attributeValue.value);
          }
        }
      });
      if (initialColors.length > 0) {
        setSelectedColor(initialColors[0]);
      }
    }
  }, [product, availableSizes, selectedSize]);

  // Update color when size changes
  useEffect(() => {
    if (selectedSize && availableColorsForSelectedSize.length > 0) {
      if (
        !selectedColor ||
        !availableColorsForSelectedSize.includes(selectedColor)
      ) {
        setSelectedColor(availableColorsForSelectedSize[0]);
      }
    }
  }, [selectedSize, availableColorsForSelectedSize, selectedColor]);

  // Refetch product stock when cart changes (add, remove, or update items)
  useEffect(() => {
    // Skip on initial mount (when prevLastCartChange is 0)
    if (lastCartChange > 0 && lastCartChange !== prevLastCartChange.current) {
      console.log("[DEBUG] Cart changed, refetching stock:", lastCartChange);
      prevLastCartChange.current = lastCartChange;
      setIsRefetchingStock(true);
      refetch().finally(() => setIsRefetchingStock(false));
    }
  }, [lastCartChange, refetch]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return globalProducts
      .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
      .slice(0, 4);
  }, [product, globalProducts]);

  const productId = product ? String(product.id) : "";
  const inWishlist = product ? isInWishlist(productId) : false;

  // Get stock for a specific size (sum across all colors for that size)
  // NOTE: Using stock directly instead of availableStock because availableStock
  // has a bug where it's being over-reduced (showing 0 when stock is 1)
  const getStockForSize = useMemo(
    () =>
      (size: string): number => {
        if (!product?.variants) {
          console.log("[DEBUG] getStockForSize: no variants", {
            productId: product?.id,
            size,
          });
          return 0;
        }
        let totalStock = 0;
        const debugVariants: any[] = [];
        product.variants.forEach((variant: any) => {
          const variantSize = variant.attributes?.find(
            (attr: any) =>
              attr.attributeValue?.attribute?.name === "Size" &&
              attr.attributeValue?.value === size
          );
          // Use stock instead of availableStock to avoid incorrect stock display
          // availableStock has a bug where it's being over-reduced by reservations
          const available = variant.stock ?? 0;
          debugVariants.push({
            id: variant.id,
            sku: variant.sku,
            stock: variant.stock,
            availableStock: variant.availableStock,
            available,
            variantSize: !!variantSize,
            sizeAttr: variant.attributes?.find(
              (a: any) => a.attributeValue?.attribute?.name === "Size"
            )?.attributeValue?.value,
          });
          if (variantSize && available > 0) {
            totalStock += available;
          }
        });
        console.log("[DEBUG] getStockForSize:", {
          size,
          totalStock,
          variants: debugVariants,
        });
        return totalStock;
      },
    [product?.variants]
  );

  // Calculate available stock for the selected variant directly from product API
  // Using stock instead of availableStock to avoid incorrect stock display
  const selectedVariantAvailableStock =
    selectedVariant?.stock ?? selectedVariant?.availableStock ?? 0;

  // remainingStock = how many more user can add (available stock after reservations)
  const remainingStock = Math.max(0, selectedVariantAvailableStock);

  // displayStock = what to show in UI (available minus what user is about to add in current session)
  const displayStock = Math.max(0, selectedVariantAvailableStock - quantity);

  // canAddMore: whether user can add more of this variant to cart
  const canAddMore = remainingStock > 0;

  // isStockExceeded: whether max stock is reached (can't add more)
  const isStockExceeded = !canAddMore;

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
    [product?.images]
  );

  const details = product?.details ?? [];

  const categories = product ? getProductCategories(product) : null;

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
          typeof img === "string" ? { url: img, altText: product.name } : img
        )
      : [];

    // Check if item already exists in cart
    const size = selectedSize || "One Size";
    const color = selectedColor || "Default";
    const isAlreadyInCart = isItemInCart(productId, size, color);

    // Prevent adding if quantity is 0
    if (!quantity || quantity <= 0) {
      toast.error("Please select a quantity");
      setIsAddingToCart(false);
      return;
    }

    // Prevent adding if quantity is 0
    if (!quantity || quantity <= 0) {
      toast.error("Please select a quantity");
      setIsAddingToCart(false);
      return;
    }

    // Find the variant for reservation using helper
    const selectedVariantInAddToCart = findVariant(
      product.variants || [],
      size,
      color
    );
    const variantId = selectedVariantInAddToCart?.id;

    // Validate variant exists
    if (!variantId) {
      toast.error("Selected variant is not available");
      setIsAddingToCart(false);
      return;
    }

    // Re-check available stock immediately before reservation to prevent race condition
    // This ensures we have the most up-to-date stock info
    try {
      const stockCheck = await stockReservationService.getAvailableStock(
        variantId
      );
      if (stockCheck.success && stockCheck.data) {
        // If no stock available, don't even try to reserve
        if (stockCheck.data.availableStock < quantity) {
          if (stockCheck.data.availableStock === 0) {
            toast.error(
              "This item is out of stock. Please choose a different option."
            );
          } else {
            toast.error(
              `Only ${stockCheck.data.availableStock} available. Please adjust quantity.`
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

    // Try to reserve stock from backend
    // Backend validates stock availability before decrementing
    let reservationResult;
    try {
      reservationResult = await stockReservationService.reserveStock(
        variantId,
        quantity,
        15 // 15 minutes expiration
      );
    } catch (error) {
      console.error("Failed to reserve stock:", error);
      toast.error("Unable to reserve stock. Please try again.");
      setIsAddingToCart(false);
      return;
    }

    // Add item to cart - returns { success, isExisting }
    const result = addToCart(
      {
        ...product,
        id: productId,
        images: normalizedImages,
      },
      size,
      color,
      quantity,
      reservationResult?.data?.reservationId, // Pass reservation ID
      reservationResult?.data?.expiresAt // Pass expiration time
    );

    // Handle different outcomes
    if (!result.success) {
      // Validation failed - release the reservation
      if (reservationResult?.data?.reservationId) {
        try {
          await stockReservationService.releaseReservation(
            reservationResult.data.reservationId
          );
        } catch (releaseError) {
          console.error("Failed to release reservation:", releaseError);
          // Log for manual cleanup but don't block the user flow
        }
      }
      toast.error(
        "Selected size or color is not available. Please choose different options."
      );
      setIsAddingToCart(false);
      return;
    }

    // Provide appropriate feedback
    if (result.isExisting) {
      toast.success(`Updated quantity in your bag!`);
    } else if (isAlreadyInCart) {
      toast.success(`Added another ${product.name} to your bag!`);
    } else {
      toast.success("Added to bag!");
    }

    // Reset quantity after successful add (set to 0 for next item)
    setQuantity(0);
    setIsAddingToCart(false);

    // Refetch product to get updated stock (reservation decrements backend stock)
    setIsRefetchingStock(true);
    refetch().finally(() => setIsRefetchingStock(false));
  };

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

  // Calculate if product is in cart with current selections
  const isInCart = useMemo(() => {
    if (!product) return false;
    const size = selectedSize || "One Size";
    const color = selectedColor || "Default";
    return isItemInCart(productId, size, color);
  }, [product, selectedSize, selectedColor, productId, isItemInCart]);

  const isOutOfStock = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) {
      // If no variants, check for a direct stock property
      return !product?.stock || product.stock === 0;
    }
    // Check if ALL variants have 0 available stock (stock minus reservations)
    const allVariantsOutOfStock = product.variants.every((variant: any) => {
      const available = variant.availableStock ?? variant.stock ?? 0;
      return available <= 0;
    });
    return allVariantsOutOfStock;
  }, [product?.variants, product?.stock]);

  if (loading && !product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader size="lg" />
      </div>
    );
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
            The product you Are looking for does not exist or has been removed.
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
      <div className="container-fashion py-4">
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
                href={`/products?category=${(categories.parent as any).slug}`}
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
                href={`/products?category=${(categories.child as any).slug}`}
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
      </div>

      {/* Product Details */}
      <div className="container-fashion py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 z-0"
          >
            <ProductGallery images={images} productName={product.name} />
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-2xl text-left">
                  {product.description}
                </p>
              )}

              {/* Price Row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3 mb-6"
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="text-3xl font-semibold tracking-tight"
                >
                  ৳ {currentPrice.toLocaleString()}
                </motion.span>

                {originalPrice && originalPrice > currentPrice && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="text-lg text-muted-foreground line-through decoration-2"
                  >
                    ৳{originalPrice.toLocaleString()}
                  </motion.span>
                )}

                {discountPercentage > 0 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
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
              <div className="h-px bg-border w-full" />
            </div>

            {/* Variant Selection */}
            <div className="space-y-8 mb-8">
              {/* Color Selection - Only show if more than 1 color available */}
              {availableColorsForSelectedSize.length > 1 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground w-24 shrink-0">
                      Color
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {availableColorsForSelectedSize.map((color: string) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`
                relative px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer
                ${
                  selectedColor === color
                    ? "bg-foreground text-background shadow-lg scale-105"
                    : "bg-muted/50 text-foreground hover:bg-muted border border-border"
                }
              `}
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
                </div>
              )}

              {/* Size Selection - Only show if more than 1 size available */}
              {availableSizes.length > 1 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground w-24 shrink-0">
                      Size
                    </span>
                    <div className="flex flex-wrap gap-4">
                      {availableSizes.map((size: any) => {
                        const stock = getStockForSize(size);
                        const isLowStock = stock > 0 && stock <= 3;
                        const isOutOfStock = stock <= 0;
                        return (
                          <div key={size} className="relative">
                            <button
                              onClick={() => {
                                setSelectedSize(size);
                                setQuantity(0);
                              }}
                              disabled={isOutOfStock}
                              className={`
                                w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200 
                                ${
                                  isOutOfStock
                                    ? "opacity-40 cursor-not-allowed line-through"
                                    : "cursor-pointer"
                                }
                                ${
                                  selectedSize === size
                                    ? "bg-foreground text-background shadow-md scale-105"
                                    : "bg-background text-foreground border-2 border-border hover:border-primary/50 hover:bg-muted/30"
                                }
                              `}
                            >
                              {size}
                            </button>
                            {/* {isLowStock && (
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 rounded text-[10px] font-medium text-orange-700 dark:text-orange-400 whitespace-nowrap">
                                {stock} left
                              </div>
                            )} */}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground w-24 shrink-0">
                  Quantity
                </span>
                <div className="inline-flex items-center bg-muted/30 rounded-full border border-border ">
                  <button
                    onClick={() => setQuantity(Math.max(0, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    disabled={quantity <= 0}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} strokeWidth={2.5} />
                  </button>
                  <span className="w-12 text-center font-semibold text-lg tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    disabled={remainingStock <= 0 || quantity >= remainingStock}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
                {selectedVariantAvailableStock > 0 && (
                  <span
                    className={`text-xs font-medium ${
                      remainingStock <= 0
                        ? "text-gray-500"
                        : remainingStock <= 3
                        ? "text-gray-500"
                        : "text-green-600"
                    }`}
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
              </div>

              {/* Size Guide Thumbnail */}
              <div
                className="mt-6 cursor-pointer group w-fit"
                onClick={() => setIsSizeGuideOpen(true)}
              >
                <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20 p-2 transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md">
                  <Image
                    src="/Size guides/punjabi-size-guide.jpeg"
                    alt="Size Guide"
                    width={280}
                    height={180}
                    className="w-64 h-auto rounded-lg object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 rounded-xl">
                    <span className="text-xs font-medium bg-background/90 px-3 py-1.5 rounded-full shadow-sm">
                      Click to enlarge
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Size Guide
                </p>
              </div>

              {/* Size Guide Modal */}
              {isSizeGuideOpen && (
                <div
                  className="fixed inset-0 z-999 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                  onClick={() => setIsSizeGuideOpen(false)}
                >
                  <div
                    className="relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="absolute -top-8 -right-8 bg-background rounded-full p-2.5 shadow-lg transition-colors z-10 cursor-pointer hover:bg-primary hover:text-background"
                      onClick={() => setIsSizeGuideOpen(false)}
                    >
                      <Plus size={20} className="rotate-45" />
                    </button>
                    <Image
                      src="/Size guides/punjabi-size-guide.jpeg"
                      alt="Size Guide"
                      width={500}
                      height={500}
                      className="w-full h-auto rounded-2xl"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <motion.button
                onClick={handleAddToCart}
                disabled={
                  isAddingToCart ||
                  isOutOfStock ||
                  isStockExceeded ||
                  quantity <= 0
                }
                whileTap={{ scale: 0.98 }}
                className={`flex-1 btn-primary-fashion h-14 text-base font-medium disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden rounded-lg ${
                  isStockExceeded ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <AnimatePresence mode="wait">
                  {quantity <= 0 ? (
                    <motion.span
                      key="selectqty"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-center gap-2"
                    >
                      Select Quantity
                    </motion.span>
                  ) : isOutOfStock ? (
                    <motion.span
                      key="outofstock"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-center gap-2"
                    >
                      Out of Stock
                    </motion.span>
                  ) : isStockExceeded ? (
                    <motion.span
                      key="stockexceeded"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-center gap-2"
                    >
                      Max Stock Reached
                    </motion.span>
                  ) : isInCart ? (
                    <motion.span
                      key="incart"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Check size={18} />
                      Added to Bag
                    </motion.span>
                  ) : isAddingToCart ? (
                    <motion.span
                      key="adding"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Loader size="sm" />
                      Adding...
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      Add to Bag — ৳{(currentPrice * quantity).toLocaleString()}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <motion.button
                onClick={() => {
                  toggleItem({
                    ...product,
                    id: productId,
                    images,
                  } as any);
                }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                  inWishlist
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-foreground bg-background"
                }`}
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
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 text-sm font-medium uppercase tracking-wider transition-colors relative flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
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
                  <h3 className="text-2xl text-left font-medium text-foreground">
                    {policyData[activeTab].title}
                  </h3>

                  {/* Intro text (only for shipping tab) */}
                  {policyData[activeTab]?.intro && (
                    <p className="text-sm underline text-muted-foreground leading-relaxed text-left">
                      {policyData[activeTab]?.intro}
                    </p>
                  )}

                  <div className="space-y-6">
                    {policyData[activeTab].content.map((section, index) => (
                      <div key={index} className="space-y-2">
                        <h4 className="font-medium text-foreground text-xl text-left">
                          {section.heading}
                        </h4>
                        <div className="text- text-muted-foreground whitespace-pre-line leading-relaxed text-left">
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
          style: {
            background: "#000",
            color: "#fff",
            borderRadius: "8px",
          },
        }}
      />
    </div>
  );
}
