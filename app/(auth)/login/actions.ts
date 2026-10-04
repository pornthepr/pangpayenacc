"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usernameToEmail } from "@/lib/auth/username-email";
import { isAppUsername } from "@/lib/constants/profiles";

export interface SignInState {
  error?: string;
}

export async function signInAction(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!isAppUsername(username)) {
    return { error: "ไม่พบผู้ใช้นี้" };
  }
  if (!password) {
    return { error: "กรุณากรอกรหัสผ่าน" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error) {
    if (error.code === "over_request_rate_limit") {
      return { error: "ลองรหัสผ่านผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่" };
    }
    return { error: "รหัสผ่านไม่ถูกต้อง" };
  }

  redirect("/");
}
