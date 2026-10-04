"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function restoreTransactionAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("restore_transaction", { p_id: id });

  if (error) {
    return { error: "กู้คืนไม่สำเร็จ กรุณาลองใหม่" };
  }

  revalidatePath("/settings/trash");
  revalidatePath("/transactions");
  revalidatePath("/");
  return {};
}
