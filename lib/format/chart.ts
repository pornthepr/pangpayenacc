// Compact axis labels per requirement section 5 ("แกนแสดงแบบย่อ เช่น 12.5k").
export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
}

export const CHART_COLORS = {
  income: "#16a34a",
  expense: "#dc2626",
  balance: "#3b82f6",
  transfer: "#6b7280",
  other: "#6b7280",
} as const;
