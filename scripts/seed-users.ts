// One-time setup: creates the 3 fixed family accounts (golf/gap/group) in
// Supabase Auth plus their matching `profiles` row. Safe to re-run — existing
// users are left untouched.
//
// Usage: pnpm seed:users
// Requires (in .env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY
// Optional per-user password override: SEED_PASSWORD_GOLF / SEED_PASSWORD_GAP / SEED_PASSWORD_GROUP

import { createClient } from "@supabase/supabase-js";
import { APP_USERS } from "../lib/constants/profiles";
import { usernameToEmail } from "../lib/auth/username-email";

const DEFAULT_PASSWORDS: Record<string, string> = {
  golf: "golf1234",
  gap: "gap1234",
  group: "group1234",
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
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const secretKey = requireEnv("SUPABASE_SECRET_KEY");

  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const user of APP_USERS) {
    const email = usernameToEmail(user.username);
    const password =
      process.env[`SEED_PASSWORD_${user.username.toUpperCase()}`] ??
      DEFAULT_PASSWORDS[user.username];

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", user.username)
      .maybeSingle();

    if (existingProfile) {
      console.log(`- ${user.username}: already exists, skipped`);
      continue;
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      console.error(`- ${user.username}: failed to create auth user`, createError);
      continue;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: created.user.id,
      username: user.username,
      display_name: user.displayName,
      color: user.color,
    });

    if (profileError) {
      console.error(`- ${user.username}: created auth user but failed to insert profile`, profileError);
      continue;
    }

    console.log(`- ${user.username}: created (default password: ${password})`);
  }
}

main();
