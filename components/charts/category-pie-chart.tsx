"use client";

import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatMoney } from "@/lib/format/money";
import type { BreakdownRow } from "@/lib/format/breakdown";
import { useMounted } from "@/lib/hooks/use-mounted";

export function CategoryPieChart({
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
  const mounted = useMounted();

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
    <div className="flex flex-col gap-2">
      <div className="h-40 w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="name"
                innerRadius="45%"
                outerRadius="90%"
                paddingAngle={2}
                onClick={(entry: { payload?: BreakdownRow }) =>
                  entry.payload && handleClick(entry.payload)
                }
                cursor="pointer"
              >
                {data.map((row) => (
                  <Cell key={row.categoryId ?? "other"} fill={row.color} stroke="var(--background)" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, item) => [
                  `${formatMoney(Number(value))} (${(item.payload as BreakdownRow).percentage}%)`,
                  (item.payload as BreakdownRow).name,
                ]}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        {data.map((row) => (
          <button
            key={row.categoryId ?? "other"}
            type="button"
            onClick={() => handleClick(row)}
            className="flex items-center gap-1.5 text-left text-xs"
          >
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
            <span className="min-w-0 flex-1 truncate">{row.name}</span>
            <span className="shrink-0 text-muted-foreground">{row.percentage}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}
