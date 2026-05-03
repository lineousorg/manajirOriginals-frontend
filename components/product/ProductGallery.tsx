"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
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
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(2); // 2x zoom by default
  const containerRef = useRef<HTMLDivElement>(null);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Handle mouse move for lens position
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setMousePosition({ x, y });
    },
    []
  );

  // Handle mouse enter/leave
  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsZoomActive(false);
  };

  // Handle click for full zoom mode
  const handleImageClick = () => {
    setIsZoomActive((prev) => !prev);
  };

  // Close zoom with escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isZoomActive) {
        setIsZoomActive(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomActive]);

  // Calculate background position for zoom effect
  const bgPosition = `${mousePosition.x}% ${mousePosition.y}%`;

  return (
    <div className="space-y-4">
      {/* Main Image with Zoom */}
      <div
        ref={containerRef}
        className="relative h-[50vh] md:h-[70vh] lg:h-[80vh] max-h-200 overflow-hidden rounded-lg bg-muted group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10"
          >
            {/* Zoomed Image (shown when hovering or in active zoom mode) */}
            {isHovering && (
              <div
                className="absolute inset-0 z-20 overflow-hidden rounded-lg pointer-events-none"
                style={{
                  backgroundImage: `url(${images[currentIndex].url})`,
                  backgroundSize: `${zoomLevel * 100}%`,
                  backgroundPosition: bgPosition,
                  backgroundRepeat: "no-repeat",
                }}
              />
            )}

            {/* Main Image */}
            <Image
              src={images[currentIndex].url}
              alt={`${productName} - ${images[currentIndex].altText}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={`object-cover object-top transition-all duration-200 ${
                isHovering ? "opacity-0" : "opacity-100"
              } cursor-zoom-in`}
              onClick={handleImageClick}
              priority={currentIndex === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background z-30"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background z-30"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Zoom Indicator */}
        <div className="absolute bottom-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-30">
          <ZoomIn size={18} />
        </div>

        {/* Image Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
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
              sizes="(max-width: 768px) 20vw, 10vw"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};
