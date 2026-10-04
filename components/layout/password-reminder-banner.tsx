import Link from "next/link";
import { TriangleAlert } from "lucide-react";

export function PasswordReminderBanner() {
  return (
    <Link
      href="/settings"
      className="flex items-center gap-2 bg-amber-100 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
    >
      <TriangleAlert className="size-4 shrink-0" />
      ยังใช้รหัสผ่านเริ่มต้นอยู่ แตะเพื่อเปลี่ยนรหัสผ่าน
    </Link>
  );
}
