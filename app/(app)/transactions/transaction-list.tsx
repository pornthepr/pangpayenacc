"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatMoney } from "@/lib/format/money";
import { formatThaiDateLong } from "@/lib/format/date";
import type { Database } from "@/lib/supabase/database.types";
import { useAppData } from "@/components/transactions/app-data-context";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { softDeleteTransactionAction } from "./actions";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

interface DayGroup {
  date: string;
  transactions: Transaction[];
  income: number;
  expense: number;
}

export function TransactionList({ groups }: { groups: DayGroup[] }) {
  const router = useRouter();
  const { accounts, categories, profiles, quickAdd } = useAppData();

  const accountsById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const profilesById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  async function handleDelete(transaction: Transaction) {
    const result = await softDeleteTransactionAction(transaction.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("ลบรายการแล้ว");
    }
  }

  return (
    <div className="flex flex-col">
      {groups.map((group) => (
        <div key={group.date}>
          <div className="flex items-baseline justify-between bg-muted/50 px-4 py-2 text-sm">
            <span className="font-medium">{formatThaiDateLong(group.date)}</span>
            <span className="text-muted-foreground">
              +{formatMoney(group.income)} / -{formatMoney(group.expense)}
            </span>
          </div>
          {group.transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              accountsById={accountsById}
              categoriesById={categoriesById}
              profilesById={profilesById}
              onEdit={() => quickAdd.openEdit(transaction)}
              onDelete={() => handleDelete(transaction)}
              onTap={() => router.push(`/transactions/${transaction.id}`)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
