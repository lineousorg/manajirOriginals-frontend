/* eslint-disable @next/next/no-img-element */
"use client";

import { Category, Product } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ProductGridSkeleton } from "@/components/ui/Loader";
import { ProductCard } from "@/components/product/ProductCard";
import { productService } from "@/services/product.service";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [featured, sellers, cats] = await Promise.all([
          productService.getFeaturedProducts(),
          productService.getBestSellers(),
          productService.getCategories(),
        ]);
        setFeaturedProducts(featured);
        setBestSellers(sellers);
        setCategories(cats);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-dvh min-h-150 flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&q=80)",
          }}
        >
          {/* <div className="absolute inset-0 bg-foreground/30" /> */}
        </div>
        <div className="container-fashion relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl text-background"
          >
            <p className="text-label text-background/80 mb-4">New Collection</p>
            <h1 className="heading-display mb-6">
              Timeless
              <br />
              Elegance
            </h1>
            <p className="text-lg text-background/80 mb-8 max-w-md">
              Discover our curated collection of premium essentials, crafted for
              the modern wardrobe.
            </p>
            <Link href="/products" className="btn-primary-fashion">
              Explore Collection
              <ArrowRight size={18} className="ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="container-fashion">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-section">Shop by Category</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {categories.slice(0, 6).map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={`/products?category=${category.slug}`}
                  className="group block relative aspect-4/5 overflow-hidden rounded-lg"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* <div className="absolute inset-0 bg-linear-to-t from-foreground/60 to-transparent" /> */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-serif text-xl text-background">
                      {category.name}
                    </h3>
                    <p className="text-sm text-background/70 mt-1">
                      {category.productCount} items
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-muted/30">
        <div className="container-fashion">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <p className="text-label mb-2">Just Arrived</p>
              <h2 className="heading-section">New Arrivals</h2>
            </div>
            <Link
              href="/products?sort=newest"
              className="text-sm uppercase tracking-wider link-underline hidden md:block"
            >
              View All
            </Link>
          </motion.div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Banner */}
      <section className="py-20">
        <div className="container-fashion">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative h-125 rounded-2xl overflow-hidden"
          >
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80"
              alt="Sustainable Fashion"
              className="w-full h-full object-cover"
            />
            {/* <div className="absolute inset-0 bg-foreground/40" /> */}
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div className="max-w-xl px-6 text-background">
                <p className="text-label text-background/80 mb-4">
                  Our Commitment
                </p>
                <h2 className="heading-section mb-4 text-background">
                  Sustainable Fashion
                </h2>
                <p className="text-background/80 mb-8">
                  Every piece is crafted with intention, using responsibly
                  sourced materials and ethical manufacturing practices.
                </p>
                <button className="btn-outline-fashion border-background text-background hover:bg-background hover:text-foreground">
                  Learn More
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-20">
        <div className="container-fashion">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <p className="text-label mb-2">Most Loved</p>
              <h2 className="heading-section">Best Sellers</h2>
            </div>
            <Link
              href="/products?sort=popular"
              className="text-sm uppercase tracking-wider link-underline hidden md:block"
            >
              View All
            </Link>
          </motion.div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {bestSellers.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      {/* <section className="py-20 bg-foreground text-background">
        <div className="container-fashion">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-xl mx-auto"
          >
            <h2 className="heading-section mb-4">Stay in the Know</h2>
            <p className="text-background/70 mb-8">
              Subscribe to receive updates on new arrivals, exclusive offers,
              and styling tips.
            </p>
            <form className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 bg-background/10 border border-background/20 text-background placeholder:text-background/50 focus:outline-none focus:border-background/40"
              />
              <button type="submit" className="btn-primary-fashion">
                Subscribe
              </button>
            </form>
          </motion.div>
        </div>
      </section> */}
    </div>
  );
}
