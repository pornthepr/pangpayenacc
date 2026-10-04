import { createClient } from "@/lib/supabase/server";
import { resolvePeriod, type PeriodPreset } from "@/lib/format/period";
import { bangkokMonthBounds } from "@/lib/format/date";
import { bucketSmallCategories } from "@/lib/format/breakdown";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { MonthlyLineChart } from "@/components/charts/monthly-line-chart";
import { ContributionsChart } from "@/components/charts/contributions-chart";
import { CompareMonthChart } from "@/components/charts/compare-month-chart";
import { PeriodSelector } from "./period-selector";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const preset = (params.period as PeriodPreset) ?? "this_month";
  const { from, to } = resolvePeriod(
    preset,
    params.from && params.to ? { from: params.from, to: params.to } : undefined
  );

  const { from: currentMonthFrom, to: currentMonthTo } = bangkokMonthBounds();
  const { from: prevMonthFrom, to: prevMonthTo } = resolvePeriod("last_month");

  const supabase = await createClient();
  const [
    { data: expenseBreakdown },
    { data: incomeBreakdown },
    { data: monthlyTrend },
    { data: contributions },
    { data: currentMonthBreakdown },
    { data: prevMonthBreakdown },
  ] = await Promise.all([
    supabase.rpc("rpc_category_breakdown", { p_from: from, p_to: to, p_type: "expense" }),
    supabase.rpc("rpc_category_breakdown", { p_from: from, p_to: to, p_type: "income" }),
    supabase.rpc("rpc_monthly_summary", { p_from: from, p_to: to }),
    supabase.rpc("rpc_contributions", { p_from: from, p_to: to }),
    supabase.rpc("rpc_category_breakdown", { p_from: currentMonthFrom, p_to: currentMonthTo, p_type: "expense" }),
    supabase.rpc("rpc_category_breakdown", { p_from: prevMonthFrom, p_to: prevMonthTo, p_type: "expense" }),
  ]);

  const expenseRows = bucketSmallCategories(expenseBreakdown ?? []);
  const incomeRows = bucketSmallCategories(incomeBreakdown ?? []);

  const compareMap = new Map<string, { categoryId: string; name: string; current: number; previous: number }>();
  for (const row of currentMonthBreakdown ?? []) {
    compareMap.set(row.category_id, {
      categoryId: row.category_id,
      name: row.category_name,
      current: row.amount,
      previous: 0,
    });
  }
  for (const row of prevMonthBreakdown ?? []) {
    const existing = compareMap.get(row.category_id);
    if (existing) {
      existing.previous = row.amount;
    } else {
      compareMap.set(row.category_id, {
        categoryId: row.category_id,
        name: row.category_name,
        current: 0,
        previous: row.amount,
      });
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-lg font-semibold">รายงาน</h1>

      <PeriodSelector />

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">แนวโน้มรายเดือน</h2>
        <MonthlyLineChart data={monthlyTrend ?? []} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">จ่ายตามหมวด</h2>
        <CategoryPieChart data={expenseRows} type="expense" from={from} to={to} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">รับตามหมวด</h2>
        <CategoryPieChart data={incomeRows} type="income" from={from} to={to} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">เงินสมทบรายคน</h2>
        <ContributionsChart data={contributions ?? []} from={from} to={to} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">เทียบเดือนก่อน (รายจ่าย)</h2>
        <CompareMonthChart
          data={Array.from(compareMap.values())}
          currentFrom={currentMonthFrom}
          currentTo={currentMonthTo}
        />
      </section>
    </div>
  );
}
