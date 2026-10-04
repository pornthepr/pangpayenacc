import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type TransactionType = Database["public"]["Tables"]["transactions"]["Row"]["type"];

export interface TransactionFilterParams {
  type?: string;
  accountId?: string;
  categoryId?: string;
  enteredBy?: string;
  from?: string;
  to?: string;
  q?: string;
}

// Shared by the transactions list page and the CSV export route, so both
// always agree on what "the current filter" means.
export function applyTransactionFilters(
  supabase: SupabaseClient<Database>,
  params: TransactionFilterParams
) {
  let query = supabase
    .from("transactions")
    .select("*")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (params.type) query = query.eq("type", params.type as TransactionType);
  if (params.accountId) {
    query = query.or(`account_id.eq.${params.accountId},to_account_id.eq.${params.accountId}`);
  }
  if (params.categoryId) query = query.eq("category_id", params.categoryId);
  if (params.enteredBy) query = query.eq("created_by", params.enteredBy);
  if (params.from) query = query.gte("occurred_on", params.from);
  if (params.to) query = query.lte("occurred_on", params.to);
  if (params.q) query = query.ilike("note", `%${params.q}%`);

  return query;
}
