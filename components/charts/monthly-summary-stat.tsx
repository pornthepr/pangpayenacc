import { formatMoney } from "@/lib/format/money";
import { CHART_COLORS } from "@/lib/format/chart";

export function MonthlySummaryStat({
  carryForward,
  carryForwardLabel,
  income,
  expense,
}: {
  carryForward: number;
  carryForwardLabel: string;
  income: number;
  expense: number;
}) {
  const closingBalance = carryForward + income - expense;
  const total = income + expense;
  const incomeShare = total > 0 ? (income / total) * 100 : 50;

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{carryForwardLabel}</span>
        <span className="font-medium">{formatMoney(carryForward)}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="รับ" value={income} sign="+" color={CHART_COLORS.income} />
        <Stat label="จ่าย" value={expense} sign="-" color={CHART_COLORS.expense} />
        <Stat
          label="คงเหลือ"
          value={Math.abs(closingBalance)}
          sign={closingBalance < 0 ? "-" : ""}
          color={closingBalance >= 0 ? undefined : CHART_COLORS.expense}
        />
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

function Stat({
  label,
  value,
  sign,
  color,
}: {
  label: string;
  value: number;
  sign: "+" | "-" | "";
  color?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className="whitespace-nowrap text-sm font-semibold sm:text-base"
        style={color ? { color } : undefined}
      >
        {value === 0 ? "" : sign}
        {formatMoney(value)}
      </span>
    </div>
  );
}
