import { describe, it, expect } from "vitest";
import { transactionFormSchema } from "./transaction";

const base = { amount: "100", occurredOn: "2026-10-04", note: "" };

describe("transactionFormSchema", () => {
  it("accepts a valid expense", () => {
    const result = transactionFormSchema.safeParse({
      ...base,
      type: "expense",
      categoryId: "cat-1",
      accountId: "acc-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an expense without a category", () => {
    const result = transactionFormSchema.safeParse({
      ...base,
      type: "expense",
      accountId: "acc-1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    const result = transactionFormSchema.safeParse({
      ...base,
      amount: "0",
      type: "expense",
      categoryId: "cat-1",
      accountId: "acc-1",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid transfer between two different accounts", () => {
    const result = transactionFormSchema.safeParse({
      ...base,
      type: "transfer",
      accountId: "acc-1",
      toAccountId: "acc-2",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a transfer to the same account", () => {
    const result = transactionFormSchema.safeParse({
      ...base,
      type: "transfer",
      accountId: "acc-1",
      toAccountId: "acc-1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a transfer with a categoryId but no toAccountId", () => {
    const result = transactionFormSchema.safeParse({
      ...base,
      type: "transfer",
      accountId: "acc-1",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an income with a free-text contributor name", () => {
    const result = transactionFormSchema.safeParse({
      ...base,
      type: "income",
      categoryId: "cat-1",
      accountId: "acc-1",
      contributorName: "ยาย",
    });
    expect(result.success).toBe(true);
  });
});
