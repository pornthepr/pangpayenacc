"use client";

import { useRouter } from "next/navigation";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCompactNumber, CHART_COLORS } from "@/lib/format/chart";
import { formatMoney } from "@/lib/format/money";

export interface MonthCompareRow {
  month: string; // "yyyy-MM-01"
  income: number;
  expense: number;
  balance: number;
}

const monthLabelFormatter = new Intl.DateTimeFormat("th-TH", { month: "short", year: "2-digit" });

function monthLabel(iso: string) {
  return monthLabelFormatter.format(new Date(iso));
}

export function MonthlyCompareBarChart({ data }: { data: MonthCompareRow[] }) {
  const router = useRouter();

  function drillDown(month: string, type: "income" | "expense") {
    const [year, mon] = month.slice(0, 7).split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
    const to = `${year}-${String(mon).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
    router.push(`/transactions?type=${type}&from=${month.slice(0, 10)}&to=${to}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="h-56 w-full rounded-xl border p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="0" stroke="var(--border)" />
            <XAxis
              dataKey="month"
              tickFormatter={monthLabel}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCompactNumber}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              formatter={(value) => formatMoney(Number(value))}
              labelFormatter={(label) => monthLabel(String(label))}
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <Legend formatter={(value) => (value === "income" ? "รับ" : "จ่าย")} />
            <Bar
              dataKey="income"
              fill={CHART_COLORS.income}
              radius={[4, 4, 0, 0]}
              maxBarSize={56}
              onClick={(entry: { payload?: MonthCompareRow }) =>
                entry.payload && drillDown(entry.payload.month, "income")
              }
              cursor="pointer"
            />
            <Bar
              dataKey="expense"
              fill={CHART_COLORS.expense}
              radius={[4, 4, 0, 0]}
              maxBarSize={56}
              onClick={(entry: { payload?: MonthCompareRow }) =>
                entry.payload && drillDown(entry.payload.month, "expense")
              }
              cursor="pointer"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Closing balance spans a far larger magnitude than a single month's
          income/expense (it's the running total across every account), so it
          can't share the bar chart's linear axis without squashing the bars
          flat — shown as its own labeled row instead, per month. */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((row) => (
          <div key={row.month} className="flex flex-col items-center gap-0.5 rounded-lg border p-2 text-center">
            <span className="text-xs text-muted-foreground">{monthLabel(row.month)} · คงเหลือ</span>
            <span className="text-sm font-semibold">{formatMoney(row.balance)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
