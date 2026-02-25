"use client";

import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption = "newest" | "price-asc" | "price-desc" | "popular";

interface SortFilterProps {
  value?: SortOption;
  onChange?: (value: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

export function SortFilter({ value = "newest", onChange }: SortFilterProps) {
  const handleValueChange = useCallback(
    (newValue: string) => {
      onChange?.(newValue as SortOption);
    },
    [onChange],
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Sort By</label>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
