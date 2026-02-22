"use client";

import { useProducts } from "@/hooks/useProduct";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Loader";

export default function ProductsPage() {
  const { products, loading } = useProducts({ refreshInterval: 30_000 });

  return (
    <div className="container-fashion py-8 min-h-screen">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
