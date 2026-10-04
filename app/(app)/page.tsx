import Link from "next/link";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format/money";
import { formatThaiMonthYear, bangkokMonthBounds, adjacentMonthKeys } from "@/lib/format/date";
import { MonthlySummaryStat } from "@/components/charts/monthly-summary-stat";
import { TrendChart } from "@/components/charts/trend-chart";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const { from, to } = bangkokMonthBounds(month);
  const { prevKey, nextKey } = adjacentMonthKeys(from);
  const label = formatThaiMonthYear(from);

  const supabase = await createClient();
  // Trend chart always shows the last 6 real calendar months, independent of
  // the month switcher above (which only scopes the summary stat).
  const todayBounds = bangkokMonthBounds();
  const [todayYear, todayMonth] = todayBounds.from.split("-").map(Number);
  const sixMonthsAgo = new Date(Date.UTC(todayYear, todayMonth - 1 - 5, 1));
  const trendFrom = `${sixMonthsAgo.getUTCFullYear()}-${String(sixMonthsAgo.getUTCMonth() + 1).padStart(2, "0")}-01`;

  const [
    { data: accounts },
    { data: balances },
    { data: monthSummary },
    { data: trend },
    { data: recentTransactions },
    { data: categories },
    { data: earliestTransaction },
    { data: carryForwardRaw },
  ] = await Promise.all([
    supabase.from("accounts").select("*").eq("is_archived", false).order("sort_order"),
    supabase.from("v_account_balances").select("*"),
    supabase.rpc("rpc_monthly_summary", { p_from: from, p_to: to }),
    supabase.rpc("rpc_monthly_summary", { p_from: trendFrom, p_to: todayBounds.to }),
    supabase
      .from("transactions")
      .select("*")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("categories").select("*"),
    supabase
      .from("transactions")
      .select("occurred_on")
      .order("occurred_on", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.rpc("rpc_balance_before", { p_date: from }),
  ]);

  const balanceByAccountId = new Map((balances ?? []).map((b) => [b.account_id, b.balance]));
  const categoriesById = new Map((categories ?? []).map((c) => [c.id, c]));
  const hasAccounts = (accounts?.length ?? 0) > 0;
  const totalBalance = (accounts ?? []).reduce(
    (sum, a) => sum + (balanceByAccountId.get(a.id) ?? a.opening_balance),
    0
  );
  const thisMonth = monthSummary?.[0] ?? { income: 0, expense: 0 };
  const carryForward = carryForwardRaw ?? 0;
  const firstMonthKey = earliestTransaction?.occurred_on.slice(0, 7);
  const isFirstMonth = !firstMonthKey || from.slice(0, 7) <= firstMonthKey;

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">หน้าแรก</h1>

      {!hasAccounts ? (
        <>
          <EmptyState
            icon={Wallet}
            title="ยังไม่มีบัญชี"
            description="สร้างบัญชีแรกของครอบครัว แล้วยอดรวมและกราฟจะมาแสดงที่นี่"
          />
          <Button asChild className="h-11">
            <Link href="/settings/accounts">สร้างบัญชี</Link>
          </Button>
        </>
      ) : (
        <>
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">ยอดรวมทุกบัญชี</p>
            <p className="text-2xl font-semibold">{formatMoney(totalBalance)}</p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {accounts!.map((account) => (
              <Link
                key={account.id}
                href={`/accounts/${account.id}`}
                className="flex w-36 shrink-0 flex-col gap-2 rounded-xl border p-3"
              >
                <div
                  className="flex size-9 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: account.color ?? "#6b7280" }}
                >
                  <DynamicIcon name={(account.icon ?? "wallet") as IconName} className="size-4" />
                </div>
                <p className="truncate text-sm font-medium">{account.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(balanceByAccountId.get(account.id) ?? account.opening_balance)}
                </p>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between">
            {isFirstMonth ? (
              <Button variant="ghost" size="icon-sm" disabled>
                <ChevronLeft className="size-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/?month=${prevKey}`}>
                  <ChevronLeft className="size-4" />
                </Link>
              </Button>
            )}
            <p className="font-medium">{label}</p>
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href={`/?month=${nextKey}`}>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>

          <MonthlySummaryStat
            carryForward={carryForward}
            carryForwardLabel={isFirstMonth ? "ยอดเริ่มต้น" : "ยกยอดจากเดือนก่อน"}
            income={thisMonth.income}
            expense={thisMonth.expense}
          />

          <div className="flex flex-col gap-2">
            <h2 className="font-medium">แนวโน้มรับ-จ่าย</h2>
            <TrendChart data={trend ?? []} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">รายการล่าสุด</h2>
              <Link href="/transactions" className="text-sm text-muted-foreground underline">
                ดูทั้งหมด
              </Link>
            </div>
            {(recentTransactions ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">ยังไม่มีรายการ</p>
            ) : (
              <div className="flex flex-col rounded-xl border">
                {(recentTransactions ?? []).map((tx) => {
                  const category = tx.category_id ? categoriesById.get(tx.category_id) : null;
                  const isIncome = tx.type === "income";
                  const isExpense = tx.type === "expense";
                  return (
                    <Link
                      key={tx.id}
                      href={`/transactions/${tx.id}`}
                      className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0"
                    >
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: category?.color ?? "#6b7280" }}
                      >
                        {tx.type === "transfer" ? (
                          <ArrowLeftRight className="size-4" />
                        ) : (
                          <DynamicIcon
                            name={(category?.icon ?? "circle-plus") as IconName}
                            className="size-4"
                          />
                        )}
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm">
                        {category?.name ?? "โอนเงิน"}
                      </p>
                      <p
                        className={`text-sm font-medium ${isIncome ? "text-green-600" : isExpense ? "text-red-600" : "text-muted-foreground"}`}
                      >
                        {isIncome ? "+" : isExpense ? "-" : ""}
                        {formatMoney(tx.amount)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
