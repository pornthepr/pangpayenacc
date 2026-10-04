import Link from "next/link";
import { ArrowLeft, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { createClient } from "@/lib/supabase/server";
import { AccountFormSheet } from "./account-form-sheet";
import { AccountRow } from "./account-row";

export default async function AccountsPage() {
  const supabase = await createClient();
  const [{ data: accounts }, { data: balances }] = await Promise.all([
    supabase.from("accounts").select("*").order("sort_order", { ascending: true }),
    supabase.from("v_account_balances").select("*"),
  ]);

  const balanceByAccountId = new Map((balances ?? []).map((b) => [b.account_id, b.balance]));
  const active = (accounts ?? []).filter((a) => !a.is_archived);
  const archived = (accounts ?? []).filter((a) => a.is_archived);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/settings">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">จัดการบัญชี</h1>
      </div>

      <AccountFormSheet
        trigger={
          <Button className="h-11 w-full">
            <Plus className="size-4" />
            เพิ่มบัญชี
          </Button>
        }
      />

      {active.length === 0 && archived.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="ยังไม่มีบัญชี"
          description="กดเพิ่มบัญชีด้านบนเพื่อสร้างบัญชีแรกของครอบครัว"
        />
      ) : null}

      {active.length > 0 ? (
        <div>
          {active.map((account, index) => (
            <AccountRow
              key={account.id}
              account={account}
              balance={balanceByAccountId.get(account.id) ?? account.opening_balance}
              isFirst={index === 0}
              isLast={index === active.length - 1}
            />
          ))}
        </div>
      ) : null}

      {archived.length > 0 ? (
        <div>
          <p className="py-2 text-sm text-muted-foreground">ปิดใช้งานแล้ว</p>
          {archived.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              balance={balanceByAccountId.get(account.id) ?? account.opening_balance}
              isFirst
              isLast
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
