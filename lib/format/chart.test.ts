import { describe, it, expect } from "vitest";
import { formatCompactNumber } from "./chart";

describe("formatCompactNumber", () => {
  it("leaves small numbers as-is", () => {
    expect(formatCompactNumber(500)).toBe("500");
    expect(formatCompactNumber(0)).toBe("0");
  });

  it("abbreviates thousands with k", () => {
    expect(formatCompactNumber(12500)).toBe("12.5k");
    expect(formatCompactNumber(1000)).toBe("1k");
  });

  it("abbreviates millions with M", () => {
    expect(formatCompactNumber(2_500_000)).toBe("2.5M");
  });

  it("handles negative values", () => {
    expect(formatCompactNumber(-4200)).toBe("-4.2k");
  });
});
