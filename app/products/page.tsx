"use client";

import { useState } from "react";
import { useProducts, PaginationInfo } from "@/hooks/useProduct";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Loader";
import { Pagination } from "@/components/ui/pagination-new";

export default function ProductsPage() {
  const { products, loading, pagination, goToPage } = useProducts();
  const [isPaginating, setIsPaginating] = useState(false);
  const [pendingPage, setPendingPage] = useState<number | null>(null);

  // Handle page change with loading state
  const handlePageChange = async (page: number) => {
    setPendingPage(page);
    setIsPaginating(true);
    await goToPage(page);
    setIsPaginating(false);
    setPendingPage(null);
  };

  // Get the current page - use pendingPage if we're paginating
  const currentPage = pendingPage ?? pagination?.page ?? 1;

  // Calculate showing range
  const getShowingRange = () => {
    if (!pagination) return "";
    const displayPage = pendingPage ?? pagination.page;
    const start = (displayPage - 1) * pagination.limit + 1;
    const end = Math.min(displayPage * pagination.limit, pagination.total);
    return `Showing ${start}-${end} of ${pagination.total} products`;
  };

  const isLoading = loading || isPaginating;

  return (
    <div className="container-fashion py-8 min-h-screen pt-24 lg:pt-40">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">All Products</h1>
        <p className="text-muted-foreground mt-2">
          Discover our complete collection
        </p>
      </div>

      {loading && products.length === 0 ? (
        <ProductGridSkeleton count={12} />
      ) : products.length === 0 ? (
        <p className="text-muted-foreground text-center py-16 h-[70dvh] flex items-center justify-center">
          No products available at the moment
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {isPaginating ? (
              // Show skeleton while paginating
              Array.from({ length: 10 }).map((_, idx) => (
                <div key={`skeleton-${idx}`} className="animate-pulse">
                  <div className="bg-slate-200 aspect-square rounded-2xl mb-4" />
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              ))
            ) : (
              products.map((product, idx) => (
                <ProductCard 
                  key={`${product.id}-${currentPage}`}
                  product={product} 
                  index={idx}
                />
              ))
            )}
          </div>
          
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-12 flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {getShowingRange()}
              </p>
              <Pagination
                pagination={{
                  ...pagination,
                  page: currentPage
                }}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
