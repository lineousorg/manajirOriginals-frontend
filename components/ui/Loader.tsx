import { motion } from 'framer-motion';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const Loader = ({ size = 'md', fullScreen = false }: LoaderProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const loader = (
    <motion.div
      className={`${sizeClasses[size]} border-2 border-border border-t-primary rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        {loader}
      </div>
    );
  }

  return loader;
};

export const ProductCardSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-muted rounded-lg" />
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-muted rounded w-1/4" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/3" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

interface ProductDetailsSkeletonProps {
  showRelatedProducts?: boolean;
}

export const ProductDetailsSkeleton = ({ showRelatedProducts = true }: ProductDetailsSkeletonProps) => {
  return (
    <div className="pt-24 md:pt-32 pb-20 bg-white animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="container-fashion py-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-3 w-4 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-3 w-4 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      </div>

      {/* Product Details Grid */}
      <div className="container-fashion py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Gallery Skeleton */}
          <div className="order-1">
            <div className="aspect-[3/4] bg-muted rounded-lg" />
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-20 h-20 bg-muted rounded-md" />
              ))}
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="order-2 lg:sticky lg:top-28 lg:self-start">
            <div className="mb-8">
              {/* Title and Share */}
              <div className="flex items-start justify-between gap-2 md:gap-4 mb-4">
                <div className="h-10 w-4/5 bg-muted rounded" />
                <div className="w-10 h-10 bg-muted rounded-full shrink-0 mt-1" />
              </div>

              {/* Description */}
              <div className="space-y-2 mb-8">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-5/6 bg-muted rounded" />
              </div>

              {/* Price Row */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-24 bg-muted rounded" />
                <div className="h-5 w-16 bg-muted rounded line-through" />
                <div className="h-6 w-16 bg-muted rounded-full" />
              </div>

              <div className="h-px bg-border w-full" />
            </div>

            {/* Variant Selection Skeleton */}
            <div className="space-y-8 mb-8">
              {/* Color Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-16 h-9 bg-muted rounded-full" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Size Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="flex flex-wrap gap-4">
                    {['S', 'M', 'L', 'XL'].map((size) => (
                      <div key={size} className="w-10 h-10 bg-muted rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="flex items-center bg-muted/30 rounded-full">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full">
                    <div className="w-4 h-4 bg-muted rounded" />
                  </div>
                  <div className="w-12 h-8 bg-muted rounded" />
                  <div className="w-10 h-10 flex items-center justify-center rounded-full">
                    <div className="w-4 h-4 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-3 w-16 bg-muted rounded" />
              </div>

              {/* Size Guide */}
              <div className="h-5 w-24 bg-muted rounded" />
            </div>

            {/* Actions Skeleton */}
            <div className="flex gap-3 mb-8">
              <div className="flex-1 h-14 bg-muted rounded-lg" />
              <div className="w-14 h-14 bg-muted rounded-lg" />
            </div>

            {/* Trust Badges Skeleton */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 py-6 border-t border-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center px-1">
                  <div className="bg-muted rounded-full w-10 h-10 mx-auto mb-2" />
                  <div className="h-3 w-20 bg-muted rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Information Tabs Skeleton */}
      <div className="container-fashion py-8 mb-12">
        <div className="border-t border-border pt-8">
          {/* Tab Navigation */}
          <div className="flex gap-8 border-b border-border mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="pb-4 flex items-center gap-2">
                <div className="w-4 h-4 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-3">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-5/6 bg-muted rounded" />
            <div className="h-4 w-4/5 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-2/3 bg-muted rounded" />
          </div>
        </div>
      </div>

      {/* Related Products Skeleton */}
      {showRelatedProducts && (
        <section className="container-fashion py-16 border-t border-border">
          <div className="text-center mb-10">
            <div className="h-8 w-48 bg-muted rounded mx-auto mb-2" />
            <div className="h-4 w-64 bg-muted rounded mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Add to Cart Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 lg:hidden z-50">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-3 w-12 bg-muted rounded mb-1" />
            <div className="h-5 w-20 bg-muted rounded" />
          </div>
          <div className="flex-1 h-12 bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  );
};
