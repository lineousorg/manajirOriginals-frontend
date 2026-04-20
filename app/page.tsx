/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ProductGridSkeleton } from "@/components/ui/Loader";
import { ProductCard } from "@/components/product/ProductCard";
import { useProducts, useCategories } from "@/hooks/useProduct";
import Banner from "@/components/sections/Banner";

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

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export default function Home() {
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();

  const loading = productsLoading || categoriesLoading;

  // Use first 4 newest products as "featured"
  const featuredProducts = products.slice(0, 4);
  // Use next 4 as "best sellers"
  const bestSellers = products.slice(4, 8);

  // Get all categories from API, sorted alphabetically
  const sortedCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const displayCategories = sortedCategories.slice(0, 6);
  // console.log(displayCategories);

  return (
    <div>
      {/* Hero Section */}
      <Banner />

      {/* Categories */}
      {categories.length > 0 && (
        <section
          className="py-20 bg-white rounded-t-[30px] -mt-7 relative z-999"
          // style={{
          //   backgroundImage: "./section-bg.png",
          //   backgroundSize: "cover",
          // }}
        >
          <div className="container-fashion">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ margin: "-100px" }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <p className="text-label mb-2">We Offer</p>
              <h2 className="heading-section text-left">Shop by Category</h2>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ margin: "-50px" }}
              variants={staggerContainer}
            >
              {displayCategories.map((category, index) => (
                <motion.div key={category.id} variants={fadeInUp}>
                  <Link
                    href={`/products/category/${category.slug}`}
                    className="group block relative aspect-4/5 overflow-hidden rounded-2xl shadow-2xl"
                  >
                    {category.images ? (
                      <div className="absolute inset-0">
                        <Image
                          src={category.images[0]?.url}
                          alt={category.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-lg">
                          {category.name}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 bg-linear-to-t from-black to-transparent">
                      <h3 className="font-serif text-xl md:text-2xl lg:text-4xl text-background">
                        {category.name}
                      </h3>
                      {/* <p className="text-sm text-background/70 mt-1">
                        {category._count?.products ??
                          category.productCount ??
                          0}{" "}
                        items
                      </p> */}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-20 bg-muted z-999 relative">
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
              className="text-sm uppercase tracking-wider link-underline hidden md:block"
            >
              View All
            </Link>
          </motion.div>

          {loading && featuredProducts.length === 0 ? (
            <ProductGridSkeleton count={4} />
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

      {/* Banner */}
      {/* <section className="py-20 z-999 relative bg-white">
        <div className="container-fashion">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ margin: "-100px" }}
            variants={fadeInScale}
            className="relative h-48 md:h-80 lg:h-100 xl:h-125 rounded-2xl overflow-hidden"
          >
            <Image
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80"
              alt="Sustainable Fashion"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
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
      </section> */}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="py-20 z-999 relative bg-white">
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

            {loading && bestSellers.length === 0 ? (
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
