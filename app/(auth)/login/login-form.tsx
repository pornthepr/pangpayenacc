"use client";

import { useActionState, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_USERS, type AppUsername } from "@/lib/constants/profiles";
import { signInAction, type SignInState } from "./actions";

const initialState: SignInState = {};

export function LoginForm() {
  const [selected, setSelected] = useState<AppUsername | null>(null);
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  if (!selected) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-center text-sm text-muted-foreground">เลือกชื่อของคุณ</p>
        {APP_USERS.map((user) => (
          <button
            key={user.username}
            type="button"
            onClick={() => setSelected(user.username)}
            className="flex min-h-16 items-center justify-center rounded-xl text-lg font-semibold text-white shadow-sm transition active:scale-[0.98]"
            style={{ backgroundColor: user.color }}
          >
            {user.displayName}
          </button>
        ))}
      </div>
    );
  }

  const user = APP_USERS.find((item) => item.username === selected)!;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="username" value={selected} />
      <button
        type="button"
        onClick={() => setSelected(null)}
        className="flex items-center gap-1 self-start text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        เปลี่ยนคนอื่น
      </button>

      <div
        className="flex min-h-16 items-center justify-center rounded-xl text-lg font-semibold text-white"
        style={{ backgroundColor: user.color }}
      >
        {user.displayName}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">รหัสผ่าน</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoFocus
          required
          minLength={6}
          className="h-11 text-base"
        />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="h-11 text-base">
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        เข้าสู่ระบบ
      </Button>
    </form>
  );
}
