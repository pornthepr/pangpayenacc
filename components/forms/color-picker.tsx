"use client";

import { COLOR_OPTIONS } from "@/lib/constants/colors";
import { cn } from "@/lib/utils";

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_OPTIONS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={color}
          onClick={() => onChange(color)}
          className={cn(
            "size-9 rounded-full ring-offset-2 transition",
            value === color ? "ring-2 ring-foreground" : ""
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
