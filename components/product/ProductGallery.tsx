"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { TypeImage } from "@/types";

interface ProductGalleryProps {
  images: TypeImage[];
  productName: string;
}

export const ProductGallery = ({
  images,
  productName,
}: ProductGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // console.log(images);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative h-[50vh] md:h-[70vh] lg:h-[80vh] max-h-200 overflow-hidden rounded-lg bg-muted group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10"
          >
            <Image
              src={images[currentIndex].url}
              alt={`${productName} - ${images[currentIndex].altText}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-top cursor-zoom-in transition-transform duration-500"
              style={{ transform: isZoomed ? "scale(1.5)" : "" }}
              onClick={() => setIsZoomed(!isZoomed)}
              priority={currentIndex === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Zoom Indicator */}
        <div className="absolute bottom-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={18} />
        </div>

        {/* Image Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-foreground w-6"
                    : "bg-foreground/40 hover:bg-foreground/60"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`aspect-square rounded-md transition-all ${
              index === currentIndex
                ? "ring-2 ring-foreground"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            <Image
              src={images[index].url}
              alt={`${productName} thumbnail ${index + 1}`}
              width={250}
              height={250}
              // fill
              sizes="(max-width: 768px) 20vw, 10vw"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};
