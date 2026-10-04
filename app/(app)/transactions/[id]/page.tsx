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

  const [{ data: transaction }, { data: accounts }, { data: categories }, { data: profiles }, { data: attachments }] =
    await Promise.all([
      supabase.from("transactions").select("*").eq("id", id).maybeSingle(),
      supabase.from("accounts").select("*"),
      supabase.from("categories").select("*"),
      supabase.from("profiles").select("*"),
      supabase.from("attachments").select("*").eq("transaction_id", id),
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
    />
  );
}
