"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { transactionFormSchema, type TransactionFormValues } from "@/lib/validation/transaction";
import type { Database } from "@/lib/supabase/database.types";

type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

function toRow(data: TransactionFormValues): TransactionInsert {
  return {
    type: data.type,
    amount: data.amount,
    occurred_on: data.occurredOn,
    account_id: data.accountId,
    note: data.note || null,
    to_account_id: data.type === "transfer" ? data.toAccountId : null,
    category_id: data.type !== "transfer" ? data.categoryId : null,
    contributor_profile_id: data.type === "income" ? data.contributorProfileId || null : null,
    contributor_name: data.type === "income" ? data.contributorName || null : null,
    beneficiary_profile_id: data.type === "expense" ? data.beneficiaryProfileId || null : null,
  };
}

export interface TransactionFormState {
  error?: string;
  warning?: string;
  success?: boolean;
  transactionId?: string;
}

function parseFormData(formData: FormData) {
  const type = formData.get("type");
  return transactionFormSchema.safeParse({
    type,
    amount: formData.get("amount"),
    occurredOn: formData.get("occurredOn"),
    note: formData.get("note") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    accountId: formData.get("accountId") || undefined,
    toAccountId: formData.get("toAccountId") || undefined,
    contributorProfileId: formData.get("contributorProfileId") || undefined,
    contributorName: formData.get("contributorName") || undefined,
    beneficiaryProfileId: formData.get("beneficiaryProfileId") || undefined,
  });
}

async function checkNegativeBalance(accountId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_account_balances")
    .select("balance")
    .eq("account_id", accountId)
    .single();

  if (data && data.balance < 0) {
    return "ยอดคงเหลือบัญชีติดลบแล้ว";
  }
  return undefined;
}

function revalidateAll(transactionId?: string) {
  revalidatePath("/transactions");
  revalidatePath("/");
  revalidatePath("/settings/accounts");
  if (transactionId) revalidatePath(`/transactions/${transactionId}`);
}

export async function createTransactionAction(
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert(toRow(data))
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" };
  }

  const warning = data.type === "expense" ? await checkNegativeBalance(data.accountId) : undefined;

  revalidateAll(inserted.id);
  return { success: true, transactionId: inserted.id, warning };
}

export async function updateTransactionAction(
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "ไม่พบรายการ" };
  }

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").update(toRow(data)).eq("id", id);
  if (error) {
    return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" };
  }

  const warning = data.type === "expense" ? await checkNegativeBalance(data.accountId) : undefined;

  revalidateAll(id);
  return { success: true, transactionId: id, warning };
}

export async function getCategoryUsageCountsAction(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data } = await supabase
    .from("transactions")
    .select("category_id")
    .eq("created_by", user.id)
    .not("category_id", "is", null);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (!row.category_id) continue;
    counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }
  return counts;
}

export async function softDeleteTransactionAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("soft_delete_transaction", { p_id: id });

  if (error) {
    return { error: "ลบไม่สำเร็จ กรุณาลองใหม่" };
  }

  revalidateAll(id);
  return {};
}
