"use client";

import { useState, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface PriceRangeFilterProps {
  min?: number;
  max?: number;
  defaultValue?: [number, number];
  onChange?: (value: [number, number]) => void;
  step?: number;
}

export function PriceRangeFilter({
  min = 0,
  max = 10000,
  defaultValue = [0, 10000],
  onChange,
  step = 100,
}: PriceRangeFilterProps) {
  const [value, setValue] = useState<[number, number]>(defaultValue);
  const [localMin, setLocalMin] = useState(defaultValue[0]);
  const [localMax, setLocalMax] = useState(defaultValue[1]);

  // Reset local values when defaultValue changes
  useEffect(() => {
    setValue(defaultValue);
    setLocalMin(defaultValue[0]);
    setLocalMax(defaultValue[1]);
  }, [defaultValue]);

  const handleValueChange = useCallback(
    (newValue: number[]) => {
      const range: [number, number] = [newValue[0], newValue[1]];
      setValue(range);
      setLocalMin(newValue[0]);
      setLocalMax(newValue[1]);
    },
    [],
  );

  const handleValueCommit = useCallback(
    (newValue: number[]) => {
      const range: [number, number] = [newValue[0], newValue[1]];
      setValue(range);
      onChange?.(range);
    },
    [onChange],
  );

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Number(e.target.value);
    if (newMin <= localMax) {
      setLocalMin(newMin);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Number(e.target.value);
    if (newMax >= localMin) {
      setLocalMax(newMax);
    }
  };

  const handleApply = () => {
    const range: [number, number] = [localMin, localMax];
    setValue(range);
    onChange?.(range);
  };

  const handleReset = () => {
    setValue(defaultValue);
    setLocalMin(defaultValue[0]);
    setLocalMax(defaultValue[1]);
    onChange?.(defaultValue);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Price Range</h3>

      {/* Slider */}
      <Slider
        value={[value[0], value[1]]}
        min={min}
        max={max}
        step={step}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        className="w-full"
      />

      {/* Manual Input Fields */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Min</label>
          <input
            type="number"
            value={localMin}
            onChange={handleMinChange}
            min={min}
            max={localMax}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <span className="text-muted-foreground mt-4">-</span>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Max</label>
          <input
            type="number"
            value={localMax}
            onChange={handleMaxChange}
            min={localMin}
            max={max}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Price Display */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          ৳ {localMin.toLocaleString()}
        </span>
        <span className="text-muted-foreground">
          ৳ {localMax.toLocaleString()}
        </span>
      </div>

      {/* Apply/Reset Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="flex-1"
        >
          Reset
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleApply}
          className="flex-1"
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
