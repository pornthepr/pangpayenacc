"use client";

import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { ArrowLeftRight } from "lucide-react";
import { formatMoney } from "@/lib/format/money";
import { SwipeableRow } from "./swipeable-row";
import type { Database } from "@/lib/supabase/database.types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type Account = Database["public"]["Tables"]["accounts"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function TransactionRow({
  transaction,
  accountsById,
  categoriesById,
  profilesById,
  onEdit,
  onDelete,
  onTap,
}: {
  transaction: Transaction;
  accountsById: Map<string, Account>;
  categoriesById: Map<string, Category>;
  profilesById: Map<string, Profile>;
  onEdit: () => void;
  onDelete: () => void;
  onTap: () => void;
}) {
  const category = transaction.category_id ? categoriesById.get(transaction.category_id) : null;
  const account = accountsById.get(transaction.account_id);
  const toAccount = transaction.to_account_id ? accountsById.get(transaction.to_account_id) : null;
  const enteredBy = transaction.created_by ? profilesById.get(transaction.created_by) : null;

  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";

  const icon = (category?.icon ?? "arrow-left-right") as IconName;
  const color = category?.color ?? "#6b7280";

  const title = category?.name ?? "โอนเงิน";
  const subtitle = transaction.type === "transfer" ? `${account?.name ?? "?"} → ${toAccount?.name ?? "?"}` : (account?.name ?? "");

  const amountText = isIncome
    ? `+${formatMoney(transaction.amount)}`
    : isExpense
      ? `-${formatMoney(transaction.amount)}`
      : formatMoney(transaction.amount);
  const amountColor = isIncome ? "text-green-600" : isExpense ? "text-red-600" : "text-muted-foreground";

  return (
    <SwipeableRow onEdit={onEdit} onDelete={onDelete} onTap={onTap}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          {transaction.type === "transfer" ? (
            <ArrowLeftRight className="size-5" />
          ) : (
            <DynamicIcon name={icon} className="size-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{title}</p>
          <p className="truncate text-sm text-muted-foreground">
            {subtitle}
            {transaction.note ? ` · ${transaction.note}` : ""}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <p className={`font-semibold ${amountColor}`}>{amountText}</p>
          {enteredBy ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: enteredBy.color }}
              />
              {enteredBy.display_name}
            </span>
          ) : null}
        </div>
      </div>
    </SwipeableRow>
  );
}
