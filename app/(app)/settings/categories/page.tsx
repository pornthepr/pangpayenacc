import Link from "next/link";
import { ArrowLeft, Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_TYPES, categoryTypeLabels } from "@/lib/validation/category";
import { CategoryFormSheet } from "./category-form-sheet";
import { CategoryRow } from "./category-row";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  const all = categories ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/settings">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">จัดการหมวดหมู่</h1>
      </div>

      {all.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="ยังไม่มีหมวดหมู่"
          description="เพิ่มหมวดรายรับ/รายจ่ายแรกของครอบครัวได้เลย"
        />
      ) : null}

      {CATEGORY_TYPES.map((type) => {
        const ofType = all.filter((c) => c.type === type);
        const active = ofType.filter((c) => !c.is_archived);
        const archived = ofType.filter((c) => c.is_archived);

        return (
          <div key={type} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{categoryTypeLabels[type]}</h2>
              <CategoryFormSheet
                defaultType={type}
                trigger={
                  <Button variant="outline" className="h-9">
                    <Plus className="size-4" />
                    เพิ่มหมวด
                  </Button>
                }
              />
            </div>

            {active.map((category, index) => (
              <CategoryRow
                key={category.id}
                category={category}
                siblings={active.filter((c) => c.id !== category.id)}
                isFirst={index === 0}
                isLast={index === active.length - 1}
              />
            ))}

            {archived.length > 0 ? (
              <>
                <p className="pt-2 text-sm text-muted-foreground">ปิดใช้งานแล้ว</p>
                {archived.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    siblings={active}
                    isFirst
                    isLast
                  />
                ))}
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
