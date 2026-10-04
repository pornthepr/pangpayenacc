import { bangkokMonthBounds, formatThaiMonthYear } from "./date";

export const PERIOD_PRESETS = [
  "this_month",
  "last_month",
  "last_3_months",
  "last_6_months",
  "this_year",
  "custom",
] as const;
export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export const periodPresetLabels: Record<PeriodPreset, string> = {
  this_month: "เดือนนี้",
  last_month: "เดือนก่อน",
  last_3_months: "3 เดือน",
  last_6_months: "6 เดือน",
  this_year: "ปีนี้",
  custom: "กำหนดเอง",
};

// Normalizes a 1-indexed (year, month) pair after adding `delta` months,
// rolling the year over as needed (e.g. 2026-01 + (-1) -> 2025-12).
function shiftMonth(year: number, month1Indexed: number, delta: number): string {
  const zeroIndexed = month1Indexed - 1 + delta;
  const y = year + Math.floor(zeroIndexed / 12);
  const m = ((zeroIndexed % 12) + 12) % 12;
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

// All month/year math below is plain y/m integer arithmetic off the current
// Bangkok calendar date — no Date-object timezone conversion involved, so it
// can't silently shift a day depending on the server's own runtime timezone
// (see lib/format/date.ts).
export function resolvePeriod(
  preset: PeriodPreset,
  custom?: { from: string; to: string }
): { from: string; to: string } {
  const today = bangkokMonthBounds();
  const [year, month] = today.from.split("-").map(Number);

  switch (preset) {
    case "this_month":
      return today;
    case "last_month":
      return bangkokMonthBounds(shiftMonth(year, month, -1));
    case "last_3_months":
      return { from: bangkokMonthBounds(shiftMonth(year, month, -2)).from, to: today.to };
    case "last_6_months":
      return { from: bangkokMonthBounds(shiftMonth(year, month, -5)).from, to: today.to };
    case "this_year":
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    case "custom":
      return custom ?? today;
  }
}

// "เดือนนี้"/"เดือนก่อน" read as the actual resolved month name (e.g.
// "ตุลาคม 2569") per request — the other presets keep their generic label
// since they span more than one month.
export function periodChipLabel(preset: PeriodPreset): string {
  if (preset === "this_month" || preset === "last_month") {
    return formatThaiMonthYear(resolvePeriod(preset).from);
  }
  return periodPresetLabels[preset];
}
