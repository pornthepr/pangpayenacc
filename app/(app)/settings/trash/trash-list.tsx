"use client";

import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { ArrowLeftRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format/money";
import { formatThaiDateLong } from "@/lib/format/date";
import type { Database } from "@/lib/supabase/database.types";
import { restoreTransactionAction } from "./actions";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type Account = Database["public"]["Tables"]["accounts"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export function TrashList({
  transactions,
  accounts,
  categories,
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}) {
  const accountsById = new Map(accounts.map((a) => [a.id, a]));
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  async function handleRestore(id: string) {
    const result = await restoreTransactionAction(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("กู้คืนรายการแล้ว");
    }
  }

  return (
    <div className="flex flex-col divide-y rounded-xl border">
      {transactions.map((tx) => {
        const category = tx.category_id ? categoriesById.get(tx.category_id) : null;
        const account = accountsById.get(tx.account_id);
        return (
          <div key={tx.id} className="flex items-center gap-3 p-3">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: category?.color ?? "#6b7280" }}
            >
              {tx.type === "transfer" ? (
                <ArrowLeftRight className="size-4" />
              ) : (
                <DynamicIcon name={(category?.icon ?? "circle-plus") as IconName} className="size-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{category?.name ?? "โอนเงิน"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {account?.name} · {formatThaiDateLong(tx.occurred_on)} · {formatMoney(tx.amount)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => handleRestore(tx.id)}
            >
              <RotateCcw className="size-4" />
              กู้คืน
            </Button>
          </div>
        );
      })}
    </div>
  );
}
