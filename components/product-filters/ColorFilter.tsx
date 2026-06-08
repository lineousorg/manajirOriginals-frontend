"use client";

import { useState, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ProductColor } from "@/types";

interface ColorFilterProps {
  colors: ProductColor[];
  selectedColors?: string[];
  onChange?: (colors: string[]) => void;
}

export function ColorFilter({
  colors,
  selectedColors = [],
  onChange,
}: ColorFilterProps) {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedColors);

  const handleToggle = useCallback(
    (colorName: string) => {
      const newSelected = localSelected.includes(colorName)
        ? localSelected.filter((c) => c !== colorName)
        : [...localSelected, colorName];
      setLocalSelected(newSelected);
    },
    [localSelected]
  );

  const handleApply = useCallback(() => {
    onChange?.(localSelected);
  }, [localSelected, onChange]);

  const handleReset = useCallback(() => {
    setLocalSelected([]);
    onChange?.([]);
  }, [onChange]);

  const handleCheckboxChange = useCallback(
    (colorName: string, checked: boolean) => {
      handleToggle(colorName);
    },
    [handleToggle]
  );

  // Helper function to check if a color is light or dark
  const isLightColor = (colorValue: string): boolean => {
    if (!colorValue) return false;
    const hex = colorValue.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  };

  if (colors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Color</h3>

      <div className="flex flex-wrap gap-3">
        {colors.map((color) => (
          <div key={color.name} className="flex items-center">
            <Checkbox
              id={`color-${color.name}`}
              checked={localSelected.includes(color.name)}
              onCheckedChange={(checked) =>
                handleCheckboxChange(color.name, !!checked)
              }
              className="sr-only"
            />
            <Label
              htmlFor={`color-${color.name}`}
              className={`cursor-pointer flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                localSelected.includes(color.name)
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border"
              }`}
              title={color.name}
            >
              <span
                className={`w-6 h-6 rounded-full border border-border/20 ${
                  isLightColor(color.value) ? "border border-gray-300" : ""
                }`}
                style={{ backgroundColor: color.value?.toLowerCase() }}
              />
            </Label>
          </div>
        ))}
      </div>

      {/* Color names (optional display) */}
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color.name}
            onClick={() => handleToggle(color.name)}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              localSelected.includes(color.name)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:border-primary"
            }`}
          >
            {color.name}
          </button>
        ))}
      </div>

      {selectedColors.length > 0 && (
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
