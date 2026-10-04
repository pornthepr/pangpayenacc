"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { uploadAttachment, getSignedAttachmentUrls } from "@/lib/upload/attachments";
import { todayISODate, yesterdayISODate } from "@/lib/format/date";
import { transactionTypeLabels, TRANSACTION_TYPES } from "@/lib/validation/transaction";
import type { Database } from "@/lib/supabase/database.types";
import { useAppData } from "./app-data-context";
import { ChipSelect } from "./chip-select";
import {
  createTransactionAction,
  updateTransactionAction,
  getCategoryUsageCountsAction,
} from "@/app/(app)/transactions/actions";

type Attachment = Database["public"]["Tables"]["attachments"]["Row"];
type TransactionType = (typeof TRANSACTION_TYPES)[number];

const LAST_ACCOUNT_KEY = "pangpayenacc:lastAccountId";

export function QuickAddSheet() {
  const { quickAdd } = useAppData();
  const formKey = quickAdd.editingTransaction?.id ?? quickAdd.forcedType ?? "closed";

  return (
    <Sheet open={quickAdd.open} onOpenChange={(next) => !next && quickAdd.close()}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        {quickAdd.open ? <QuickAddForm key={formKey} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function QuickAddForm() {
  const { accounts, categories, profiles, quickAdd } = useAppData();
  const editingTransaction = quickAdd.editingTransaction;
  const isEdit = !!editingTransaction;

  const [selectedType, setSelectedType] = useState<TransactionType>(
    editingTransaction?.type ?? quickAdd.forcedType ?? "expense"
  );
  const [occurredOn, setOccurredOn] = useState(editingTransaction?.occurred_on ?? todayISODate());
  const [showDetails, setShowDetails] = useState(Boolean(editingTransaction?.note));
  const [accountId, setAccountId] = useState(
    editingTransaction?.account_id ??
      (typeof window !== "undefined" ? (localStorage.getItem(LAST_ACCOUNT_KEY) ?? "") : "")
  );
  const [toAccountId, setToAccountId] = useState(editingTransaction?.to_account_id ?? "");
  const [categoryId, setCategoryId] = useState(editingTransaction?.category_id ?? "");
  const [contributorMode, setContributorMode] = useState<"none" | "member" | "external">(
    editingTransaction?.contributor_profile_id
      ? "member"
      : editingTransaction?.contributor_name
        ? "external"
        : "none"
  );
  const [contributorProfileId, setContributorProfileId] = useState(
    editingTransaction?.contributor_profile_id ?? ""
  );
  const [contributorName, setContributorName] = useState(editingTransaction?.contributor_name ?? "");
  const [beneficiaryProfileId, setBeneficiaryProfileId] = useState(
    editingTransaction?.beneficiary_profile_id ?? ""
  );

  const [categoryUsage, setCategoryUsage] = useState<Record<string, number>>({});
  useEffect(() => {
    getCategoryUsageCountsAction().then(setCategoryUsage);
  }, []);

  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!editingTransaction) return;
    const supabase = createClient();
    supabase
      .from("attachments")
      .select("*")
      .eq("transaction_id", editingTransaction.id)
      .then(async ({ data }) => {
        setExistingAttachments(data ?? []);
        setSignedUrls(await getSignedAttachmentUrls((data ?? []).map((a) => a.storage_path)));
      });
  }, [editingTransaction]);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const totalPhotoCount = existingAttachments.length + pendingFiles.length;

  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const incomeCategories = categories
    .filter((c) => c.type === "income" && !c.is_archived)
    .sort((a, b) => (categoryUsage[b.id] ?? 0) - (categoryUsage[a.id] ?? 0) || a.sort_order - b.sort_order);
  const expenseCategories = categories
    .filter((c) => c.type === "expense" && !c.is_archived)
    .sort((a, b) => (categoryUsage[b.id] ?? 0) - (categoryUsage[a.id] ?? 0) || a.sort_order - b.sort_order);
  const visibleCategories = selectedType === "income" ? incomeCategories : expenseCategories;

  function submit(continueAfter: boolean) {
    if (!formRef.current) return;
    setErrorMsg(undefined);

    const formData = new FormData(formRef.current);
    formData.set("type", selectedType);
    formData.set("occurredOn", occurredOn);
    formData.set("accountId", accountId);
    if (selectedType === "transfer") {
      formData.set("toAccountId", toAccountId);
    } else {
      formData.set("categoryId", categoryId);
    }
    if (selectedType === "income") {
      formData.set("contributorProfileId", contributorMode === "member" ? contributorProfileId : "");
      formData.set("contributorName", contributorMode === "external" ? contributorName : "");
    }
    if (selectedType === "expense") {
      formData.set("beneficiaryProfileId", beneficiaryProfileId);
    }
    if (isEdit) formData.set("id", editingTransaction!.id);

    startTransition(async () => {
      const action = isEdit ? updateTransactionAction : createTransactionAction;
      const result = await action({}, formData);

      if (result.error) {
        setErrorMsg(result.error);
        return;
      }

      if (result.transactionId && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          try {
            await uploadAttachment(result.transactionId, file);
          } catch {
            toast.error("แนบรูปไม่สำเร็จบางไฟล์");
          }
        }
      }

      if (accountId) localStorage.setItem(LAST_ACCOUNT_KEY, accountId);
      toast.success(isEdit ? "แก้ไขรายการแล้ว" : "บันทึกรายการแล้ว");
      if (result.warning) toast.warning(result.warning);

      if (continueAfter && !isEdit) {
        setPendingFiles([]);
        setCategoryId("");
        setContributorMode("none");
        setContributorProfileId("");
        setContributorName("");
        setBeneficiaryProfileId("");
        formRef.current?.reset();
        formRef.current?.querySelector<HTMLInputElement>("#amount")?.focus();
      } else {
        quickAdd.close();
      }
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - totalPhotoCount);
    setPendingFiles((prev) => [...prev, ...files].slice(0, 3));
    e.target.value = "";
  }

  async function handleRemoveExisting(attachment: Attachment) {
    const supabase = createClient();
    await supabase.storage.from("attachments").remove([attachment.storage_path]);
    await supabase.from("attachments").delete().eq("id", attachment.id);
    setExistingAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{isEdit ? "แก้ไขรายการ" : "เพิ่มรายการ"}</SheetTitle>
      </SheetHeader>

      {!isEdit ? (
        <div className="grid grid-cols-3 gap-2 px-4">
          {TRANSACTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={cn(
                "h-11 rounded-lg border text-sm font-medium",
                selectedType === type ? "border-foreground bg-accent" : "border-border"
              )}
            >
              {transactionTypeLabels[type]}
            </button>
          ))}
        </div>
      ) : (
        <p className="px-4 text-sm text-muted-foreground">
          ประเภท: {transactionTypeLabels[selectedType]}
        </p>
      )}

      <form ref={formRef} onSubmit={(e) => (e.preventDefault(), submit(false))} className="flex flex-col gap-4 px-4 pb-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">จำนวนเงิน</Label>
          <Input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            autoFocus
            required
            placeholder="0.00"
            defaultValue={editingTransaction?.amount ?? ""}
            className="h-16 text-center text-3xl font-semibold"
          />
        </div>

        {selectedType !== "transfer" ? (
          <div className="flex flex-col gap-2">
            <Label>หมวด</Label>
            <div className="grid grid-cols-4 gap-2">
              {visibleCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-2",
                    categoryId === category.id ? "border-foreground bg-accent" : "border-transparent"
                  )}
                >
                  <div
                    className="flex size-10 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: category.color ?? "#6b7280" }}
                  >
                    <DynamicIcon
                      name={(category.icon ?? "circle-plus") as IconName}
                      className="size-5"
                    />
                  </div>
                  <span className="line-clamp-1 text-xs">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label>{selectedType === "transfer" ? "บัญชีต้นทาง" : "บัญชี"}</Label>
          <ChipSelect
            options={accounts
              .filter((a) => a.id !== toAccountId || selectedType !== "transfer")
              .map((a) => ({ id: a.id, label: a.name, color: a.color }))}
            value={accountId}
            onChange={setAccountId}
          />
        </div>

        {selectedType === "transfer" ? (
          <div className="flex flex-col gap-2">
            <Label>บัญชีปลายทาง</Label>
            <ChipSelect
              options={accounts
                .filter((a) => a.id !== accountId)
                .map((a) => ({ id: a.id, label: a.name, color: a.color }))}
              value={toAccountId}
              onChange={setToAccountId}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="occurredOn">วันที่</Label>
          <div className="flex gap-2">
            <Input
              id="occurredOn"
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              className="h-11 flex-1 text-base"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => setOccurredOn(yesterdayISODate())}
            >
              เมื่อวาน
            </Button>
          </div>
        </div>

        {selectedType === "income" ? (
          <div className="flex flex-col gap-2">
            <Label>เงินจากใคร</Label>
            <div className="flex flex-wrap gap-2">
              <ModeChip
                label="ไม่ระบุ"
                active={contributorMode === "none"}
                onClick={() => setContributorMode("none")}
              />
              {profiles.map((p) => (
                <ModeChip
                  key={p.id}
                  label={p.display_name}
                  color={p.color}
                  active={contributorMode === "member" && contributorProfileId === p.id}
                  onClick={() => {
                    setContributorMode("member");
                    setContributorProfileId(p.id);
                  }}
                />
              ))}
              <ModeChip
                label="คนอื่น"
                active={contributorMode === "external"}
                onClick={() => setContributorMode("external")}
              />
            </div>
            {contributorMode === "external" ? (
              <Input
                placeholder="ชื่อ"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                className="h-11 text-base"
              />
            ) : null}
          </div>
        ) : null}

        {selectedType === "expense" ? (
          <div className="flex flex-col gap-2">
            <Label>จ่ายเพื่อใคร</Label>
            <div className="flex flex-wrap gap-2">
              <ModeChip
                label="ไม่ระบุ"
                active={!beneficiaryProfileId}
                onClick={() => setBeneficiaryProfileId("")}
              />
              {profiles.map((p) => (
                <ModeChip
                  key={p.id}
                  label={p.display_name}
                  color={p.color}
                  active={beneficiaryProfileId === p.id}
                  onClick={() => setBeneficiaryProfileId(p.id)}
                />
              ))}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="text-left text-sm text-muted-foreground underline underline-offset-2"
        >
          {showDetails ? "ซ่อนรายละเอียด" : "เพิ่มรายละเอียด"}
        </button>

        {showDetails ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="note">หมายเหตุ</Label>
              <Input
                id="note"
                name="note"
                defaultValue={editingTransaction?.note ?? ""}
                className="h-11 text-base"
              />
            </div>

            {selectedType !== "transfer" ? (
              <div className="flex flex-col gap-2">
                <Label>รูปแนบ (สูงสุด 3 รูป)</Label>
                <div className="flex flex-wrap gap-2">
                  {existingAttachments.map((attachment) => (
                    <div key={attachment.id} className="relative size-20">
                      {signedUrls[attachment.storage_path] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={signedUrls[attachment.storage_path]}
                          alt="แนบ"
                          className="size-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="size-20 animate-pulse rounded-lg bg-muted" />
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveExisting(attachment)}
                        className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-foreground text-background"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {pendingFiles.map((file, index) => (
                    <div key={index} className="relative size-20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt="แนบ"
                        className="size-20 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPendingFiles((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-foreground text-background"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {totalPhotoCount < 3 ? (
                    <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground">
                      <Camera className="size-5" />
                      <span className="text-xs">แนบรูป</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {errorMsg ? <p className="text-sm text-destructive">{errorMsg}</p> : null}

        <SheetFooter className="px-0">
          <Button type="submit" disabled={pending} className="h-11 w-full text-base">
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            บันทึก
          </Button>
          {!isEdit ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => submit(true)}
              className="h-11 w-full text-base"
            >
              บันทึกแล้วกรอกต่อ
            </Button>
          ) : null}
        </SheetFooter>
      </form>
    </>
  );
}

function ModeChip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color?: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 items-center gap-1.5 rounded-full border px-3 text-sm",
        active ? "border-foreground bg-accent font-medium" : "border-border bg-background"
      )}
    >
      {color ? <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} /> : null}
      {label}
    </button>
  );
}
