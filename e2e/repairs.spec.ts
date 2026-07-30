import { test, expect } from "@playwright/test";
import { loginViaStorage } from "./utils/auth";
import { uniqueName, uniquePhone } from "./utils/factories";
import { pickSearchableSelect } from "./utils/searchable-select";
import { openDrawer, submitDrawer } from "./utils/drawer";

async function createCustomerAndRepairJob(page: import("@playwright/test").Page, jobNumber: string) {
  const customerName = uniqueName("Repair Test Customer");
  await page.goto("/customers");
  await openDrawer(page, "Add Customer");
  await page.getByPlaceholder("e.g. John Doe").fill(customerName);
  await page.getByPlaceholder("e.g. +91 98400 12345").fill(uniquePhone());
  await submitDrawer(page, "Add Customer", "/customers");
  await expect(page.getByText(customerName).first()).toBeVisible();

  await page.goto("/repairs");
  await page.getByRole("button", { name: "New Repair Job" }).click();
  await expect(page.getByRole("heading", { name: "New Repair Job" })).toBeVisible();

  await pickSearchableSelect(page, "Client Name", customerName);
  await pickSearchableSelect(page, "Assigned To", "E2E Technician");
  await page.getByPlaceholder("e.g. REP-001").fill(jobNumber);
  await page.getByPlaceholder("e.g. Smartphone").fill("Fan");
  await page.getByPlaceholder("e.g. Apple").fill("Crompton");
  await page.getByPlaceholder("e.g. 2500").fill("1500");
  await page.getByPlaceholder("Describe the issue in detail...").fill("Not turning on");
  await page.getByRole("button", { name: "Create Job" }).click();
  await expect(page.getByText(jobNumber.toUpperCase()).first()).toBeVisible();

  return customerName;
}

test("admin creates a repair job for a customer and updates it", async ({ page }) => {
  await loginViaStorage(page, "ADMIN");
  const jobNumber = `JOB-PW-${Date.now()}`;
  await createCustomerAndRepairJob(page, jobNumber);

  // Move it into the in-progress state via the edit drawer
  const row = page.getByRole("row").filter({ hasText: jobNumber.toUpperCase() });
  await row.locator("button.text-indigo-500").click();
  await expect(page.getByRole("heading", { name: "Edit Repair Job" })).toBeVisible();
  await pickSearchableSelect(page, "Current Status", "Work in Progress");
  await page.getByRole("button", { name: "Update Job" }).click();

  await expect(page.getByText(jobNumber.toUpperCase()).first()).toBeVisible();
});

test("read-only Repair Details view shows the job's information and has no save button", async ({ page }) => {
  await loginViaStorage(page, "ADMIN");
  const jobNumber = `JOB-VIEW-${Date.now()}`;
  await createCustomerAndRepairJob(page, jobNumber);

  const row = page.getByRole("row").filter({ hasText: jobNumber.toUpperCase() });
  await row.locator("button").first().click(); // Job No. button opens the read-only view
  await expect(page.getByRole("heading", { name: "Repair Details" })).toBeVisible();

  // "Not turning on" alone is ambiguous (reused across many accumulated rows in
  // the table behind the drawer) — the Problem Analysis block renders it quoted.
  await expect(page.getByText('"Not turning on"')).toBeVisible();
  await expect(page.getByText("No payments recorded yet.")).toBeVisible();
  await expect(page.getByText("No communication logs recorded yet.")).toBeVisible();
  // Read-only mode renders only a "Close" footer button, no "Update Job"/"Create Job".
  await expect(page.getByRole("button", { name: "Update Job" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
});

test("logs a call against a not_started job via the Log Call modal", async ({ page }) => {
  await loginViaStorage(page, "ADMIN");
  const jobNumber = `JOB-CALL-${Date.now()}`;
  await createCustomerAndRepairJob(page, jobNumber);

  const row = page.getByRole("row").filter({ hasText: jobNumber.toUpperCase() });
  // The phone/call-log icon only renders while status === not_started.
  await row.locator("button.text-emerald-500").click();
  await expect(page.getByText(`Log Call for Ticket #${jobNumber.toUpperCase()}`)).toBeVisible();

  // The rest of the page (status filter select, page-size select, etc.) stays
  // in the DOM behind the modal overlay, so scope to the last <select> rather
  // than an unscoped role query which would be ambiguous.
  await page.locator("select").last().selectOption("declined_repair");
  await page.getByPlaceholder(/Write details of what the customer said/).fill("Customer declined the repair quote.");

  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/calls") && r.request().method() === "POST" && r.ok()),
    page.getByRole("button", { name: "Log Communication" }).click(),
  ]);

  // Confirm it now shows up in the read-only view's call log section.
  await row.locator("button").first().click();
  await expect(page.getByRole("heading", { name: "Repair Details" })).toBeVisible();
  await expect(page.getByText("Customer declined the repair quote.")).toBeVisible();
});

test("deletes a repair job via the confirm dialog", async ({ page }) => {
  await loginViaStorage(page, "ADMIN");
  const jobNumber = `JOB-DEL-${Date.now()}`;
  await createCustomerAndRepairJob(page, jobNumber);

  const row = page.getByRole("row").filter({ hasText: jobNumber.toUpperCase() });
  await row.locator("button.text-red-500").click();
  await expect(page.getByRole("heading", { name: "Delete Repair Ticket" })).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByRole("row").filter({ hasText: jobNumber.toUpperCase() })).toHaveCount(0);
});

test("status filter narrows the list to the selected status", async ({ page }) => {
  await loginViaStorage(page, "ADMIN");
  const jobNumber = `JOB-FILTER-${Date.now()}`;
  await createCustomerAndRepairJob(page, jobNumber);

  const statusFilter = page.locator("select").filter({ has: page.locator('option[value="not_started"]') });
  await statusFilter.selectOption("declined");
  await expect(page.getByRole("row").filter({ hasText: jobNumber.toUpperCase() })).toHaveCount(0);

  await statusFilter.selectOption("not_started");
  await expect(page.getByRole("row").filter({ hasText: jobNumber.toUpperCase() })).toBeVisible();
});
