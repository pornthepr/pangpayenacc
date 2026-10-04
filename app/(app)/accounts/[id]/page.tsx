import Link from "next/link";
import { notFound } from "next/navigation";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format/money";
import { todayISODateBangkok, bangkokDateDaysAgo } from "@/lib/format/date";
import { accountKindLabels } from "@/lib/validation/account";
import { DailyBalanceChart } from "@/components/charts/daily-balance-chart";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const to = todayISODateBangkok();
  const from = bangkokDateDaysAgo(29);

  const [{ data: account }, { data: balanceRow }, { data: dailyBalance }] = await Promise.all([
    supabase.from("accounts").select("*").eq("id", id).maybeSingle(),
    supabase.from("v_account_balances").select("*").eq("account_id", id).maybeSingle(),
    supabase.rpc("rpc_daily_balance", { p_account_id: id, p_from: from, p_to: to }),
  ]);

  if (!account) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">{account.name}</h1>
      </div>

      <div className="flex flex-col items-center gap-2 rounded-xl border py-6">
        <div
          className="flex size-14 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: account.color ?? "#6b7280" }}
        >
          <DynamicIcon name={(account.icon ?? "wallet") as IconName} className="size-6" />
        </div>
        <p className="text-3xl font-semibold">
          {formatMoney(balanceRow?.balance ?? account.opening_balance)}
        </p>
        <p className="text-sm text-muted-foreground">{accountKindLabels[account.kind]}</p>
      </div>

      {/* Placed before the chart, not after — a short page's last element can
          land directly under the floating FAB, which stays fixed above the
          bottom nav no matter how little content the page has. */}
      <Button variant="outline" className="h-11" asChild>
        <Link href={`/transactions?accountId=${id}`}>ดูรายการของบัญชีนี้</Link>
      </Button>

      <div className="flex flex-col gap-2">
        <h2 className="font-medium">ยอดคงเหลือ 30 วันล่าสุด</h2>
        <DailyBalanceChart data={dailyBalance ?? []} />
      </div>
    </div>
  );
}
