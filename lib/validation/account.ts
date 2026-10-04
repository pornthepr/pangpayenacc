import { z } from "zod";

export const ACCOUNT_KINDS = ["cash", "bank", "ewallet", "other"] as const;

export const accountKindLabels: Record<(typeof ACCOUNT_KINDS)[number], string> = {
  cash: "เงินสด",
  bank: "ธนาคาร",
  ewallet: "e-wallet",
  other: "อื่น ๆ",
};

export const accountFormSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อบัญชี").max(100),
  kind: z.enum(ACCOUNT_KINDS),
  openingBalance: z.coerce.number().finite("จำนวนเงินไม่ถูกต้อง"),
  color: z.string().min(1, "กรุณาเลือกสี"),
  icon: z.string().min(1, "กรุณาเลือกไอคอน"),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;
