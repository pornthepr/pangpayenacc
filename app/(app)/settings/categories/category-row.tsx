"use client";

import { useState, useTransition } from "react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { ArrowUp, ArrowDown, Pencil, Archive, ArchiveRestore, Trash2, Combine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/supabase/database.types";
import { CategoryFormSheet } from "./category-form-sheet";
import { MergeDialog } from "./merge-dialog";
import { setCategoryArchivedAction, deleteCategoryAction, moveCategoryAction } from "./actions";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export function CategoryRow({
  category,
  siblings,
  isFirst,
  isLast,
}: {
  category: Category;
  siblings: Category[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("ลบหมวดหมู่แล้ว");
      }
      setConfirmingDelete(false);
    });
  }

  return (
    <div className="flex flex-col gap-2 border-b py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: category.color ?? "#6b7280" }}
        >
          <DynamicIcon name={(category.icon ?? "circle-plus") as IconName} className="size-5" />
        </div>
        <p className="min-w-0 flex-1 truncate font-medium">{category.name}</p>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {!category.is_archived ? (
          <>
            <Button
              variant="ghost"
              className="size-11"
              disabled={isFirst || isPending}
              onClick={() => startTransition(() => moveCategoryAction(category.id, "up"))}
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              variant="ghost"
              className="size-11"
              disabled={isLast || isPending}
              onClick={() => startTransition(() => moveCategoryAction(category.id, "down"))}
            >
              <ArrowDown className="size-4" />
            </Button>
          </>
        ) : null}

        <CategoryFormSheet
          category={category}
          trigger={
            <Button variant="ghost" className="size-11">
              <Pencil className="size-4" />
            </Button>
          }
        />

        <Button
          variant="ghost"
          className="size-11"
          disabled={isPending}
          onClick={() =>
            startTransition(() => setCategoryArchivedAction(category.id, !category.is_archived))
          }
        >
          {category.is_archived ? (
            <ArchiveRestore className="size-4" />
          ) : (
            <Archive className="size-4" />
          )}
        </Button>

        <MergeDialog
          category={category}
          siblings={siblings}
          trigger={
            <Button variant="ghost" className="size-11">
              <Combine className="size-4" />
            </Button>
          }
        />

        {confirmingDelete ? (
          <Button
            variant="destructive"
            className="h-11"
            disabled={isPending}
            onClick={handleDelete}
          >
            ลบเลย?
          </Button>
        ) : (
          <Button variant="ghost" className="size-11" onClick={() => setConfirmingDelete(true)}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
