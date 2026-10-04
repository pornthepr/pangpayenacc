"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/supabase/database.types";
import { mergeCategoryAction } from "./actions";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export function MergeDialog({
  category,
  siblings,
  trigger,
}: {
  category: Category;
  siblings: Category[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function handleMerge() {
    if (!targetId) return;
    startTransition(async () => {
      const result = await mergeCategoryAction(category.id, targetId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`ย้ายรายการจาก "${category.name}" แล้วลบหมวดเดิม`);
        setOpen(false);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>ย้ายรวม &quot;{category.name}&quot;</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 pb-4">
          <p className="text-sm text-muted-foreground">
            ย้ายรายการทั้งหมดไปหมวดที่เลือก แล้วลบหมวด &quot;{category.name}&quot; ทิ้ง
          </p>

          {siblings.length === 0 ? (
            <p className="text-sm text-muted-foreground">ไม่มีหมวดอื่นให้ย้ายไป</p>
          ) : (
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="h-11 rounded-md border bg-background px-3 text-base"
            >
              <option value="">เลือกหมวดปลายทาง</option>
              {siblings.map((sibling) => (
                <option key={sibling.id} value={sibling.id}>
                  {sibling.name}
                </option>
              ))}
            </select>
          )}

          <SheetFooter className="px-0">
            <Button
              disabled={!targetId || isPending}
              onClick={handleMerge}
              className="h-11 w-full text-base"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              ย้ายรวมและลบหมวดเดิม
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
