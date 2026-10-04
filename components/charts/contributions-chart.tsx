"use client";

import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, LabelList } from "recharts";
import { formatMoney } from "@/lib/format/money";
import { formatCompactNumber } from "@/lib/format/chart";
import { useMounted } from "@/lib/hooks/use-mounted";

export interface ContributionRow {
  label: string;
  color: string | null;
  amount: number;
}

export function ContributionsChart({
  data,
  from,
  to,
}: {
  data: ContributionRow[];
  from: string;
  to: string;
}) {
  const router = useRouter();
  const mounted = useMounted();

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">ยังไม่มีข้อมูลในช่วงนี้</p>
    );
  }

  if (!mounted) {
    return <div style={{ height: Math.max(data.length * 40, 120) }} className="w-full" />;
  }

  return (
    <div style={{ height: Math.max(data.length * 40, 120) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
          barCategoryGap={8}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={70}
            tick={{ fontSize: 12, fill: "var(--foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value))}
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
            onClick={() => router.push(`/transactions?type=income&from=${from}&to=${to}`)}
            cursor="pointer"
          >
            {data.map((row, index) => (
              <Cell key={index} fill={row.color ?? "#6b7280"} />
            ))}
            <LabelList
              dataKey="amount"
              position="right"
              formatter={(value) => formatCompactNumber(Number(value ?? 0))}
              style={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
