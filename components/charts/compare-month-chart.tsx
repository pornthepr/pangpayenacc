"use client";

import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format/money";
import { CHART_COLORS } from "@/lib/format/chart";

export interface CompareRow {
  categoryId: string;
  name: string;
  current: number;
  previous: number;
}

export function CompareMonthChart({
  data,
  currentFrom,
  currentTo,
}: {
  data: CompareRow[];
  currentFrom: string;
  currentTo: string;
}) {
  const router = useRouter();
  const rows = data
    .map((row) => ({ ...row, diff: row.current - row.previous }))
    .filter((row) => row.diff !== 0)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(r.diff)));

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        ไม่มีการเปลี่ยนแปลงเทียบเดือนก่อน
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const increased = row.diff > 0;
        const color = increased ? CHART_COLORS.expense : CHART_COLORS.income;
        const widthPct = (Math.abs(row.diff) / maxAbs) * 100;
        return (
          <button
            key={row.categoryId}
            type="button"
            onClick={() =>
              router.push(
                `/transactions?type=expense&categoryId=${row.categoryId}&from=${currentFrom}&to=${currentTo}`
              )
            }
            className="flex flex-col gap-1 text-left"
          >
            <div className="flex items-center justify-between text-sm">
              <span>{row.name}</span>
              <span className="font-medium" style={{ color }}>
                {increased ? "+" : "-"}
                {formatMoney(Math.abs(row.diff))}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${widthPct}%`, backgroundColor: color }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
