import { test, expect } from "@playwright/test";
import { loginViaStorage } from "./utils/auth";

// Role -> sidebar items matrix discovered by reading Sidebar.tsx's menuItems array.
const EXPECTED_NAV: Record<string, string[]> = {
  ADMIN: ["Dashboard", "Onboarding", "Attendance", "Customers", "Repair Jobs", "Products", "Inventory", "Invoices"],
  TECHNICIAN: ["Dashboard", "Attendance", "Customers", "Repair Jobs", "Inventory", "Invoices"],
  MONITOR: ["Dashboard", "Customers", "Repair Jobs", "Inventory", "Invoices", "Audit Logs"],
};

const HIDDEN_FOR: Record<string, string[]> = {
  TECHNICIAN: ["Onboarding", "Products", "Audit Logs"],
  MONITOR: ["Onboarding", "Attendance", "Products"],
};

for (const role of ["ADMIN", "TECHNICIAN", "MONITOR"] as const) {
  test(`${role} sees exactly the expected sidebar items`, async ({ page }) => {
    await loginViaStorage(page, role);

    for (const label of EXPECTED_NAV[role]) {
      await expect(page.getByRole("link", { name: label })).toBeVisible();
    }
    for (const label of HIDDEN_FOR[role] || []) {
      await expect(page.getByRole("link", { name: label })).toHaveCount(0);
    }
  });
}

test("non-admin visiting /products is redirected to /inventory", async ({ page }) => {
  await loginViaStorage(page, "TECHNICIAN");
  await page.goto("/products");
  await expect(page).toHaveURL(/\/inventory$/);
});

test("ADMIN can open /products directly", async ({ page }) => {
  await loginViaStorage(page, "ADMIN");
  await page.goto("/products");
  await expect(page).toHaveURL(/\/products$/);
});
