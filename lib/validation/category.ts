import { z } from "zod";

export const CATEGORY_TYPES = ["income", "expense"] as const;

export const categoryTypeLabels: Record<(typeof CATEGORY_TYPES)[number], string> = {
  income: "รายรับ",
  expense: "รายจ่าย",
};

export const categoryFormSchema = z.object({
  type: z.enum(CATEGORY_TYPES),
  name: z.string().trim().min(1, "กรุณากรอกชื่อหมวดหมู่").max(100),
  color: z.string().min(1, "กรุณาเลือกสี"),
  icon: z.string().min(1, "กรุณาเลือกไอคอน"),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
