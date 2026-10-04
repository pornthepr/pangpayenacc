"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "./actions";

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" className="h-11 w-full text-base">
        <LogOut className="size-4" />
        ออกจากระบบ
      </Button>
    </form>
  );
}
