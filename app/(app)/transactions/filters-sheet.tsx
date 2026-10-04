"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListFilter } from "lucide-react";
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
import { TRANSACTION_TYPES, transactionTypeLabels } from "@/lib/validation/transaction";
import { useAppData } from "@/components/transactions/app-data-context";

const FILTER_KEYS = ["type", "accountId", "categoryId", "enteredBy", "from", "to", "q"] as const;

export function FiltersSheet() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accounts, categories, profiles } = useAppData();
  const [open, setOpen] = useState(false);

  const activeCount = FILTER_KEYS.filter((key) => searchParams.get(key)).length;

  function apply(formData: FormData) {
    const params = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const value = formData.get(key);
      if (value) params.set(key, String(value));
    }
    router.push(`/transactions${params.toString() ? `?${params.toString()}` : ""}`);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-11">
          <ListFilter className="size-4" />
          ตัวกรอง{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>ตัวกรองรายการ</SheetTitle>
        </SheetHeader>

        <form
          action={apply}
          className="flex flex-col gap-4 px-4 pb-4"
        >
          <div className="flex flex-col gap-2">
            <Label>ประเภท</Label>
            <select
              name="type"
              defaultValue={searchParams.get("type") ?? ""}
              className="h-11 rounded-md border bg-background px-3 text-base"
            >
              <option value="">ทั้งหมด</option>
              {TRANSACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {transactionTypeLabels[type]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>บัญชี</Label>
            <select
              name="accountId"
              defaultValue={searchParams.get("accountId") ?? ""}
              className="h-11 rounded-md border bg-background px-3 text-base"
            >
              <option value="">ทั้งหมด</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>หมวด</Label>
            <select
              name="categoryId"
              defaultValue={searchParams.get("categoryId") ?? ""}
              className="h-11 rounded-md border bg-background px-3 text-base"
            >
              <option value="">ทั้งหมด</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>ผู้กรอก</Label>
            <select
              name="enteredBy"
              defaultValue={searchParams.get("enteredBy") ?? ""}
              className="h-11 rounded-md border bg-background px-3 text-base"
            >
              <option value="">ทั้งหมด</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="from">ตั้งแต่วันที่</Label>
              <Input
                id="from"
                name="from"
                type="date"
                defaultValue={searchParams.get("from") ?? ""}
                className="h-11 text-base"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="to">ถึงวันที่</Label>
              <Input
                id="to"
                name="to"
                type="date"
                defaultValue={searchParams.get("to") ?? ""}
                className="h-11 text-base"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="q">ค้นหาจากหมายเหตุ</Label>
            <Input
              id="q"
              name="q"
              defaultValue={searchParams.get("q") ?? ""}
              className="h-11 text-base"
            />
          </div>

          <SheetFooter className="flex-row gap-2 px-0">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1"
              onClick={() => {
                router.push("/transactions");
                setOpen(false);
              }}
            >
              ล้างตัวกรอง
            </Button>
            <Button type="submit" className="h-11 flex-1">
              แสดงผล
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
