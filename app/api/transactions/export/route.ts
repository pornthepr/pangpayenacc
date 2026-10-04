import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyTransactionFilters } from "@/lib/transactions/filtered-query";
import { transactionTypeLabels } from "@/lib/validation/transaction";
import { todayISODateBangkok } from "@/lib/format/date";

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const supabase = await createClient();

  const [{ data: transactions }, { data: accounts }, { data: categories }, { data: profiles }] =
    await Promise.all([
      applyTransactionFilters(supabase, params),
      supabase.from("accounts").select("*"),
      supabase.from("categories").select("*"),
      supabase.from("profiles").select("*"),
    ]);

  const accountsById = new Map((accounts ?? []).map((a) => [a.id, a]));
  const categoriesById = new Map((categories ?? []).map((c) => [c.id, c]));
  const profilesById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const header = [
    "วันที่",
    "ประเภท",
    "หมวด",
    "บัญชี",
    "บัญชีปลายทาง",
    "จำนวนเงิน",
    "เงินจากใคร",
    "จ่ายเพื่อใคร",
    "หมายเหตุ",
    "ผู้กรอก",
  ];

  const rows = (transactions ?? []).map((tx) => {
    const category = tx.category_id ? categoriesById.get(tx.category_id) : null;
    const account = accountsById.get(tx.account_id);
    const toAccount = tx.to_account_id ? accountsById.get(tx.to_account_id) : null;
    const contributor = tx.contributor_profile_id
      ? profilesById.get(tx.contributor_profile_id)?.display_name
      : tx.contributor_name;
    const beneficiary = tx.beneficiary_profile_id
      ? profilesById.get(tx.beneficiary_profile_id)?.display_name
      : null;
    const enteredBy = tx.created_by ? profilesById.get(tx.created_by)?.display_name : null;

    return [
      tx.occurred_on,
      transactionTypeLabels[tx.type],
      category?.name ?? "",
      account?.name ?? "",
      toAccount?.name ?? "",
      tx.amount,
      contributor ?? "",
      beneficiary ?? "",
      tx.note ?? "",
      enteredBy ?? "",
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  // BOM so Excel detects UTF-8 and renders Thai correctly instead of mojibake.
  const body = "﻿" + csv;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transactions-${todayISODateBangkok()}.csv"`,
    },
  });
}
