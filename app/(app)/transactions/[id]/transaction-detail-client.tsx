"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { ArrowLeft, ArrowLeftRight, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format/money";
import { formatThaiDateLong, formatThaiTime } from "@/lib/format/date";
import { getSignedAttachmentUrls } from "@/lib/upload/attachments";
import { transactionTypeLabels } from "@/lib/validation/transaction";
import type { Database } from "@/lib/supabase/database.types";
import { useAppData } from "@/components/transactions/app-data-context";
import { softDeleteTransactionAction } from "../actions";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type Account = Database["public"]["Tables"]["accounts"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Attachment = Database["public"]["Tables"]["attachments"]["Row"];

export function TransactionDetailClient({
  transaction,
  accounts,
  categories,
  profiles,
  attachments,
}: {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
  profiles: Profile[];
  attachments: Attachment[];
}) {
  const router = useRouter();
  const { quickAdd } = useAppData();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (attachments.length === 0) return;
    getSignedAttachmentUrls(attachments.map((a) => a.storage_path)).then(setSignedUrls);
  }, [attachments]);

  const account = accounts.find((a) => a.id === transaction.account_id);
  const toAccount = accounts.find((a) => a.id === transaction.to_account_id);
  const category = categories.find((c) => c.id === transaction.category_id);
  const contributor = profiles.find((p) => p.id === transaction.contributor_profile_id);
  const beneficiary = profiles.find((p) => p.id === transaction.beneficiary_profile_id);
  const createdBy = profiles.find((p) => p.id === transaction.created_by);
  const updatedBy = profiles.find((p) => p.id === transaction.updated_by);

  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";
  const amountColor = isIncome ? "text-green-600" : isExpense ? "text-red-600" : "text-muted-foreground";
  const amountSign = isIncome ? "+" : isExpense ? "-" : "";

  async function handleDelete() {
    const result = await softDeleteTransactionAction(transaction.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("ลบรายการแล้ว");
    router.push("/transactions");
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/transactions">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">รายละเอียดรายการ</h1>
      </div>

      <div className="flex flex-col items-center gap-2 rounded-xl border py-6">
        <div
          className="flex size-14 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: category?.color ?? "#6b7280" }}
        >
          {transaction.type === "transfer" ? (
            <ArrowLeftRight className="size-6" />
          ) : (
            <DynamicIcon name={(category?.icon ?? "circle-plus") as IconName} className="size-6" />
          )}
        </div>
        <p className={`text-3xl font-semibold ${amountColor}`}>
          {amountSign}
          {formatMoney(transaction.amount)}
        </p>
        <p className="text-sm text-muted-foreground">
          {transactionTypeLabels[transaction.type]} · {formatThaiDateLong(transaction.occurred_on)}
        </p>
      </div>

      <div className="flex flex-col divide-y rounded-xl border px-4">
        {transaction.type === "transfer" ? (
          <>
            <Field label="จากบัญชี" value={account?.name ?? "-"} />
            <Field label="ไปบัญชี" value={toAccount?.name ?? "-"} />
          </>
        ) : (
          <>
            <Field label="หมวด" value={category?.name ?? "-"} />
            <Field label="บัญชี" value={account?.name ?? "-"} />
          </>
        )}
        {isIncome ? (
          <Field
            label="เงินจากใคร"
            value={contributor?.display_name ?? transaction.contributor_name ?? "ไม่ระบุ"}
          />
        ) : null}
        {isExpense ? (
          <Field label="จ่ายเพื่อใคร" value={beneficiary?.display_name ?? "ไม่ระบุ"} />
        ) : null}
        {transaction.note ? <Field label="หมายเหตุ" value={transaction.note} /> : null}
      </div>

      {attachments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) =>
            signedUrls[attachment.storage_path] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={attachment.id}
                src={signedUrls[attachment.storage_path]}
                alt="แนบ"
                className="size-24 rounded-lg object-cover"
              />
            ) : (
              <div key={attachment.id} className="size-24 animate-pulse rounded-lg bg-muted" />
            )
          )}
        </div>
      ) : null}

      <div className="text-sm text-muted-foreground">
        <p>
          สร้างโดย {createdBy?.display_name ?? "?"} · {formatThaiDateLong(transaction.created_at)}{" "}
          {formatThaiTime(transaction.created_at)}
        </p>
        {transaction.updated_at !== transaction.created_at ? (
          <p>
            แก้ไขล่าสุดโดย {updatedBy?.display_name ?? "?"} ·{" "}
            {formatThaiDateLong(transaction.updated_at)} {formatThaiTime(transaction.updated_at)}
          </p>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="h-11 flex-1"
          onClick={() => quickAdd.openEdit(transaction)}
        >
          <Pencil className="size-4" />
          แก้ไข
        </Button>
        {confirmingDelete ? (
          <Button variant="destructive" className="h-11 flex-1" onClick={handleDelete}>
            ลบเลย?
          </Button>
        ) : (
          <Button
            variant="destructive"
            className="h-11 flex-1"
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 className="size-4" />
            ลบ
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
