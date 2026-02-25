"use client";

import { useState, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface SizeFilterProps {
  sizes: string[];
  selectedSizes?: string[];
  onChange?: (sizes: string[]) => void;
}

export function SizeFilter({
  sizes,
  selectedSizes = [],
  onChange,
}: SizeFilterProps) {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedSizes);

  const handleToggle = useCallback(
    (size: string) => {
      const newSelected = localSelected.includes(size)
        ? localSelected.filter((s) => s !== size)
        : [...localSelected, size];
      setLocalSelected(newSelected);
    },
    [localSelected],
  );

  const handleApply = useCallback(() => {
    onChange?.(localSelected);
  }, [localSelected, onChange]);

  const handleReset = useCallback(() => {
    setLocalSelected([]);
    onChange?.([]);
  }, [onChange]);

  const handleCheckboxChange = useCallback(
    (size: string, checked: boolean) => {
      handleToggle(size);
    },
    [handleToggle],
  );

  if (sizes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Size</h3>

      <div className="grid grid-cols-3 gap-2">
        {sizes.map((size) => (
          <div key={size} className="flex items-center">
            <Checkbox
              id={`size-${size}`}
              checked={localSelected.includes(size)}
              onCheckedChange={(checked) => handleCheckboxChange(size, !!checked)}
              className="mr-2"
            />
            <Label
              htmlFor={`size-${size}`}
              className="text-sm cursor-pointer text-muted-foreground hover:text-foreground"
            >
              {size}
            </Label>
          </div>
        ))}
      </div>

      {selectedSizes.length > 0 && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="default" size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
