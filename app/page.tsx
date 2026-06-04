"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ProductGridSkeleton } from "@/components/ui/Loader";
import { ProductCard } from "@/components/product/ProductCard";
import { useProducts, useCategories } from "@/hooks/useProduct";
import Banner from "@/components/sections/Banner";
import BrandStorySection from "@/components/sections/BrandStorySection";

// Animation variants for scroll fade-in
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export default function Home() {
  const { products, loading: productsLoading } = useProducts();
  const { categories } = useCategories();

  // Use first 8 newest products for a full two-row desktop section
  const featuredProducts = products.slice(0, 8);
  // Use next 4 as "best sellers"
  const bestSellers = products.slice(8, 12);

  // Get all categories from API, sorted alphabetically
  const sortedCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const displayCategories = sortedCategories.slice(0, 5);
  // console.log(displayCategories);

  return (
    <div>
      {/* Hero Section */}
      <Banner />

      {/* New Arrivals */}
      <section className="py-20 bg-white rounded-t-[30px] -mt-7 z-99 relative">
        <div className="container-fashion">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ margin: "-100px" }}
            variants={fadeInUp}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <p className="text-label mb-2">Just Arrived</p>
              <h2 className="heading-section">New Arrivals</h2>
            </div>
            <Link
              href="/products?sort=newest"
              className="hidden items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-700 transition-colors hover:text-black md:flex"
            >
              View All
              <ArrowUpRight size={16} />
            </Link>
          </motion.div>

          {productsLoading && featuredProducts.length === 0 ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ margin: "-50px" }}
              variants={staggerContainer}
            >
              {featuredProducts.map((product, index) => (
                <motion.div variants={fadeInUp} key={product.id}>
                  <ProductCard product={product} index={index} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-20 bg-[#f7f5f0] relative z-99">
          <div className="container-fashion">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ margin: "-100px" }}
              variants={fadeInUp}
              className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
            >
              <div>
                <p className="text-label mb-2">Curated Paths</p>
                <h2 className="heading-section">Shop by Category</h2>
              </div>
              <Link
                href="/products"
                className="inline-flex w-fit items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-700 transition-colors hover:text-black"
              >
                Browse all
                <ArrowRight size={16} />
              </Link>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-2 md:gap-5"
              initial="hidden"
              whileInView="visible"
              viewport={{ margin: "-50px" }}
              variants={staggerContainer}
            >
              {displayCategories.map((category, index) => {
                const categoryImage = category.images?.[0]?.url;
                const productCount =
                  category._count?.products ?? category.productCount ?? 0;
                const isFeatureTile = index === 0;

                return (
                  <motion.div
                    key={category.id}
                    variants={fadeInUp}
                    className={
                      isFeatureTile ? "md:col-span-2 md:row-span-2" : ""
                    }
                  >
                    <Link
                      href={`/products/category/${category.slug}`}
                      className={`group relative block overflow-hidden rounded-[8px] bg-neutral-200 ${
                        isFeatureTile
                          ? "min-h-[420px] md:min-h-full"
                          : "min-h-[220px]"
                      }`}
                    >
                      {categoryImage ? (
                        <Image
                          src={categoryImage}
                          alt={category.name}
                          fill
                          sizes={
                            isFeatureTile
                              ? "(max-width: 768px) 100vw, 50vw"
                              : "(max-width: 768px) 100vw, 25vw"
                          }
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 bg-neutral-200" />
                      )}

                      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
                      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-900">
                            {productCount} items
                          </span>
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-900 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1">
                            <ArrowUpRight size={17} />
                          </span>
                        </div>
                        <h3
                          className={`text-left font-serif font-semibold leading-tight text-white ${
                            isFeatureTile
                              ? "text-3xl md:text-5xl"
                              : "text-2xl md:text-3xl"
                          }`}
                        >
                          {category.name}
                        </h3>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* <BrandStorySection /> */}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="py-20 z-99 relative bg-white">
          <div className="container-fashion">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ margin: "-100px" }}
              variants={fadeInUp}
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

            {productsLoading && bestSellers.length === 0 ? (
              <ProductGridSkeleton count={4} />
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
                initial="hidden"
                whileInView="visible"
                viewport={{ margin: "-50px" }}
                variants={staggerContainer}
              >
                {bestSellers.map((product, index) => (
                  <motion.div variants={fadeInUp} key={product.id}>
                    <ProductCard product={product} index={index} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
