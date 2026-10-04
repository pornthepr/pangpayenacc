import { describe, it, expect } from "vitest";
import { resolvePeriod } from "./period";

describe("resolvePeriod", () => {
  it("this_month: from is the 1st, to is on/after from", () => {
    const { from, to } = resolvePeriod("this_month");
    expect(from.endsWith("-01")).toBe(true);
    expect(to >= from).toBe(true);
    expect(from.slice(0, 7)).toBe(to.slice(0, 7)); // same calendar month
  });

  it("last_month ends exactly one day before this_month starts", () => {
    const thisMonth = resolvePeriod("this_month");
    const lastMonth = resolvePeriod("last_month");
    const dayAfterLastMonthEnd = new Date(`${lastMonth.to}T00:00:00Z`);
    dayAfterLastMonthEnd.setUTCDate(dayAfterLastMonthEnd.getUTCDate() + 1);
    const expected = dayAfterLastMonthEnd.toISOString().slice(0, 10);
    expect(expected).toBe(thisMonth.from);
  });

  it("last_3_months spans 3 calendar months ending at this month", () => {
    const { from, to } = resolvePeriod("last_3_months");
    const thisMonth = resolvePeriod("this_month");
    expect(to).toBe(thisMonth.to);
    const months =
      (Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 +
      (Number(to.slice(5, 7)) - Number(from.slice(5, 7))) +
      1;
    expect(months).toBe(3);
  });

  it("this_year spans the full calendar year", () => {
    const { from, to } = resolvePeriod("this_year");
    expect(from.slice(5)).toBe("01-01");
    expect(to.slice(5)).toBe("12-31");
    expect(from.slice(0, 4)).toBe(to.slice(0, 4));
  });

  it("custom falls back to the given range", () => {
    const result = resolvePeriod("custom", { from: "2026-01-05", to: "2026-01-20" });
    expect(result).toEqual({ from: "2026-01-05", to: "2026-01-20" });
  });

  it("custom with no range falls back to this_month", () => {
    expect(resolvePeriod("custom")).toEqual(resolvePeriod("this_month"));
  });
});
