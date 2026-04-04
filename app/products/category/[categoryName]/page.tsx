"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useCategories, useCategoryProducts, CategoryProductsFilters } from "@/hooks/useProduct";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Loader";
import { Pagination } from "@/components/ui/pagination-new";
import {
  type ProductFiltersState,
  type SortOption,
} from "@/components/product-filters";

export default function CategoryProductsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const categoryName = params.categoryName as string;

  // Get filters from URL params
  const urlMinPrice = searchParams.get("minPrice");
  const urlMaxPrice = searchParams.get("maxPrice");
  const urlSort = searchParams.get("sortBy");

  // Filter state
  const [filters, setFilters] = useState<ProductFiltersState>({
    priceRange: [
      urlMinPrice ? Number(urlMinPrice) : 0,
      urlMaxPrice ? Number(urlMaxPrice) : 10000,
    ],
    sizes: [],
    colors: [],
    sortBy: (urlSort as SortOption) || "newest",
  });

  // Fetch categories
  const {
    categories,
    categoryTree,
    loading: categoriesLoading,
  } = useCategories();

  // Find the current category from the category tree
  const currentCategory = useMemo(() => {
    // First try to find in flat categories list
    const flatCategory = categories.find((cat) => cat.slug === categoryName);
    if (flatCategory) return flatCategory;

    // Then try to find in category tree (with children)
    for (const parent of categoryTree) {
      if (parent.slug === categoryName) return parent;
      if (parent.children) {
        const child = parent.children.find((c) => c.slug === categoryName);
        if (child) return child;
      }
    }

    return null;
  }, [categories, categoryTree, categoryName]);

  // Build filters for the API based on URL params and local state
  const apiFilters: CategoryProductsFilters = useMemo(() => {
    return {
      minPrice: urlMinPrice ? Number(urlMinPrice) : undefined,
      maxPrice: urlMaxPrice ? Number(urlMaxPrice) : undefined,
      sizes: filters.sizes.length > 0 ? filters.sizes : undefined,
      colors: filters.colors.length > 0 ? filters.colors : undefined,
      // Only send sortBy if it's explicitly set in URL (not the default "newest")
      sortBy: urlSort ? filters.sortBy as CategoryProductsFilters['sortBy'] : undefined,
    };
  }, [urlMinPrice, urlMaxPrice, filters.sizes, filters.colors, filters.sortBy, urlSort]);

  // Fetch products by category using server-side filtering
  const {
    category: fetchedCategory,
    products,
    pagination,
    availableFilters,
    loading: productsLoading,
    refetch,
  } = useCategoryProducts({
    categorySlug: categoryName,
    page: 1,
    limit: 20,
    filters: apiFilters,
    fetchOnMount: true,
  });

  // Use fetched category from API or fallback to local category
  const displayCategory = fetchedCategory || currentCategory;

  // Pagination loading state
  const [isPaginating, setIsPaginating] = useState(false);
  const [pendingPage, setPendingPage] = useState<number | null>(null);

  // Handle page change
  const handlePageChange = async (page: number) => {
    setPendingPage(page);
    setIsPaginating(true);
    await refetch();
    setIsPaginating(false);
    setPendingPage(null);
  };

  // Get the current page for display
  const currentPageValue = pendingPage ?? pagination?.page ?? 1;

  // Combined loading state - show loader while categories OR products are loading
  const isLoading = categoriesLoading || productsLoading;

  // Use available filters from API response
  const availableSizes = availableFilters?.sizes || [];
  const availableColors = availableFilters?.colors || [];
  const priceRange: [number, number] = availableFilters?.priceRange
    ? [availableFilters.priceRange.min, availableFilters.priceRange.max]
    : [0, 10000];

  // Products are already filtered server-side, no need for client-side filtering
  const filteredProducts = products;
  console.log(products);

  // Handle filter changes - update URL params to trigger API refetch
  const handleFilterChange = useCallback((newFilters: ProductFiltersState) => {
    setFilters(newFilters);
  }, []);

  // Generate breadcrumb
  const breadcrumb = useMemo(() => {
    if (!displayCategory) return [];

    const crumbs = [
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
    ];

    // Check if this is a child category
    if (displayCategory.parentId) {
      const parentCategory = categories.find(
        (cat) => String(cat.id) === String(displayCategory.parentId)
      );
      if (parentCategory) {
        crumbs.push({
          label: parentCategory.name,
          href: `/products/category/${parentCategory.slug}`,
        });
      }
    }

    crumbs.push({
      label: displayCategory.name,
      href: `/products/category/${displayCategory.slug}`,
    });

    return crumbs;
  }, [displayCategory, categories]);

  // Show loader while loading
  if (isLoading && !displayCategory) {
    return (
      <div className="container-fashion py-8 min-h-screen">
        <ProductGridSkeleton count={12} />
      </div>
    );
  }

  // Show category not found only after loading is complete and category is still not found
  // if (!currentCategory && !isLoading) {
  //   return (
  //     <div className="container-fashion py-8 min-h-screen">
  //       <div className="mb-8">
  //         <h1 className="text-3xl font-bold text-foreground">
  //           Category Not Found
  //         </h1>
  //         <p className="text-muted-foreground mt-2">
  //           The category does not exist.
  //         </p>
  //         <Link
  //           href="/products"
  //           className="text-primary hover:underline mt-4 inline-block"
  //         >
  //           ← Back to all products
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }

  // Early return if currentCategory is still null after loading
  if (!displayCategory) {
    return (
      <div className="container-fashion py-8 min-h-screen">
        <ProductGridSkeleton count={12} />
      </div>
    );
  }

  // At this point, displayCategory is guaranteed to be non-null
  const categoryNameDisplay = displayCategory.name;

  return (
    <div className="container-fashion py-8 min-h-screen pt-24 lg:pt-40">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        {breadcrumb.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4" />}
            {index === 0 ? (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                <Home className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Category Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {categoryNameDisplay}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {pagination
            ? `Showing ${
                (pagination.page - 1) * pagination.limit + 1
              }-${Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )} of ${pagination.total} products`
            : `${filteredProducts.length} products found`}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        {/* <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24">
            <ProductFilters
              availableSizes={availableSizes}
              availableColors={availableColors}
              defaultPriceRange={priceRange}
              initialFilters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        </aside> */}

        {/* Products Grid */}
        <main className="flex-1">
          {productsLoading && filteredProducts.length === 0 ? (
            <ProductGridSkeleton count={12} />
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                No products found in this category with the selected filters.
              </p>
              <button
                onClick={() =>
                  setFilters({
                    priceRange: [0, 10000],
                    sizes: [],
                    colors: [],
                    sortBy: "newest",
                  })
                }
                className="text-primary hover:underline mt-4"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={`${product.id}-${currentPageValue}`}
                    product={product}
                    index={idx}
                  />
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <Pagination
                    pagination={{
                      ...pagination,
                      page: currentPageValue,
                    }}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
