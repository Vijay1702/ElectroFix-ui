import { test, expect } from "@playwright/test";
import { loginViaUI } from "./utils/auth";
import { uniqueEmail, uniqueName, uniquePhone } from "./utils/factories";
import { pickSearchableSelect } from "./utils/searchable-select";
import { openDrawer, submitDrawer } from "./utils/drawer";
import { E2E_PASSWORD, E2E_USERS } from "./utils/fixtures-data";

// Mirrors the backend's full-workflow.spec.ts, but driven through the real
// browser UI: login -> onboard staff -> intake a customer -> open + progress a
// repair job -> generate an invoice -> mark attendance -> check payroll ->
// logout. The Payments page is intentionally skipped here: src/pages/payments
// exists but has no route registered in src/routes/index.tsx and no sidebar
// link, so it's unreachable through real navigation (a known gap, not fixed
// as part of this task) — the backend suite still covers the payments API.
test("full business workflow through the UI: onboarding through payroll", async ({ page }) => {
  await loginViaUI(page, E2E_USERS.ADMIN.email, E2E_PASSWORD);

  // 1. Onboard a technician
  const techName = uniqueName("Workflow UI Technician");
  const techEmail = uniqueEmail("ui-workflow-tech");
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Onboard Personnel" }).click();
  await page.getByPlaceholder("e.g. Vijay Raghavan").fill(techName);
  await page.getByPlaceholder("v.raghavan@electrofix.com").fill(techEmail);
  await page.getByPlaceholder("+91 98400 12345").fill(uniquePhone());
  await page.getByPlaceholder("••••••••").fill("Test@1234");
  await page.getByPlaceholder("e.g. 750").fill("800");
  await page.getByRole("button", { name: "Technician" }).click();
  await page.getByRole("button", { name: "Finalize Onboarding" }).click();
  await expect(page.getByText(techName).first()).toBeVisible();

  // 2. Create a customer
  const customerName = uniqueName("Workflow UI Customer");
  await page.goto("/customers");
  await openDrawer(page, "Add Customer");
  await page.getByPlaceholder("e.g. John Doe").fill(customerName);
  await page.getByPlaceholder("e.g. +91 98400 12345").fill(uniquePhone());
  await submitDrawer(page, "Add Customer", "/customers");
  await expect(page.getByText(customerName).first()).toBeVisible();

  // 3. Open a repair job assigned to the new technician
  const jobNumber = `JOB-WF-${Date.now()}`;
  await page.goto("/repairs");
  await page.getByRole("button", { name: "New Repair Job" }).click();
  await pickSearchableSelect(page, "Client Name", customerName);
  await pickSearchableSelect(page, "Assigned To", techName);
  await page.getByPlaceholder("e.g. REP-001").fill(jobNumber);
  await page.getByPlaceholder("e.g. Smartphone").fill("Mixie");
  await page.getByPlaceholder("e.g. 2500").fill("1200");
  await page.getByPlaceholder("Describe the issue in detail...").fill("Motor not starting");
  await page.getByRole("button", { name: "Create Job" }).click();
  await expect(page.getByText(jobNumber.toUpperCase()).first()).toBeVisible();

  // 4. Progress its status through to "Pending to Deliver" — the invoice's
  // "Select Completed Repair" picker only lists repairs at that stage.
  const row = page.getByRole("row").filter({ hasText: jobNumber.toUpperCase() });
  await row.locator("button.text-indigo-500").click();
  await pickSearchableSelect(page, "Current Status", "Work in Progress");
  await page.getByRole("button", { name: "Update Job" }).click();
  await expect(page.getByText(jobNumber.toUpperCase()).first()).toBeVisible();

  await row.locator("button.text-indigo-500").click();
  await pickSearchableSelect(page, "Current Status", "Pending to Deliver");
  await page.getByRole("button", { name: "Update Job" }).click();
  await expect(page.getByText(jobNumber.toUpperCase()).first()).toBeVisible();

  // 5. Generate a service invoice for the repair
  await page.goto("/invoices");
  await page.getByRole("button", { name: "Generate Invoice" }).click();
  await page.getByRole("button", { name: "Service Only" }).click();
  await pickSearchableSelect(page, "Billing Participant", customerName);
  await pickSearchableSelect(page, "Linked Service Job", jobNumber.toUpperCase());
  await page.getByRole("button", { name: "CASH" }).click();
  // Toasts auto-dismiss quickly (flaky to assert on) and the drawer doesn't
  // auto-close on success — wait on the actual API response instead.
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/invoices") && r.request().method() === "POST" && r.ok()),
    page.getByRole("button", { name: "Finalize & Pay" }).click(),
  ]);

  // 6. Mark the technician's attendance
  await page.goto("/attendance");
  await page.getByRole("button", { name: "Daily Log Roster" }).click();
  await page.getByPlaceholder("Search employee...").fill(techName);
  await page.getByRole("row").filter({ hasText: techName }).getByRole("button", { name: "Present", exact: true }).first().click();
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/attendance/bulk") && r.ok()),
    page.getByRole("button", { name: "Lock Attendance Sheet" }).click(),
  ]);

  // 7. Confirm payroll picks up the technician. The payroll table has its own
  // scrollable area (many technicians accumulate across runs) — search rather
  // than scanning raw page text, which can resolve to an off-screen row.
  await page.getByRole("button", { name: "Payroll Calculator" }).click();
  await page.getByPlaceholder("Search employee...").fill(techName);
  await expect(page.getByText(techName).first()).toBeVisible();

  // 8. Logout
  await page.getByRole("button", { name: "Logout" }).click();
  await page.getByRole("button", { name: "Logout" }).last().click();
  await expect(page).toHaveURL(/\/login$/);
});
