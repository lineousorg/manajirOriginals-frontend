"use client";

import { useState, useCallback, useEffect } from "react";
import { ProductColor } from "@/types";
import { PriceRangeFilter } from "./PriceRangeFilter";
import { SizeFilter } from "./SizeFilter";
import { ColorFilter } from "./ColorFilter";
import { SortFilter, SortOption } from "./SortFilter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";

export interface ProductFiltersState {
  priceRange: [number, number];
  sizes: string[];
  colors: string[];
  sortBy: SortOption;
}

interface ProductFiltersProps {
  availableSizes?: string[];
  availableColors?: ProductColor[];
  defaultPriceRange?: [number, number];
  initialFilters?: Partial<ProductFiltersState>;
  onFilterChange?: (filters: ProductFiltersState) => void;
  className?: string;
}

const defaultFilters: ProductFiltersState = {
  priceRange: [0, 10000],
  sizes: [],
  colors: [],
  sortBy: "newest",
};

export function ProductFilters({
  availableSizes = [],
  availableColors = [],
  defaultPriceRange = [0, 10000],
  initialFilters,
  onFilterChange,
  className = "",
}: ProductFiltersProps) {
  const [filters, setFilters] = useState<ProductFiltersState>(() => ({
    ...defaultFilters,
    ...initialFilters,
  }));
  const [isExpanded, setIsExpanded] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Reset filters when initialFilters changes
  // Note: We don't use useEffect for state sync to avoid performance issues

  const handlePriceChange = useCallback((priceRange: [number, number]) => {
    setFilters((prev) => {
      const newFilters = { ...prev, priceRange };
      onFilterChange?.(newFilters);
      return newFilters;
    });
  }, [onFilterChange]);

  const handleSizeChange = useCallback((sizes: string[]) => {
    setFilters((prev) => {
      const newFilters = { ...prev, sizes };
      onFilterChange?.(newFilters);
      return newFilters;
    });
  }, [onFilterChange]);

  const handleColorChange = useCallback((colors: string[]) => {
    setFilters((prev) => {
      const newFilters = { ...prev, colors };
      onFilterChange?.(newFilters);
      return newFilters;
    });
  }, [onFilterChange]);

  const handleSortChange = useCallback((sortBy: SortOption) => {
    setFilters((prev) => {
      const newFilters = { ...prev, sortBy };
      onFilterChange?.(newFilters);
      return newFilters;
    });
  }, [onFilterChange]);

  const handleResetFilters = useCallback(() => {
    const resetFilters: ProductFiltersState = {
      priceRange: defaultPriceRange,
      sizes: [],
      colors: [],
      sortBy: "newest",
    };
    setFilters(resetFilters);
    onFilterChange?.(resetFilters);
  }, [defaultPriceRange, onFilterChange]);

  const handleApplyAll = useCallback(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  const hasActiveFilters =
    filters.priceRange[0] !== defaultPriceRange[0] ||
    filters.priceRange[1] !== defaultPriceRange[1] ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          <h2 className="text-lg font-semibold">Filters</h2>
          {hasActiveFilters && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:hidden p-2 hover:bg-muted rounded-md"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Desktop Filters */}
      <div className={`hidden md:block space-y-6 ${isExpanded ? "" : "hidden"}`}>
        {/* Sort */}
        <SortFilter value={filters.sortBy} onChange={handleSortChange} />

        <Separator />

        {/* Price Range */}
        <PriceRangeFilter
          min={defaultPriceRange[0]}
          max={defaultPriceRange[1]}
          defaultValue={filters.priceRange}
          onChange={handlePriceChange}
        />

        <Separator />

        {/* Sizes */}
        {availableSizes.length > 0 && (
          <>
            <SizeFilter
              sizes={availableSizes}
              selectedSizes={filters.sizes}
              onChange={handleSizeChange}
            />
            <Separator />
          </>
        )}

        {/* Colors */}
        {availableColors.length > 0 && (
          <>
            <ColorFilter
              colors={availableColors}
              selectedColors={filters.colors}
              onChange={handleColorChange}
            />
            <Separator />
          </>
        )}

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="w-full"
          >
            Reset All Filters
          </Button>
        )}
      </div>

      {/* Mobile Filters Button */}
      <div className="md:hidden">
        <Button
          variant="outline"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="w-full flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </span>
          {mobileFiltersOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {/* Mobile Filters Panel */}
        {mobileFiltersOpen && (
          <div className="mt-4 space-y-6 p-4 border border-border rounded-lg bg-background">
            {/* Sort */}
            <SortFilter value={filters.sortBy} onChange={handleSortChange} />

            {/* Price Range */}
            <PriceRangeFilter
              min={defaultPriceRange[0]}
              max={defaultPriceRange[1]}
              defaultValue={filters.priceRange}
              onChange={handlePriceChange}
            />

            {/* Sizes */}
            {availableSizes.length > 0 && (
              <SizeFilter
                sizes={availableSizes}
                selectedSizes={filters.sizes}
                onChange={handleSizeChange}
              />
            )}

            {/* Colors */}
            {availableColors.length > 0 && (
              <ColorFilter
                colors={availableColors}
                selectedColors={filters.colors}
                onChange={handleColorChange}
              />
            )}

            {/* Apply/Reset Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="flex-1"
              >
                Reset
              </Button>
              <Button onClick={handleApplyAll} className="flex-1">
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export type { ProductFiltersProps };
