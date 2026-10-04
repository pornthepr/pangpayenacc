"use client";

import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { ICON_OPTIONS } from "@/lib/constants/icons";
import { cn } from "@/lib/utils";

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: IconName) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {ICON_OPTIONS.map((icon) => (
        <button
          key={icon}
          type="button"
          aria-label={icon}
          onClick={() => onChange(icon)}
          className={cn(
            "flex size-10 items-center justify-center rounded-lg border",
            value === icon ? "border-foreground bg-accent" : "border-transparent bg-muted"
          )}
        >
          <DynamicIcon name={icon} className="size-5" />
        </button>
      ))}
    </div>
  );
}
