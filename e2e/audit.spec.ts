import { test, expect } from "@playwright/test";
import { loginViaStorage } from "./utils/auth";

test("MONITOR can view and filter the audit log", async ({ page }) => {
  await loginViaStorage(page, "MONITOR");
  await page.goto("/audit");
  await expect(page).toHaveURL(/\/audit$/);

  await expect(page.getByText("Description").first()).toBeVisible();

  const selects = page.locator("select");
  await expect(selects.first()).toBeVisible();

  // Menu filter, then Action filter — should not error, list may become empty.
  await selects.nth(0).selectOption({ label: "Customers" });
  await selects.nth(1).selectOption({ label: "Create" });
  await expect(page.getByText("Description").first()).toBeVisible();
});

test("TECHNICIAN cannot navigate to /audit (no sidebar link, guard elsewhere)", async ({ page }) => {
  await loginViaStorage(page, "TECHNICIAN");
  await expect(page.getByRole("link", { name: "Audit Logs" })).toHaveCount(0);
});
