"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function TypeToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("breakdownType") === "income" ? "income" : "expense";

  function setType(next: "income" | "expense") {
    const params = new URLSearchParams(searchParams);
    params.set("breakdownType", next);
    router.push(`/reports?${params.toString()}`);
  }

  return (
    <div className="flex gap-2">
      {(["expense", "income"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setType(option)}
          className={cn(
            "h-8 rounded-full border px-3 text-sm",
            type === option ? "border-foreground bg-accent font-medium" : "border-border"
          )}
        >
          {option === "expense" ? "รายจ่าย" : "รายรับ"}
        </button>
      ))}
    </div>
  );
}
