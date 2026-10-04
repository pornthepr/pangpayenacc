"use client";

import { useState, useTransition } from "react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { ArrowUp, ArrowDown, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { accountKindLabels } from "@/lib/validation/account";
import { formatMoney } from "@/lib/format/money";
import type { Database } from "@/lib/supabase/database.types";
import { AccountFormSheet } from "./account-form-sheet";
import { setAccountArchivedAction, deleteAccountAction, moveAccountAction } from "./actions";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

export function AccountRow({
  account,
  balance,
  isFirst,
  isLast,
}: {
  account: Account;
  balance: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAccountAction(account.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("ลบบัญชีแล้ว");
      }
      setConfirmingDelete(false);
    });
  }

  return (
    <div className="flex flex-col gap-2 border-b py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: account.color ?? "#6b7280" }}
        >
          <DynamicIcon name={(account.icon ?? "wallet") as IconName} className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{account.name}</p>
          <p className="text-sm text-muted-foreground">
            {accountKindLabels[account.kind]} · {formatMoney(balance)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {!account.is_archived ? (
          <>
            <Button
              variant="ghost"
              className="size-11"
              disabled={isFirst || isPending}
              onClick={() => startTransition(() => moveAccountAction(account.id, "up"))}
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              variant="ghost"
              className="size-11"
              disabled={isLast || isPending}
              onClick={() => startTransition(() => moveAccountAction(account.id, "down"))}
            >
              <ArrowDown className="size-4" />
            </Button>
          </>
        ) : null}

        <AccountFormSheet
          account={account}
          trigger={
            <Button variant="ghost" className="size-11">
              <Pencil className="size-4" />
            </Button>
          }
        />

        <Button
          variant="ghost"
          className="size-11"
          disabled={isPending}
          onClick={() =>
            startTransition(() => setAccountArchivedAction(account.id, !account.is_archived))
          }
        >
          {account.is_archived ? (
            <ArchiveRestore className="size-4" />
          ) : (
            <Archive className="size-4" />
          )}
        </Button>

        {confirmingDelete ? (
          <Button
            variant="destructive"
            className="h-11"
            disabled={isPending}
            onClick={handleDelete}
          >
            ลบเลย?
          </Button>
        ) : (
          <Button variant="ghost" className="size-11" onClick={() => setConfirmingDelete(true)}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
