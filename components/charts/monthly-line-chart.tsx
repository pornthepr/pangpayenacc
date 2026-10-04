"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCompactNumber, CHART_COLORS } from "@/lib/format/chart";
import { formatMoney } from "@/lib/format/money";

interface MonthRow {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

const monthLabelFormatter = new Intl.DateTimeFormat("th-TH", { month: "short", year: "2-digit" });

function monthLabel(iso: string) {
  return monthLabelFormatter.format(new Date(iso));
}

export function MonthlyLineChart({ data }: { data: MonthRow[] }) {
  return (
    <div className="h-64 w-full rounded-xl border p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
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
          {/* Closing balance is the running total across every account — far
              larger than a single month's income/expense — so it gets its own
              hidden scale instead of squashing the income/expense lines flat. */}
          <YAxis yAxisId="balance" hide domain={["dataMin - 1", "dataMax + 1"]} />
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
              value === "income" ? "รับ" : value === "expense" ? "จ่าย" : "คงเหลือ"
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
            yAxisId="balance"
            type="monotone"
            dataKey="balance"
            stroke={CHART_COLORS.balance}
            strokeWidth={2}
            dot={{ r: 3, fill: CHART_COLORS.balance }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={(props: any) => {
              const x = Number(props.x);
              const y = Number(props.y);
              const value = Number(props.value);
              if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(value)) return <g />;
              return (
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill={value < 0 ? CHART_COLORS.expense : "var(--foreground)"}
                >
                  {formatCompactNumber(value)}
                </text>
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
