import { formatMoney } from "@/lib/format/money";
import { CHART_COLORS } from "@/lib/format/chart";

export function MonthlySummaryStat({
  income,
  expense,
}: {
  income: number;
  expense: number;
}) {
  const net = income - expense;
  const total = income + expense;
  const incomeShare = total > 0 ? (income / total) * 100 : 50;

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="รับ" value={income} color={CHART_COLORS.income} />
        <Stat label="จ่าย" value={expense} color={CHART_COLORS.expense} />
        <Stat label="คงเหลือ" value={net} color={net >= 0 ? CHART_COLORS.income : CHART_COLORS.expense} />
      </div>

      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full"
          style={{ width: `${incomeShare}%`, backgroundColor: CHART_COLORS.income }}
        />
        <div
          className="h-full"
          style={{ width: `${100 - incomeShare}%`, backgroundColor: CHART_COLORS.expense }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold" style={{ color }}>
        {sign}
        {formatMoney(Math.abs(value))}
      </span>
    </div>
  );
}
