// Resets one user's password back to a known value (for when they forget it —
// there is no self-service email reset, see requirement section 2).
//
// Usage: pnpm reset:password <username> [newPassword]
// Requires (in .env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY

import { createClient } from "@supabase/supabase-js";
import { isAppUsername } from "../lib/constants/profiles";
import { usernameToEmail } from "../lib/auth/username-email";

const DEFAULT_PASSWORDS: Record<string, string> = {
  golf: "golf1234",
  gap: "gap1234",
  group: "group1234",
  mom: "111111",
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const [username, passwordArg] = process.argv.slice(2);

  if (!username || !isAppUsername(username)) {
    console.error("Usage: pnpm reset:password <golf|gap|group|mom> [newPassword]");
    process.exit(1);
  }

  const newPassword = passwordArg ?? DEFAULT_PASSWORDS[username];
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const secretKey = requireEnv("SUPABASE_SECRET_KEY");

  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    console.error(`User "${username}" not found. Run "pnpm seed:users" first.`);
    process.exit(1);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  });

  if (updateError) {
    console.error("Failed to reset password:", updateError);
    process.exit(1);
  }

  await supabase.from("profiles").update({ password_changed_at: null }).eq("id", profile.id);

  console.log(`- ${username} (${usernameToEmail(username)}): password reset to "${newPassword}"`);
}

main();
