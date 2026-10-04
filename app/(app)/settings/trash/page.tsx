import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { createClient } from "@/lib/supabase/server";
import { TrashList } from "./trash-list";

export default async function TrashPage() {
  const supabase = await createClient();
  const [{ data: transactions }, { data: accounts }, { data: categories }] = await Promise.all([
    supabase.rpc("rpc_trash_transactions"),
    supabase.from("accounts").select("*"),
    supabase.from("categories").select("*"),
  ]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/settings">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">ถังขยะ</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        รายการที่ลบไปภายใน 30 วันล่าสุด กู้คืนได้ที่นี่
      </p>

      {(transactions ?? []).length === 0 ? (
        <EmptyState icon={Trash2} title="ถังขยะว่าง" description="ยังไม่มีรายการที่ถูกลบ" />
      ) : (
        <TrashList
          transactions={transactions ?? []}
          accounts={accounts ?? []}
          categories={categories ?? []}
        />
      )}
    </div>
  );
}
