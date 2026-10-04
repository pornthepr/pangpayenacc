"use client";

import { cn } from "@/lib/utils";

export function ChipSelect<T extends { id: string; label: string; color?: string | null }>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "flex h-11 items-center gap-1.5 rounded-full border px-3 text-sm",
              selected ? "border-foreground bg-accent font-medium" : "border-border bg-background"
            )}
          >
            {option.color ? (
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: option.color }}
              />
            ) : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
