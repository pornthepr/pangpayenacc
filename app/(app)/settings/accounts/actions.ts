"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { accountFormSchema } from "@/lib/validation/account";

export interface AccountFormState {
  error?: string;
  success?: boolean;
}

function parseFormData(formData: FormData) {
  return accountFormSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    openingBalance: formData.get("openingBalance"),
    color: formData.get("color"),
    icon: formData.get("icon"),
    note: formData.get("note"),
  });
}

export async function upsertAccountAction(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const id = formData.get("id");
  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const supabase = await createClient();
  const payload = {
    name: parsed.data.name,
    kind: parsed.data.kind,
    opening_balance: parsed.data.openingBalance,
    color: parsed.data.color,
    icon: parsed.data.icon,
    note: parsed.data.note || null,
  };

  const { error } =
    typeof id === "string" && id
      ? await supabase.from("accounts").update(payload).eq("id", id)
      : await supabase.from("accounts").insert(payload);

  if (error) {
    return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" };
  }

  revalidatePath("/settings/accounts");
  revalidatePath("/");
  return { success: true };
}

export async function setAccountArchivedAction(id: string, isArchived: boolean) {
  const supabase = await createClient();
  await supabase.from("accounts").update({ is_archived: isArchived }).eq("id", id);
  revalidatePath("/settings/accounts");
  revalidatePath("/");
}

export async function deleteAccountAction(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .or(`account_id.eq.${id},to_account_id.eq.${id}`);

  if (count && count > 0) {
    return { error: "บัญชีนี้มีรายการแล้ว ลบไม่ได้ ใช้ปิดใช้งานแทน" };
  }

  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) {
    return { error: "ลบไม่สำเร็จ กรุณาลองใหม่" };
  }

  revalidatePath("/settings/accounts");
  revalidatePath("/");
  return {};
}

export async function moveAccountAction(id: string, direction: "up" | "down") {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, sort_order")
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });

  if (!accounts) return;

  const index = accounts.findIndex((a) => a.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= accounts.length) return;

  const current = accounts[index];
  const swapWith = accounts[swapIndex];

  await Promise.all([
    supabase.from("accounts").update({ sort_order: swapWith.sort_order }).eq("id", current.id),
    supabase.from("accounts").update({ sort_order: current.sort_order }).eq("id", swapWith.id),
  ]);

  revalidatePath("/settings/accounts");
}
