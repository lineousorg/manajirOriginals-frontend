"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";

interface ProductSizeChartProps {
  imageUrl: string;
  altText?: string;
}

export function ProductSizeChart({ imageUrl, altText }: ProductSizeChartProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Size Chart Thumbnail */}
      <div
        className="mt-6 cursor-pointer group w-fit"
        onClick={() => setIsOpen(true)}
      >
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20 p-2 transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md">
          <Image
            src={imageUrl}
            alt={altText || "Size Chart"}
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
          Size Chart
        </p>
      </div>

      {/* Size Chart Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-8 -right-8 bg-background rounded-full p-2.5 shadow-lg transition-colors z-10 cursor-pointer hover:bg-primary hover:text-background"
              onClick={() => setIsOpen(false)}
            >
              <Plus size={20} className="rotate-45" />
            </button>
            <Image
              src={imageUrl}
              alt={altText || "Size Chart"}
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
