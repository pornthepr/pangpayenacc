import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// This app has no separate staging project — "the database" is wherever
// .env.local points, which may be real family data (see README). Every piece
// of data this test creates is prefixed "E2E_TEST" and removed by its own
// prior cleanup + a final afterAll, scoped by that exact prefix only. Never
// widen the cleanup queries below to an unscoped delete.
const TEST_MARK = "E2E_TEST";
const USERNAME = process.env.E2E_USERNAME ?? "golf";
const PASSWORD = process.env.E2E_PASSWORD ?? "golf1234";
const DISPLAY_NAME = USERNAME[0].toUpperCase() + USERNAME.slice(1);

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY must be set to run e2e tests " +
        "(run via: pnpm test:e2e, which loads .env.local)"
    );
  }
  return createClient(url, key);
}

async function cleanupTestData() {
  const supabase = adminClient();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id")
    .ilike("name", `${TEST_MARK}%`);
  for (const account of accounts ?? []) {
    await supabase.from("transactions").delete().eq("account_id", account.id);
    await supabase.from("accounts").delete().eq("id", account.id);
  }
}

test.describe("main mobile flow", () => {
  test.beforeAll(async () => {
    await cleanupTestData();
    const supabase = adminClient();
    await supabase.from("accounts").insert({
      name: `${TEST_MARK}-บัญชีทดสอบ`,
      kind: "cash",
      opening_balance: 1000,
      sort_order: 999,
    });
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test("login, record an expense, see it in the list, then delete it", async ({ page }) => {
    await page.goto("/login");
    await page.getByText(DISPLAY_NAME, { exact: true }).click();
    await page.locator("#password").fill(PASSWORD);
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    await expect(page).toHaveURL("/");

    // Quick add: FAB -> category -> account -> save (the "3 taps" flow).
    await page.getByRole("button", { name: "เพิ่มรายการ" }).click();
    await page.locator("#amount").waitFor();
    await page.locator("#amount").fill("123");
    await page.getByRole("button", { name: "อื่น ๆ" }).first().click();
    await page.getByRole("button", { name: `${TEST_MARK}-บัญชีทดสอบ` }).click();
    await page.getByRole("button", { name: "บันทึก", exact: true }).click();
    await page.locator("#amount").waitFor({ state: "detached" });

    // It shows up in the list.
    await page.goto("/transactions");
    const row = page.getByText(`${TEST_MARK}-บัญชีทดสอบ`).first();
    await expect(row).toBeVisible();

    // Open detail and delete it again, leaving no residue behind.
    await page.getByText("อื่น ๆ").first().click();
    await expect(page).toHaveURL(/\/transactions\/.+/);
    await page.getByRole("button", { name: "ลบ", exact: true }).click();
    await page.getByRole("button", { name: "ลบเลย?" }).click();
    await expect(page).toHaveURL("/transactions");
  });
});
