import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { applyTransactionFilters } from "@/lib/transactions/filtered-query";
import { FiltersSheet } from "./filters-sheet";
import { TransactionList } from "./transaction-list";
import { ExportCsvLink } from "./export-csv-link";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: transactions } = await applyTransactionFilters(supabase, params);

  const groupsByDate = new Map<
    string,
    { date: string; transactions: Transaction[]; income: number; expense: number }
  >();

  for (const transaction of transactions ?? []) {
    const existing = groupsByDate.get(transaction.occurred_on) ?? {
      date: transaction.occurred_on,
      transactions: [],
      income: 0,
      expense: 0,
    };
    existing.transactions.push(transaction);
    if (transaction.type === "income") existing.income += transaction.amount;
    if (transaction.type === "expense") existing.expense += transaction.amount;
    groupsByDate.set(transaction.occurred_on, existing);
  }

  const groups = Array.from(groupsByDate.values());

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between p-4 pb-0">
        <h1 className="text-lg font-semibold">รายการ</h1>
        <div className="flex items-center gap-2">
          <ExportCsvLink />
          <FiltersSheet />
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="ยังไม่มีรายการ"
          description="แตะปุ่ม + ด้านล่างเพื่อบันทึกรายรับ รายจ่าย หรือโอนเงินรายการแรก"
        />
      ) : (
        <TransactionList groups={groups} />
      )}
    </div>
  );
}
