export type AppUsername = "golf" | "gap" | "group" | "mom";

export interface AppUserDefinition {
  username: AppUsername;
  displayName: string;
  color: string;
}

// The fixed family members (requirement section 2, extended with "mom" on
// request). No sign-up, no invite — adding another person later means adding
// a row here plus re-running the seed script.
export const APP_USERS: AppUserDefinition[] = [
  { username: "golf", displayName: "Golf", color: "#16a34a" },
  { username: "gap", displayName: "Gap", color: "#f97316" },
  { username: "group", displayName: "Group", color: "#9333ea" },
  { username: "mom", displayName: "แม่ไก่", color: "#ec4899" },
];

export function isAppUsername(value: string): value is AppUsername {
  return APP_USERS.some((user) => user.username === value);
}
