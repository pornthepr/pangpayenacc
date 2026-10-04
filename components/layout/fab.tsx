"use client";

import { Plus } from "lucide-react";
import { useAppData } from "@/components/transactions/app-data-context";

export function Fab() {
  const { quickAdd } = useAppData();

  return (
    <button
      type="button"
      onClick={() => quickAdd.openCreate()}
      aria-label="เพิ่มรายการ"
      className="fixed bottom-[calc(56px+env(safe-area-inset-bottom)+12px)] left-1/2 z-50 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition active:scale-95"
    >
      <Plus className="size-6" />
    </button>
  );
}
