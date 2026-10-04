import { z } from "zod";

export const TRANSACTION_TYPES = ["income", "expense", "transfer"] as const;

export const transactionTypeLabels: Record<(typeof TRANSACTION_TYPES)[number], string> = {
  income: "รับ",
  expense: "จ่าย",
  transfer: "โอน",
};

const baseFields = {
  amount: z.coerce.number().positive("กรุณากรอกจำนวนเงิน"),
  occurredOn: z.string().min(1, "กรุณาเลือกวันที่"),
  note: z.string().trim().max(500).optional().or(z.literal("")),
};

export const incomeFormSchema = z.object({
  type: z.literal("income"),
  ...baseFields,
  categoryId: z.string().min(1, "กรุณาเลือกหมวด"),
  accountId: z.string().min(1, "กรุณาเลือกบัญชี"),
  contributorProfileId: z.string().optional().or(z.literal("")),
  contributorName: z.string().trim().max(100).optional().or(z.literal("")),
});

export const expenseFormSchema = z.object({
  type: z.literal("expense"),
  ...baseFields,
  categoryId: z.string().min(1, "กรุณาเลือกหมวด"),
  accountId: z.string().min(1, "กรุณาเลือกบัญชี"),
  beneficiaryProfileId: z.string().optional().or(z.literal("")),
});

export const transferFormSchema = z
  .object({
    type: z.literal("transfer"),
    ...baseFields,
    accountId: z.string().min(1, "กรุณาเลือกบัญชีต้นทาง"),
    toAccountId: z.string().min(1, "กรุณาเลือกบัญชีปลายทาง"),
  })
  .refine((data) => data.accountId !== data.toAccountId, {
    message: "บัญชีต้นทางและปลายทางต้องไม่ใช่บัญชีเดียวกัน",
    path: ["toAccountId"],
  });

export const transactionFormSchema = z.discriminatedUnion("type", [
  incomeFormSchema,
  expenseFormSchema,
  transferFormSchema,
]);

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
