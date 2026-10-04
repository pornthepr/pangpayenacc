"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PERIOD_PRESETS, periodPresetLabels, type PeriodPreset } from "@/lib/format/period";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function PeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = (searchParams.get("period") as PeriodPreset) ?? "this_month";
  const customFrom = searchParams.get("from") ?? "";
  const customTo = searchParams.get("to") ?? "";

  function setPeriod(next: PeriodPreset) {
    const params = new URLSearchParams(searchParams);
    params.set("period", next);
    if (next !== "custom") {
      params.delete("from");
      params.delete("to");
    }
    router.push(`/reports?${params.toString()}`);
  }

  function setCustomRange(from: string, to: string) {
    const params = new URLSearchParams(searchParams);
    params.set("period", "custom");
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/reports?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {PERIOD_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setPeriod(preset)}
            className={cn(
              "h-9 rounded-full border px-3 text-sm",
              period === preset ? "border-foreground bg-accent font-medium" : "border-border"
            )}
          >
            {periodPresetLabels[preset]}
          </button>
        ))}
      </div>
      {period === "custom" ? (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            defaultValue={customFrom}
            onChange={(e) => setCustomRange(e.target.value, customTo)}
            className="h-10 text-base"
          />
          <Input
            type="date"
            defaultValue={customTo}
            onChange={(e) => setCustomRange(customFrom, e.target.value)}
            className="h-10 text-base"
          />
        </div>
      ) : null}
    </div>
  );
}
