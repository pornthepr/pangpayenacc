import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TransactionDetailClient } from "./transaction-detail-client";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: transaction },
    { data: accounts },
    { data: categories },
    { data: profiles },
    { data: attachments },
    { data: auditLogs },
  ] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", id).maybeSingle(),
    supabase.from("accounts").select("*"),
    supabase.from("categories").select("*"),
    supabase.from("profiles").select("*"),
    supabase.from("attachments").select("*").eq("transaction_id", id),
    supabase
      .from("audit_logs")
      .select("*")
      .eq("table_name", "transactions")
      .eq("record_id", id)
      .order("at", { ascending: true }),
  ]);

  if (!transaction) {
    notFound();
  }

  return (
    <TransactionDetailClient
      transaction={transaction}
      accounts={accounts ?? []}
      categories={categories ?? []}
      profiles={profiles ?? []}
      attachments={attachments ?? []}
      auditLogs={auditLogs ?? []}
    />
  );
}
