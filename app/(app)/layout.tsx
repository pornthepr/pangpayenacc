import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Fab } from "@/components/layout/fab";
import { PasswordReminderBanner } from "@/components/layout/password-reminder-banner";
import { AppDataProvider } from "@/components/transactions/app-data-context";
import { QuickAddSheet } from "@/components/transactions/quick-add-sheet";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  // Middleware already guards this route group; a missing profile here means
  // the auth user exists but the seed script hasn't created its profile row yet.
  if (!profile) {
    redirect("/login");
  }

  const supabase = await createClient();
  const [{ data: accounts }, { data: categories }, { data: profiles }] = await Promise.all([
    supabase.from("accounts").select("*").eq("is_archived", false).order("sort_order"),
    supabase.from("categories").select("*").eq("is_archived", false).order("sort_order"),
    supabase.from("profiles").select("*"),
  ]);

  return (
    <AppDataProvider
      accounts={accounts ?? []}
      categories={categories ?? []}
      profiles={profiles ?? []}
      currentProfileId={profile.id}
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col md:max-w-3xl">
        {!profile.password_changed_at ? <PasswordReminderBanner /> : null}
        {/* Bottom padding clears both the nav bar and the floating FAB above it. */}
        <main className="flex-1 pb-[calc(56px+env(safe-area-inset-bottom)+84px)]">{children}</main>
        <QuickAddSheet />
        <Fab />
        <BottomNav />
      </div>
    </AppDataProvider>
  );
}
