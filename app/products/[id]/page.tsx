/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductCard } from "@/components/product/ProductCard";
import { Loader } from "@/components/ui/Loader";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useProductById,
  useProducts,
  getProductCategories,
} from "@/hooks/useProduct";
import { TypeImage } from "@/types";
import toast, { Toaster } from "react-hot-toast";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  const { product, loading } = useProductById(id, { refreshInterval: 30_000 });
  const { products: allProducts } = useProducts({ refreshInterval: 60_000 });

  const addToCart = useCartStore((state) => state.addItem);
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  // State for selected size and color
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  // Extract available colors for a specific size from variants
  const getColorsForSize = (size: string): string[] => {
    if (!product?.variants || !size) return [];
    const colors: string[] = [];
    
    product.variants.forEach((variant: any) => {
      if (variant.attributes && Array.isArray(variant.attributes)) {
        const variantSize = variant.attributes.find(
          (attr: any) => attr.attributeValue?.attribute?.name === "Size" && attr.attributeValue?.value === size
        );
        if (variantSize) {
          const colorAttr = variant.attributes.find(
            (attr: any) => attr.attributeValue?.attribute?.name === "Color"
          );
          if (colorAttr?.attributeValue?.value && !colors.includes(colorAttr.attributeValue.value)) {
            colors.push(colorAttr.attributeValue.value);
          }
        }
      }
    });
    return colors;
  };

  // Get all available sizes from variants
  const availableSizes = product?.sizes ?? [];
  
  // Get available colors for the currently selected size
  const availableColorsForSelectedSize = getColorsForSize(selectedSize);

  // Initialize defaults when product loads - this is intentional for initializing from fetched data
  useEffect(() => {
    if (product && availableSizes.length > 0 && !selectedSize) {
      // Auto-select first size
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSize(availableSizes[0]);
      // Auto-select first available color for this size
      const initialColors = getColorsForSize(availableSizes[0]);
      if (initialColors.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedColor(initialColors[0]);
      }
    }
    // We only want this to run when product first loads
  }, [product]);

  // Update color when size changes - handle size-specific color availability
  useEffect(() => {
    if (selectedSize && availableColorsForSelectedSize.length > 0) {
      // If current color is not available for the new size, select a valid one
      if (selectedColor && !availableColorsForSelectedSize.includes(selectedColor)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedColor(availableColorsForSelectedSize[0]);
      }
    }
  }, [selectedSize]);

  // Related products: same category, different id
  const relatedProducts = product
    ? allProducts
        .filter(
          (p) => p.id !== product.id && p.categoryId === product.categoryId,
        )
        .slice(0, 4)
    : [];

  const productId = product ? String(product.id) : "";
  const inWishlist = product ? isInWishlist(productId) : false;

  const images =
    product?.images && product.images.length > 0
      ? product.images
      : [
          {
            url: "https://placehold.co/600x800?text=No+Image",
            altText: "No Image",
          },
        ];

  const details = product?.details ?? [];
  const categories = product ? getProductCategories(product) : null;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!product) return;

    // Validate size selection if product has sizes
    if ((product.sizes ?? []).length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    // Validate color selection if product has colors for the selected size
    if (availableColorsForSelectedSize.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return;
    }

    const normalizedImages: TypeImage[] = Array.isArray(product.images)
      ? product.images.map((img) =>
          typeof img === "string" ? { url: img, altText: product.name } : img,
        )
      : [];

    addToCart(
      {
        ...product,
        id: productId,
        images: normalizedImages,
      },
      selectedSize || "One Size",
      selectedColor || "Default",
      quantity,
    );
  };

  if (loading && !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-fashion py-16 text-center min-h-screen">
        <p className="text-muted-foreground">Product not found.</p>
        <Link
          href="/products"
          className="btn-primary-fashion mt-4 inline-block"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  console.log(product);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="container-fashion py-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight size={14} />
          <Link
            href="/products"
            className="hover:text-foreground transition-colors"
          >
            Products
          </Link>
          {categories?.parent && (
            <>
              <ChevronRight size={14} />
              <Link
                href={`/products?category=${(categories.parent as any).slug}`}
                className="hover:text-foreground transition-colors"
              >
                {categories.parent.name}
              </Link>
            </>
          )}
          {categories?.child && (
            <>
              <ChevronRight size={14} />
              <Link
                href={`/products?category=${(categories.child as any).slug}`}
                className="hover:text-foreground transition-colors"
              >
                {categories.child.name}
              </Link>
            </>
          )}
          <ChevronRight size={14} />
          <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      {/* Product Details */}
      <div className="container-fashion py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 ">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ProductGallery images={images} productName={product.name} />
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:sticky lg:top-28 lg:self-start"
          >
            {/* <p className="text-label mb-2">{product.brand}</p> */}
            <h1 className="font-serif text-3xl md:text-4xl font-medium mb-2 text-left">
              {product.name}
            </h1>
            {product.description && (
              <p className="text-muted-foreground mb-8 text-left">
                {product.description}
              </p>
            )}

            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-medium">
                ৳ {product?.variants[0]?.price}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  ৳{product.originalPrice}
                </span>
              )}
              {product.isSale && product.originalPrice && (
                <span className="badge-sale">
                  {Math.round(
                    (1 - product.price / product.originalPrice) * 100,
                  )}
                  % Off
                </span>
              )}
            </div>

            {/* Color Selection */}
            {availableColorsForSelectedSize.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-label">Color</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedColor}
                  </span>
                </div>
                <div className="flex gap-3">
                  {availableColorsForSelectedSize.map((color: string) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full transition-all ${
                        selectedColor === color
                          ? "ring-2 ring-offset-2 ring-foreground"
                          : "hover:ring-2 hover:ring-offset-2 hover:ring-muted-foreground"
                      }`}
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {(product.sizes ?? []).length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-label">Size</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedSize}
                  </span>
                  <button className="text-sm text-primary hover:underline">
                    Size Guide
                  </button>
                </div>
                <div className="flex gap-2">
                  {(product.sizes ?? []).map((size: any) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-10 md:w-14 md:h-12 border rounded-md text-sm font-medium transition-all ${
                        selectedSize === size
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8 flex flex-col items-start justify-start">
              <span className="text-label mb-3 block">Quantity</span>
              <div className="inline-flex items-center border border-border rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-muted transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={18} />
                </button>
                <span className="px-6 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-muted transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                className="flex-1 btn-primary-fashion disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Bag
              </button>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    router.push("/login");
                    return;
                  }
                  toggleItem({
                    ...product,
                    id: productId,
                    images,
                  } as any);
                }}
                className={`p-4 border rounded-md transition-all ${
                  inWishlist
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-foreground"
                }`}
                aria-label={
                  inWishlist ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                <Heart size={20} fill={inWishlist ? "currentColor" : "none"} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container-fashion py-4 mb-10">
        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 border-t border-b border-border mb-8">
          <div className="text-center">
            <Truck size={20} className="mx-auto mb-2 text-muted-foreground" />
            <p className=" text-muted-foreground">Free Shipping</p>
          </div>
          <div className="text-center">
            <RotateCcw
              size={20}
              className="mx-auto mb-2 text-muted-foreground"
            />
            <p className=" text-muted-foreground">Easy Returns</p>
          </div>
          <div className="text-center">
            <ShieldCheck
              size={20}
              className="mx-auto mb-2 text-muted-foreground"
            />
            <p className=" text-muted-foreground">Secure Checkout</p>
          </div>
        </div>

        {/* Accordion Details */}
        {/* <Accordion type="single" collapsible className="w-full">
          {details.length > 0 && (
            <AccordionItem value="details">
              <AccordionTrigger className="text-label hover:no-underline text-lg">
                Product Details
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  {details.map((detail, index) => (
                    <li key={index}>• {detail}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}
          <AccordionItem value="shipping">
            <AccordionTrigger className="text-label hover:no-underline text-lg">
              Shipping & Returns
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-muted-foreground text-sm space-y-2">
                <p>Free standard shipping on orders over ৳150.</p>
                <p>Express shipping available for ৳15.</p>
                <p>Free returns within 30 days of purchase.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion> */}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="container-fashion py-16 ">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="heading-section mb-8"
          >
            You May Also Like
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>
      )}
      <Toaster />
    </div>
  );
}
