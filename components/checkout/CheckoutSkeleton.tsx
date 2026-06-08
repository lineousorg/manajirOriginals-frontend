import { Skeleton } from "@/components/ui/skeleton";

export function CheckoutSkeleton() {
  return (
    <div className="container-fashion py-8 md:py-12 pt-40">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-8">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
      </div>

      <div className="min-h-dvh pt-10">
        {/* Title Section Skeleton */}
        <div className="flex items-center gap-2 mb-8">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Order Summary - LEFT Skeleton */}
          <div className="lg:col-span-2 lg:sticky lg:top-28 lg:self-start">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              {/* Order Summary Header */}
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-6 w-32" />
              </div>

              {/* Items Skeleton */}
              <div className="space-y-4 mb-6">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <Skeleton className="w-16 h-20 md:w-20 md:h-24 rounded-lg" />
                    <div className="flex-1 text-left space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Location Skeleton */}
              <div className="border-t border-border pt-4 mt-4">
                <Skeleton className="h-5 w-32 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>

              {/* Totals Skeleton */}
              <div className="border-t border-border pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>

              {/* Trust badges Skeleton */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </div>
          </div>

          {/* Form - RIGHT Skeleton */}
          <div className="lg:col-span-3 text-left">
            {/* Address Selector Skeleton */}
            <div className="mb-8">
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>

            {/* Form Fields Skeleton */}
            <div className="space-y-6">
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>

              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>

              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <div>
                  <Skeleton className="h-4 w-28 mb-2" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>

              <div className="pt-4">
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
