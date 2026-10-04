export type AppUsername = "golf" | "gap" | "group";

export interface AppUserDefinition {
  username: AppUsername;
  displayName: string;
  color: string;
}

// The 3 fixed family members (requirement section 2). No sign-up, no invite —
// adding a 4th person later means adding a row here plus re-running the seed script.
export const APP_USERS: AppUserDefinition[] = [
  { username: "golf", displayName: "Golf", color: "#16a34a" },
  { username: "gap", displayName: "Gap", color: "#f97316" },
  { username: "group", displayName: "Group", color: "#9333ea" },
];

export function isAppUsername(value: string): value is AppUsername {
  return APP_USERS.some((user) => user.username === value);
}
