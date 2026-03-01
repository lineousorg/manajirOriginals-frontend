"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useProduct";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Loader";
import {
  ProductFilters,
  type ProductFiltersState,
  type SortOption,
} from "@/components/product-filters";
import { ApiProduct, ProductColor } from "@/types";

// Helper to extract unique sizes from products
function extractUniqueSizes(products: ApiProduct[]): string[] {
  const sizeSet = new Set<string>();
  products.forEach((product) => {
    if (product.sizes) {
      product.sizes.forEach((size) => sizeSet.add(size));
    }
  });
  return Array.from(sizeSet).sort();
}

// Helper to extract unique colors from products
function extractUniqueColors(products: ApiProduct[]): ProductColor[] {
  const colorMap = new Map<string, ProductColor>();
  products.forEach((product) => {
    if (product.colors) {
      product.colors.forEach((color) => {
        if (!colorMap.has(color.name)) {
          colorMap.set(color.name, color);
        }
      });
    }
  });
  return Array.from(colorMap.values());
}

// Helper to calculate price range from products
function calculatePriceRange(products: ApiProduct[]): [number, number] {
  if (products.length === 0) return [0, 10000];
  
  let minPrice = Infinity;
  let maxPrice = 0;
  
  products.forEach((product) => {
    const price = Number(product.price) || 0;
    const originalPrice = product.originalPrice ? Number(product.originalPrice) : price;
    if (price < minPrice) minPrice = price;
    if (originalPrice > maxPrice) maxPrice = originalPrice;
  });
  
  return [Math.floor(minPrice), Math.ceil(maxPrice)];
}

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
  const { categories, categoryTree, loading: categoriesLoading } = useCategories(60_000);
  
  // Find the current category from the category tree
  const currentCategory = useMemo(() => {
    // First try to find in flat categories list
    const flatCategory = categories.find(
      (cat) => cat.slug === categoryName
    );
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

  // Get category ID for API filtering
  const categoryId = currentCategory?.id ? String(currentCategory.id) : categoryName;
  
  // Fetch products with category filter
  const { products, loading: productsLoading, total } = useProducts({
    refreshInterval: 30_000,
    params: {
      category: categoryId,
    },
  });

  // Combined loading state - show loader while categories OR products are loading
  const isLoading = categoriesLoading || productsLoading;

  // Calculate available filter options from fetched products
  const availableSizes = useMemo(() => extractUniqueSizes(products), [products]);
  const availableColors = useMemo(() => extractUniqueColors(products), [products]);
  const priceRange = useMemo(() => calculatePriceRange(products), [products]);

  // Filter products based on current filters (client-side filtering as fallback)
  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Also filter by category on client side as fallback
    // This ensures we only show products that match the category slug
    const categorySlugLower = categoryName.toLowerCase();
    result = result.filter((product) => {
      if (!product.category) return false;
      const productCatSlug = product.category.slug?.toLowerCase();
      const productParentSlug = product.category.parent?.slug?.toLowerCase();
      return productCatSlug === categorySlugLower || productParentSlug === categorySlugLower;
    });
    
    // Apply price filter
    result = result.filter((product) => {
      const price = Number(product.price) || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });
    
    // Apply size filter
    if (filters.sizes.length > 0) {
      result = result.filter((product) => {
        if (!product.sizes) return false;
        return product.sizes.some((size) => filters.sizes.includes(size));
      });
    }
    
    // Apply color filter
    if (filters.colors.length > 0) {
      result = result.filter((product) => {
        if (!product.colors) return false;
        return product.colors.some((color) => filters.colors.includes(color.name));
      });
    }
    
    // Apply sorting
    switch (filters.sortBy) {
      case "price-asc":
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "newest":
        result.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        break;
      case "popular":
        // For now, just keep default order (could be enhanced with a popularity field)
        break;
    }
    
    return result;
  }, [products, filters, categoryName]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: ProductFiltersState) => {
    setFilters(newFilters);
  }, []);

  // Generate breadcrumb
  const breadcrumb = useMemo(() => {
    if (!currentCategory) return [];
    
    const crumbs = [
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
    ];
    
    // Check if this is a child category
    if (currentCategory.parentId) {
      const parentCategory = categories.find(
        (cat) => String(cat.id) === String(currentCategory.parentId)
      );
      if (parentCategory) {
        crumbs.push({
          label: parentCategory.name,
          href: `/products/category/${parentCategory.slug}`,
        });
      }
    }
    
    crumbs.push({
      label: currentCategory.name,
      href: `/products/category/${currentCategory.slug}`,
    });
    
    return crumbs;
  }, [currentCategory, categories]);

  // Show loader while loading
  if (isLoading && !currentCategory) {
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
  if (!currentCategory) {
    return (
      <div className="container-fashion py-8 min-h-screen">
        <ProductGridSkeleton count={12} />
      </div>
    );
  }

  // At this point, currentCategory is guaranteed to be non-null
  const categoryNameDisplay = currentCategory.name;

  return (
    <div className="container-fashion py-8 min-h-screen mt-20">
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
          {filteredProducts.length} products found
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
