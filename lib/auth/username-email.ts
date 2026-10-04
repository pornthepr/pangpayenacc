const INTERNAL_EMAIL_DOMAIN = process.env.INTERNAL_EMAIL_DOMAIN ?? "family.local";

// Supabase Auth only speaks email+password; the UI only ever shows usernames.
export function usernameToEmail(username: string): string {
  return `${username}@${INTERNAL_EMAIL_DOMAIN}`;
}
