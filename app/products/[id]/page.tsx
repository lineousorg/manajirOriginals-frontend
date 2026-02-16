"use client";

import { useEffect, useState } from "react";
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
import { productService } from "@/services/product.service";
import { Product } from "@/types";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductCard } from "@/components/product/ProductCard";
import { Loader } from "@/components/ui/Loader";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PageProps {
  params: { id: string };
}

export default function ProductDetailsPage({ params }: PageProps) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  const addToCart = useCartStore((state) => state.addItem);
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [productData, related] = await Promise.all([
          productService.getProductById(id),
          productService.getRelatedProducts(id),
        ]);

        if (!productData) {
          router.push("/products");
          return;
        }

        setProduct(productData);
        setRelatedProducts(related);
        setSelectedSize(productData.sizes[0] || "");
        setSelectedColor(productData.colors[0]?.name || "");
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id, router]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!product || !selectedSize || !selectedColor) return;
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" />
      </div>
    );
  }

  if (!product) return null;

  const inWishlist = isInWishlist(product.id);

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
            <ProductGallery
              images={product.images}
              productName={product.name}
            />
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
            <p className="text-muted-foreground mb-8 text-left">
              {product.description}
            </p>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-medium">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
              {product.isSale && (
                <span className="badge-sale">
                  {Math.round(
                    (1 - product.price / product.originalPrice!) * 100
                  )}
                  % Off
                </span>
              )}
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-label">Color</span>
                <span className="text-sm text-muted-foreground">
                  {selectedColor}
                </span>
              </div>
              <div className="flex gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-10 h-10 rounded-full transition-all ${
                      selectedColor === color.name
                        ? "ring-2 ring-offset-2 ring-foreground"
                        : "hover:ring-2 hover:ring-offset-2 hover:ring-muted-foreground"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-label">Size</span>
                <button className="text-sm text-primary hover:underline">
                  Size Guide
                </button>
              </div>
              <div className="flex gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-14 h-12 border rounded-md text-sm font-medium transition-all ${
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
                disabled={!selectedSize || !selectedColor}
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
                  toggleItem(product);
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
        <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-border mb-8">
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
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="details">
            <AccordionTrigger className="text-label hover:no-underline text-lg">
              Product Details
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 text-muted-foreground text-sm">
                {product.details.map((detail, index) => (
                  <li key={index}>• {detail}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="shipping">
            <AccordionTrigger className="text-label hover:no-underline text-lg">
              Shipping & Returns
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-muted-foreground text-sm space-y-2">
                <p>Free standard shipping on orders over $150.</p>
                <p>Express shipping available for $15.</p>
                <p>Free returns within 30 days of purchase.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
    </div>
  );
}
