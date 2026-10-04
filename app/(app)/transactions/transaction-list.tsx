"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatMoney } from "@/lib/format/money";
import { formatThaiDateLong, formatThaiMonthYear } from "@/lib/format/date";
import { createClient } from "@/lib/supabase/client";
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

interface MonthGroup {
  monthKey: string;
  income: number;
  expense: number;
  days: DayGroup[];
}

export function TransactionList({ monthGroups }: { monthGroups: MonthGroup[] }) {
  const router = useRouter();
  const { accounts, categories, profiles, quickAdd } = useAppData();

  const accountsById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const profilesById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  // "รายการใหม่จากคนอื่นขึ้นทันทีโดยไม่ต้องรีเฟรช" — re-fetch the server-rendered
  // list whenever anyone changes a transaction, rather than reconciling the
  // realtime payload into local state by hand. The channel name is generated
  // *inside* the effect (not in a ref) so each effect invocation gets a truly
  // distinct name — React's dev-mode double-invoke otherwise reuses the same
  // ref value for both runs, and supabase-js's channel registry is keyed by
  // name, so the first run's cleanup can tear down the second's live socket.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`transactions-list-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

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
      {monthGroups.map((month) => (
        <div key={month.monthKey}>
          <div className="flex flex-col gap-0.5 bg-muted px-4 py-2">
            <span className="font-semibold">{formatThaiMonthYear(month.monthKey)}</span>
            <span className="text-sm text-muted-foreground">
              รับ {formatMoney(month.income)} · จ่าย {formatMoney(month.expense)} · เหลือ{" "}
              {formatMoney(month.income - month.expense)}
            </span>
          </div>

          {month.days.map((group) => (
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
      ))}
    </div>
  );
}
