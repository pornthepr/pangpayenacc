import Link from "next/link";
import { Wallet, Tags, Download, Trash2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { ChangePasswordForm } from "./change-password-form";
import { LogoutButton } from "./logout-button";

const LINKS = [
  { icon: Wallet, label: "จัดการบัญชี", href: "/settings/accounts" },
  { icon: Tags, label: "จัดการหมวดหมู่", href: "/settings/categories" },
];

const UPCOMING_ITEMS = [
  { icon: Download, label: "ส่งออก CSV" },
  { icon: Trash2, label: "ถังขยะ" },
];

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">ตั้งค่า</h1>

      {profile ? (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div
              className="flex size-12 items-center justify-center rounded-full text-lg font-semibold text-white"
              style={{ backgroundColor: profile.color }}
            >
              {profile.display_name[0]}
            </div>
            <div>
              <p className="font-medium">{profile.display_name}</p>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">เปลี่ยนรหัสผ่าน</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col divide-y pt-6">
          {LINKS.map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              className="flex min-h-11 items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <Icon className="size-5" />
              <span>{label}</span>
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </Link>
          ))}
          {UPCOMING_ITEMS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 py-3 text-muted-foreground first:pt-0 last:pb-0"
            >
              <Icon className="size-5" />
              <span>{label}</span>
              <span className="ml-auto text-xs">เร็วๆ นี้</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />
      <LogoutButton />
    </div>
  );
}
