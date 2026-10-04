import type { BreakdownRow } from "@/components/charts/category-breakdown-chart";

interface RawBreakdownRow {
  category_id: string;
  category_name: string;
  color: string | null;
  amount: number;
  percentage: number;
}

// "หมวดที่เล็กกว่า 3% รวมเป็น 'อื่น ๆ' สูงสุด 8 แถบ" (requirement section 5).
export function bucketSmallCategories(
  rows: RawBreakdownRow[],
  maxBars = 8,
  smallThresholdPct = 3
): BreakdownRow[] {
  const sorted = [...rows].sort((a, b) => b.amount - a.amount);
  const kept: RawBreakdownRow[] = [];
  const folded: RawBreakdownRow[] = [];

  sorted.forEach((row, index) => {
    if (row.percentage < smallThresholdPct || index >= maxBars - 1) {
      folded.push(row);
    } else {
      kept.push(row);
    }
  });

  const result: BreakdownRow[] = kept.map((row) => ({
    categoryId: row.category_id,
    name: row.category_name,
    color: row.color ?? "#6b7280",
    amount: row.amount,
    percentage: row.percentage,
  }));

  if (folded.length > 0) {
    result.push({
      categoryId: null,
      name: "อื่น ๆ",
      color: "#6b7280",
      amount: folded.reduce((sum, row) => sum + row.amount, 0),
      percentage: Math.round(folded.reduce((sum, row) => sum + row.percentage, 0) * 10) / 10,
    });
  }

  return result;
}
