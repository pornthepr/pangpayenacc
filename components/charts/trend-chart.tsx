"use client";

import { useRouter } from "next/navigation";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCompactNumber } from "@/lib/format/chart";
import { formatMoney } from "@/lib/format/money";
import { CHART_COLORS } from "@/lib/format/chart";

interface MonthRow {
  month: string;
  income: number;
  expense: number;
  net: number;
}

const monthLabelFormatter = new Intl.DateTimeFormat("th-TH", { month: "short" });

function monthLabel(iso: string) {
  return monthLabelFormatter.format(new Date(iso));
}

export function TrendChart({ data }: { data: MonthRow[] }) {
  const router = useRouter();

  function drillDown(month: string, type: "income" | "expense") {
    // Pure y/m arithmetic — no Date/timezone conversion, so this can't shift
    // a day across month boundaries depending on the viewer's local offset.
    const [year, mon] = month.slice(0, 7).split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
    const to = `${year}-${String(mon).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
    router.push(`/transactions?type=${type}&from=${month.slice(0, 10)}&to=${to}`);
  }

  return (
    <div className="h-64 w-full rounded-xl border p-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
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
          <Legend
            formatter={(value) =>
              value === "income" ? "รับ" : value === "expense" ? "จ่าย" : "สุทธิ"
            }
          />
          <Bar
            dataKey="income"
            fill={CHART_COLORS.income}
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
            onClick={(data: { payload?: MonthRow }) =>
              data.payload && drillDown(data.payload.month, "income")
            }
            cursor="pointer"
          />
          <Bar
            dataKey="expense"
            fill={CHART_COLORS.expense}
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
            onClick={(data: { payload?: MonthRow }) =>
              data.payload && drillDown(data.payload.month, "expense")
            }
            cursor="pointer"
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke={CHART_COLORS.net}
            strokeWidth={2}
            dot={{ r: 4, fill: CHART_COLORS.net }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={(props: any) => {
              const x = Number(props.x);
              const y = Number(props.y);
              const value = Number(props.value);
              if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(value)) return <g />;
              const sign = value > 0 ? "+" : "";
              return (
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill={value < 0 ? CHART_COLORS.expense : "var(--foreground)"}
                >
                  {sign}
                  {formatCompactNumber(value)}
                </text>
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
