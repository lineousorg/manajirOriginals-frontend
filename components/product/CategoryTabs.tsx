"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useCategories } from "@/hooks/useProduct";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  activeSlug?: string;
  hideActiveCategory?: boolean;
}

export function CategoryTabs({
  activeSlug,
  hideActiveCategory = false,
}: CategoryTabsProps) {
  const { categories, loading } = useCategories();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const visibleCategories = categories.filter((category) => {
    if (!category.slug || !category.name) return false;
    return !(hideActiveCategory && category.slug === activeSlug);
  });

  const updateScrollState = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;

    setCanScrollLeft(node.scrollLeft > 4);
    setCanScrollRight(
      node.scrollLeft + node.clientWidth < node.scrollWidth - 4,
    );
  }, []);

  const scrollTabs = (direction: "left" | "right") => {
    const node = scrollRef.current;
    if (!node) return;

    node.scrollBy({
      left: direction === "left" ? -node.clientWidth * 0.75 : node.clientWidth * 0.75,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    updateScrollState();

    const node = scrollRef.current;
    if (!node) return;

    node.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      node.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [visibleCategories.length, activeSlug, updateScrollState]);

  if (loading && visibleCategories.length === 0) {
    return (
      <div className="mb-8 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-10 w-24 shrink-0 animate-pulse rounded-full bg-neutral-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (visibleCategories.length === 0) return null;

  const allProductsActive = !activeSlug;

  return (
    <nav
      className="mb-8 flex flex-col gap-3 overflow-hidden sm:flex-row sm:items-center"
      aria-label="Product categories"
    >
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        Browse:
      </span>
      <div className="relative min-w-0 flex-1">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollTabs("left")}
            className="absolute left-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
            aria-label="Scroll categories left"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollTabs("right")}
            className="absolute right-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
            aria-label="Scroll categories right"
          >
            <ChevronRight size={18} />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex min-w-0 gap-2 overflow-x-auto scroll-smooth pb-2 sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Link
            href="/products"
            className={cn(
              "relative flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors",
              allProductsActive
                ? "text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900",
            )}
          >
            {allProductsActive && (
              <motion.span
                layoutId="category-tab-active"
                className="absolute inset-0 rounded-full bg-neutral-900"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10 whitespace-nowrap">All Products</span>
          </Link>

          {visibleCategories.map((category) => {
            const isActive = category.slug === activeSlug;

            return (
              <Link
                key={category.id}
                href={`/products/category/${category.slug}`}
                className={cn(
                  "relative flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors",
                  isActive
                    ? "text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="category-tab-active"
                    className="absolute inset-0 rounded-full bg-neutral-900"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                  {isActive && <Check size={14} strokeWidth={2.5} />}
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
