import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { FiltersSheet } from "./filters-sheet";
import { TransactionList } from "./transaction-list";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionType = Transaction["type"];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("*")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (params.type) query = query.eq("type", params.type as TransactionType);
  if (params.accountId) {
    query = query.or(`account_id.eq.${params.accountId},to_account_id.eq.${params.accountId}`);
  }
  if (params.categoryId) query = query.eq("category_id", params.categoryId);
  if (params.enteredBy) query = query.eq("created_by", params.enteredBy);
  if (params.from) query = query.gte("occurred_on", params.from);
  if (params.to) query = query.lte("occurred_on", params.to);
  if (params.q) query = query.ilike("note", `%${params.q}%`);

  const { data: transactions } = await query;

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
        <FiltersSheet />
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
