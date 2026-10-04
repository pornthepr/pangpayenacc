"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/forms/color-picker";
import { IconPicker } from "@/components/forms/icon-picker";
import { ACCOUNT_KINDS, accountKindLabels } from "@/lib/validation/account";
import type { Database } from "@/lib/supabase/database.types";
import { upsertAccountAction, type AccountFormState } from "./actions";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

const initialState: AccountFormState = {};

export function AccountFormSheet({
  account,
  trigger,
}: {
  account?: Account;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(account?.color ?? "#3b82f6");
  const [icon, setIcon] = useState(account?.icon ?? "wallet");
  const [state, setState] = useState<AccountFormState>(initialState);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await upsertAccountAction(initialState, formData);
      setState(result);
      if (result.success) {
        toast.success(account ? "แก้ไขบัญชีแล้ว" : "สร้างบัญชีแล้ว");
        setOpen(false);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{account ? "แก้ไขบัญชี" : "สร้างบัญชีใหม่"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4">
          {account ? <input type="hidden" name="id" value={account.id} /> : null}
          <input type="hidden" name="color" value={color} />
          <input type="hidden" name="icon" value={icon} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">ชื่อบัญชี</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={account?.name}
              className="h-11 text-base"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="kind">ประเภท</Label>
            <select
              id="kind"
              name="kind"
              defaultValue={account?.kind ?? "cash"}
              className="h-11 rounded-md border bg-background px-3 text-base"
            >
              {ACCOUNT_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {accountKindLabels[kind]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="openingBalance">ยอดยกมา</Label>
            <Input
              id="openingBalance"
              name="openingBalance"
              type="text"
              inputMode="decimal"
              required
              defaultValue={account?.opening_balance ?? 0}
              className="h-11 text-base"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>สี</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>ไอคอน</Label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="note">หมายเหตุ (ถ้ามี)</Label>
            <Input
              id="note"
              name="note"
              defaultValue={account?.note ?? ""}
              className="h-11 text-base"
            />
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending} className="h-11 w-full text-base">
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              บันทึก
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
