import { describe, it, expect } from "vitest";
import { bucketSmallCategories } from "./breakdown";

function row(id: string, name: string, amount: number, percentage: number) {
  return { category_id: id, category_name: name, color: "#111111", amount, percentage };
}

describe("bucketSmallCategories", () => {
  it("keeps categories at or above the threshold as their own bars", () => {
    const result = bucketSmallCategories([row("a", "A", 97, 97), row("b", "B", 3, 3)]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toEqual(["A", "B"]);
  });

  it("folds categories below 3% into a single อื่น ๆ bar", () => {
    const result = bucketSmallCategories([
      row("a", "A", 95, 95),
      row("b", "B", 2, 2),
      row("c", "C", 2, 2),
      row("d", "D", 1, 1),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("A");
    const other = result[1];
    expect(other.name).toBe("อื่น ๆ");
    expect(other.categoryId).toBeNull();
    expect(other.amount).toBe(2 + 2 + 1);
    expect(other.percentage).toBeCloseTo(5, 5);
  });

  it("caps at maxBars, folding overflow into อื่น ๆ even if individually above threshold", () => {
    const rows = Array.from({ length: 10 }, (_, i) => row(`c${i}`, `C${i}`, 10, 10));
    const result = bucketSmallCategories(rows, 8);
    expect(result).toHaveLength(8);
    expect(result[7].name).toBe("อื่น ๆ");
    // 7 kept individually + 3 folded (indexes 7,8,9) into "other"
    expect(result[7].amount).toBe(30);
  });

  it("returns an empty array for no data", () => {
    expect(bucketSmallCategories([])).toEqual([]);
  });
});
