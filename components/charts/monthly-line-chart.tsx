"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCompactNumber, CHART_COLORS } from "@/lib/format/chart";
import { formatMoney } from "@/lib/format/money";

interface MonthRow {
  month: string;
  income: number;
  expense: number;
  net: number;
}

const monthLabelFormatter = new Intl.DateTimeFormat("th-TH", { month: "short", year: "2-digit" });

function monthLabel(iso: string) {
  return monthLabelFormatter.format(new Date(iso));
}

export function MonthlyLineChart({ data }: { data: MonthRow[] }) {
  return (
    <div className="h-64 w-full rounded-xl border p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
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
          <Legend
            formatter={(value) =>
              value === "income" ? "รับ" : value === "expense" ? "จ่าย" : "สุทธิ"
            }
          />
          <Line
            type="monotone"
            dataKey="income"
            stroke={CHART_COLORS.income}
            strokeWidth={2}
            dot={{ r: 3, fill: CHART_COLORS.income }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke={CHART_COLORS.expense}
            strokeWidth={2}
            dot={{ r: 3, fill: CHART_COLORS.expense }}
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke={CHART_COLORS.net}
            strokeWidth={2}
            dot={{ r: 3, fill: CHART_COLORS.net }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
