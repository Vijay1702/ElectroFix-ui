import { test, expect } from "@playwright/test";
import { loginViaStorage } from "./utils/auth";
import { uniqueName, uniquePhone } from "./utils/factories";
import { pickSearchableSelect } from "./utils/searchable-select";
import { openDrawer, submitDrawer } from "./utils/drawer";

async function createCustomer(page: import("@playwright/test").Page, name: string) {
  await page.goto("/customers");
  await openDrawer(page, "Add Customer");
  await page.getByPlaceholder("e.g. John Doe").fill(name);
  await page.getByPlaceholder("e.g. +91 98400 12345").fill(uniquePhone());
  await submitDrawer(page, "Add Customer", "/customers");
  await expect(page.getByText(name).first()).toBeVisible();
}

async function createInStockProduct(page: import("@playwright/test").Page, name: string, sellingPrice: string) {
  await page.goto("/products");
  await page.getByRole("button", { name: "Add Product" }).click();
  await page.getByPlaceholder("e.g. Milo 1kg").fill(name);
  await pickSearchableSelect(page, "Category", "E2E Test Category");
  await page.getByPlaceholder("0.00").nth(0).fill("50");
  await page.getByPlaceholder("0.00").nth(1).fill(sellingPrice);
  await page.getByPlaceholder("5").fill("5");
  await page.getByRole("button", { name: "Save Product" }).click();
  await expect(page.getByText(name).first()).toBeVisible();

  // Freshly created products start at 0 stock — the invoice's product picker
  // only lists in-stock items, so stock it in via Inventory first.
  await page.goto("/inventory");
  await page.getByPlaceholder("Search name, code, brand...").fill(name);
  await page.getByTitle("Adjust Stock").first().click();
  await expect(page.getByRole("heading", { name: "Adjust Inventory Stock" })).toBeVisible();
  await page.locator("select").last().selectOption({ value: "in" });
  await page.locator('input[type="number"]').last().fill("10");
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/stock-movements") && r.ok()),
    page.getByRole("button", { name: "Save Adjustment" }).click(),
  ]);
}

// The invoice's "Select Completed Repair" picker needs the job progressed to
// pending_to_deliver (confirmed in the backend full-workflow test) — a fresh
// not_started job won't show up.
async function createRepairJobReadyToBill(
  page: import("@playwright/test").Page,
  customerName: string,
  jobNumber: string
) {
  await page.goto("/repairs");
  await page.getByRole("button", { name: "New Repair Job" }).click();
  await pickSearchableSelect(page, "Client Name", customerName);
  await pickSearchableSelect(page, "Assigned To", "E2E Technician");
  await page.getByPlaceholder("e.g. REP-001").fill(jobNumber);
  await page.getByPlaceholder("e.g. Smartphone").fill("Mixie");
  await page.getByPlaceholder("e.g. 2500").fill("1200");
  await page.getByPlaceholder("Describe the issue in detail...").fill("Motor not starting");
  await page.getByRole("button", { name: "Create Job" }).click();
  await expect(page.getByText(jobNumber.toUpperCase()).first()).toBeVisible();

  const row = page.getByRole("row").filter({ hasText: jobNumber.toUpperCase() });
  await row.locator("button.text-indigo-500").click();
  await pickSearchableSelect(page, "Current Status", "Work in Progress");
  await page.getByRole("button", { name: "Update Job" }).click();
  await expect(page.getByText(jobNumber.toUpperCase()).first()).toBeVisible();

  await row.locator("button.text-indigo-500").click();
  await pickSearchableSelect(page, "Current Status", "Pending to Deliver");
  await page.getByRole("button", { name: "Update Job" }).click();
  await expect(page.getByText(jobNumber.toUpperCase()).first()).toBeVisible();
}

test("admin generates a product-only invoice and finalizes it with cash", async ({ page }) => {
  await loginViaStorage(page, "ADMIN");
  const customerName = uniqueName("Invoice Test Customer");
  await createCustomer(page, customerName);
  const productName = uniqueName("Invoice Test Product");
  await createInStockProduct(page, productName, "100");

  await page.goto("/invoices");
  await page.getByRole("button", { name: "Generate Invoice" }).click();
  await expect(page.getByRole("heading", { name: "Generate Official Invoice" })).toBeVisible();

  await page.getByRole("button", { name: "Product Only" }).click();
  await pickSearchableSelect(page, "Billing Participant", customerName);
  await page.getByPlaceholder("Search products to add...").fill(productName);
  await page.getByRole("button", { name: productName }).click();

  await page.getByRole("button", { name: "CASH" }).click();
  // Toasts auto-dismiss quickly (flaky to assert on) and the drawer doesn't
  // auto-close on success — wait on the actual API response instead.
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/invoices") && r.request().method() === "POST" && r.ok()),
    page.getByRole("button", { name: "Finalize & Pay" }).click(),
  ]);
});

test("Service Only invoice linked to a repair auto-fills the balance and finalizes", async ({ page }) => {
  await loginViaStorage(page, "ADMIN");
  const customerName = uniqueName("Service Invoice Customer");
  await createCustomer(page, customerName);
  const jobNumber = `JOB-SVC-${Date.now()}`;
  await createRepairJobReadyToBill(page, customerName, jobNumber);

  await page.goto("/invoices");
  await page.getByRole("button", { name: "Generate Invoice" }).click();
  await page.getByRole("button", { name: "Service Only" }).click();
  await pickSearchableSelect(page, "Billing Participant", customerName);
  await pickSearchableSelect(page, "Linked Service Job", jobNumber.toUpperCase());

  // Selecting the repair auto-creates a line item and shows the balance box.
  await expect(page.getByText("Due Balance")).toBeVisible();
  await expect(page.getByText(jobNumber.toUpperCase(), { exact: false }).first()).toBeVisible();

  await page.getByRole("button", { name: "CASH" }).click();
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/invoices") && r.request().method() === "POST" && r.ok()),
    page.getByRole("button", { name: "Finalize & Pay" }).click(),
  ]);
});

test("Hybrid Bill combines a repair line item and a product line item", async ({ page }) => {
  await loginViaStorage(page, "ADMIN");
  const customerName = uniqueName("Hybrid Invoice Customer");
  await createCustomer(page, customerName);
  const jobNumber = `JOB-HYB-${Date.now()}`;
  await createRepairJobReadyToBill(page, customerName, jobNumber);
  const productName = uniqueName("Hybrid Invoice Product");
  await createInStockProduct(page, productName, "150");

  await page.goto("/invoices");
  await page.getByRole("button", { name: "Generate Invoice" }).click();
  await page.getByRole("button", { name: "Hybrid Bill" }).click();
  await pickSearchableSelect(page, "Billing Participant", customerName);
  await pickSearchableSelect(page, "Linked Service Job", jobNumber.toUpperCase());
  await page.getByPlaceholder("Search products to add...").fill(productName);
  await page.getByRole("button", { name: productName }).click();

  // Both a repair-derived row and the product row should be in the line items table.
  await expect(page.getByText(jobNumber.toUpperCase(), { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: productName })).toBeVisible();

  await page.getByRole("button", { name: "CASH" }).click();
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/invoices") && r.request().method() === "POST" && r.ok()),
    page.getByRole("button", { name: "Finalize & Pay" }).click(),
  ]);
});

test("PARTIAL payment term reveals the Advance Collected field", async ({ page }) => {
  await loginViaStorage(page, "ADMIN");
  const customerName = uniqueName("Partial Invoice Customer");
  await createCustomer(page, customerName);
  const jobNumber = `JOB-PART-${Date.now()}`;
  await createRepairJobReadyToBill(page, customerName, jobNumber);

  await page.goto("/invoices");
  await page.getByRole("button", { name: "Generate Invoice" }).click();
  await page.getByRole("button", { name: "Service Only" }).click();
  await pickSearchableSelect(page, "Billing Participant", customerName);
  await pickSearchableSelect(page, "Linked Service Job", jobNumber.toUpperCase());

  // exact:true — a non-exact match also catches the customer SearchableSelect
  // trigger, whose label became "Partial Invoice Customer" once selected
  // (Playwright's default string matching is substring + case-insensitive).
  await page.getByRole("button", { name: "PARTIAL", exact: true }).click();
  const advanceInput = page.getByText("Advance Collected").locator("xpath=following::input[1]");
  await expect(advanceInput).toBeVisible();
  await advanceInput.fill("500");

  await page.getByRole("button", { name: "CASH" }).click();
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/invoices") && r.request().method() === "POST" && r.ok()),
    page.getByRole("button", { name: "Finalize & Pay" }).click(),
  ]);
});

test("discount reduces the displayed grand total", async ({ page }) => {
  await loginViaStorage(page, "ADMIN");
  const customerName = uniqueName("Discount Invoice Customer");
  await createCustomer(page, customerName);
  const productName = uniqueName("Discount Invoice Product");
  await createInStockProduct(page, productName, "200");

  await page.goto("/invoices");
  await page.getByRole("button", { name: "Generate Invoice" }).click();
  await page.getByRole("button", { name: "Product Only" }).click();
  await pickSearchableSelect(page, "Billing Participant", customerName);
  await page.getByPlaceholder("Search products to add...").fill(productName);
  await page.getByRole("button", { name: productName }).click();

  await expect(page.getByText("₹200", { exact: false }).first()).toBeVisible();
  await page.getByPlaceholder("Enter flat discount amount...").fill("50");
  await expect(page.getByText("₹150", { exact: false }).first()).toBeVisible();
});

test("shows validation toasts when finalizing with no customer or no items", async ({ page }) => {
  await loginViaStorage(page, "ADMIN");
  await page.goto("/invoices");
  await page.getByRole("button", { name: "Generate Invoice" }).click();
  await page.getByRole("button", { name: "Product Only" }).click();
  await page.getByRole("button", { name: "Finalize & Pay" }).click();
  await expect(page.getByText("Please select a billing customer")).toBeVisible();
});

test("View Invoice drawer shows the finalized invoice's details", async ({ page }) => {
  await loginViaStorage(page, "ADMIN");
  const customerName = uniqueName("View Invoice Customer");
  await createCustomer(page, customerName);
  const productName = uniqueName("View Invoice Product");
  await createInStockProduct(page, productName, "80");

  await page.goto("/invoices");
  await page.getByRole("button", { name: "Generate Invoice" }).click();
  await page.getByRole("button", { name: "Product Only" }).click();
  await pickSearchableSelect(page, "Billing Participant", customerName);
  await page.getByPlaceholder("Search products to add...").fill(productName);
  await page.getByRole("button", { name: productName }).click();
  await page.getByRole("button", { name: "CASH" }).click();
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/invoices") && r.request().method() === "POST" && r.ok()),
    page.getByRole("button", { name: "Finalize & Pay" }).click(),
  ]);

  const row = page.getByRole("row").filter({ hasText: customerName });
  await row.locator("button").first().click(); // Eye icon opens the View drawer
  await expect(page.getByRole("heading", { name: "Invoice Details" })).toBeVisible();
  await expect(page.getByText("Sri Senthil Spares & Services")).toBeVisible();
  await expect(page.getByText("Bill To")).toBeVisible();
  // .last() — the customer name also appears in the table row behind the
  // drawer; the drawer's own "Bill To" paragraph renders after it in DOM order.
  await expect(page.getByText(customerName).last()).toBeVisible();
});
