"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";

interface SizeGuideProps {
  categorySlug: string | undefined;
}

// Mapping of category slugs to their respective size guide images
const SIZE_GUIDE_BY_CATEGORY: Record<string, string> = {
  "the-prestige-line": "/Size guides/punjabi-size-guide.jpeg",
  "ethnic": "/Size guides/punjabi-size-guide.jpeg",
  shirt: "/Size guides/shirt-size-guide.jpeg",
  pant: "/Size guides/pant-size-guide.jpeg",
  // Add more categories as needed
};

export function SizeGuide({ categorySlug }: SizeGuideProps) {
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Get the size guide image for the current category
  const sizeGuideImage = categorySlug ? SIZE_GUIDE_BY_CATEGORY[categorySlug] : null;

  // Don't render if no size guide is available for this category
  if (!sizeGuideImage) {
    return null;
  }

  return (
    <>
      {/* Size Guide Thumbnail */}
      <div
        className="mt-6 cursor-pointer group w-fit"
        onClick={() => setIsSizeGuideOpen(true)}
      >
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20 p-2 transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md">
          <Image
            src={sizeGuideImage}
            alt="Size Guide"
            width={280}
            height={180}
            className="w-64 h-auto rounded-lg object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 rounded-xl">
            <span className="text-xs font-medium bg-background/90 px-3 py-1.5 rounded-full shadow-sm">
              Click to enlarge
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Size Guide
        </p>
      </div>

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <div
          className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-8 -right-8 bg-background rounded-full p-2.5 shadow-lg transition-colors z-10 cursor-pointer hover:bg-primary hover:text-background"
              onClick={() => setIsSizeGuideOpen(false)}
            >
              <Plus size={20} className="rotate-45" />
            </button>
            <Image
              src={sizeGuideImage}
              alt="Size Guide"
              width={500}
              height={500}
              className="w-full h-auto rounded-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
