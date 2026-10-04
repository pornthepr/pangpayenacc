"use client";

import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, LabelList } from "recharts";
import { formatMoney } from "@/lib/format/money";

export interface BreakdownRow {
  categoryId: string | null;
  name: string;
  color: string;
  amount: number;
  percentage: number;
}

export function CategoryBreakdownChart({
  data,
  type,
  from,
  to,
}: {
  data: BreakdownRow[];
  type: "income" | "expense";
  from: string;
  to: string;
}) {
  const router = useRouter();

  function handleClick(row: BreakdownRow) {
    const params = new URLSearchParams({ type, from, to });
    if (row.categoryId) params.set("categoryId", row.categoryId);
    router.push(`/transactions?${params.toString()}`);
  }

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">ยังไม่มีข้อมูลในช่วงนี้</p>
    );
  }

  return (
    <div style={{ height: Math.max(data.length * 40, 120) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 36, left: 4, bottom: 4 }}
          barCategoryGap={8}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fontSize: 12, fill: "var(--foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value, _name, item) => [
              `${formatMoney(Number(value))} (${(item.payload as BreakdownRow).percentage}%)`,
              "ยอดรวม",
            ]}
            contentStyle={{
              backgroundColor: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13,
            }}
          />
          <Bar
            dataKey="amount"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
            onClick={(data: { payload?: BreakdownRow }) => data.payload && handleClick(data.payload)}
            cursor="pointer"
          >
            {data.map((row) => (
              <Cell key={row.categoryId ?? "other"} fill={row.color} />
            ))}
            <LabelList
              dataKey="percentage"
              position="right"
              formatter={(value) => `${Number(value ?? 0)}%`}
              style={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
