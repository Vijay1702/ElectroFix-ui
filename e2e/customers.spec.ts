import { test, expect } from "@playwright/test";
import { loginViaStorage } from "./utils/auth";
import { uniqueName, uniquePhone } from "./utils/factories";
import { openDrawer, submitDrawer } from "./utils/drawer";
import { pickSearchableSelect } from "./utils/searchable-select";
import { anyOnScreen, isOnScreen } from "./utils/layout";

// The profile-view Drawer's header close button (an icon-only X, no text/
// aria-label — see Drawer.tsx) is the next button after the "Customer
// Profile" heading in document order, same technique as the SearchableSelect
// helper.
function headerCloseButton(page: import("@playwright/test").Page) {
  return page.locator('xpath=//h2[text()="Customer Profile"]/following::button[1]');
}

test.describe("customers page", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    await page.goto("/customers");
  });

  test("creates, edits, and deletes a customer", async ({ page }) => {
    const name = uniqueName("Playwright Customer");
    const phone = uniquePhone();

    await openDrawer(page, "Add Customer");
    await expect(page.getByRole("heading", { name: "Create New Customer" })).toBeVisible();

    await page.getByPlaceholder("e.g. John Doe").fill(name);
    await page.getByPlaceholder("e.g. +91 98400 12345").fill(phone);
    await submitDrawer(page, "Add Customer", "/customers");

    await expect(page.getByText(name).first()).toBeVisible();

    // Reload before editing: confirmed via debugging that editing a customer
    // in the same page session immediately after creating one leaves the edit
    // drawer's submit button permanently stuck on "Saving..." instead of
    // "Update Profile" (a real app bug — see the dedicated regression test
    // below — not a test issue; a full reload resets the stuck state).
    await page.reload();
    await page.getByPlaceholder("Search by name, phone, address...").fill(name);
    await expect(page.getByText(name).first()).toBeVisible();

    // Row buttons in order: [0] Customer ID (opens the view drawer), [1] Edit, [2] Delete.
    const row = page.getByRole("row").filter({ hasText: name });
    await row.locator("button").nth(1).click();
    await expect(page.getByRole("heading", { name: "Edit Customer Details" })).toBeVisible();

    const updatedName = `${name} Updated`;
    await page.getByPlaceholder("e.g. John Doe").fill(updatedName);
    await page.getByRole("button", { name: "Update Profile" }).click();
    await expect(page.getByText(updatedName).first()).toBeVisible();

    // Delete
    const updatedRow = page.getByRole("row").filter({ hasText: updatedName });
    await updatedRow.locator("button").nth(2).click();
    await expect(page.getByRole("heading", { name: "Delete Customer Profile" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("row").filter({ hasText: updatedName })).toHaveCount(0);
  });

  test("shows inline validation errors for an invalid submission", async ({ page }) => {
    await openDrawer(page, "Add Customer");
    await page.getByPlaceholder("e.g. John Doe").fill("Al");
    await page.getByPlaceholder("e.g. +91 98400 12345").fill("123");
    // No URL wait here — invalid input is rejected client-side, so no request
    // is ever sent.
    await submitDrawer(page, "Add Customer");

    await expect(page.getByText("Full Name must be at least 3 characters")).toBeVisible();
    await expect(page.getByText("Phone Number must be at least 10 characters")).toBeVisible();
  });

  test("search filters the customer list", async ({ page }) => {
    const name = uniqueName("Searchable Customer");
    const phone = uniquePhone();

    await openDrawer(page, "Add Customer");
    await page.getByPlaceholder("e.g. John Doe").fill(name);
    await page.getByPlaceholder("e.g. +91 98400 12345").fill(phone);
    await submitDrawer(page, "Add Customer", "/customers");
    await expect(page.getByText(name).first()).toBeVisible();

    await page.getByPlaceholder("Search by name, phone, address...").fill("no-such-customer-xyz");
    // Scoped to table rows, not raw page text — the view/edit drawers stay
    // mounted off-screen and can still reference the customer's name elsewhere.
    await expect(page.getByRole("row").filter({ hasText: name })).toHaveCount(0);

    await page.getByPlaceholder("Search by name, phone, address...").fill(name);
    await expect(page.getByText(name).first()).toBeVisible();
  });

  test("known bug: editing right after creating leaves the submit button stuck on Saving...", async ({ page }) => {
    // Regression test for a real app bug found while writing this suite: the
    // customer edit drawer's submit button reads "Saving..." (not "Update
    // Profile") if you open it right after a create, in the same page session
    // — almost certainly a loading flag shared between the create and edit
    // drawers that never resets. A full page reload clears it (see the main
    // CRUD test above, which reloads to route around this). Marked test.fail()
    // so it's tracked without breaking the suite; flip to a normal test once fixed.
    test.fail();

    const name = uniqueName("StuckSaving Customer");
    await openDrawer(page, "Add Customer");
    await page.getByPlaceholder("e.g. John Doe").fill(name);
    await page.getByPlaceholder("e.g. +91 98400 12345").fill(uniquePhone());
    await submitDrawer(page, "Add Customer", "/customers");
    await expect(page.getByText(name).first()).toBeVisible();

    const row = page.getByRole("row").filter({ hasText: name });
    await row.locator("button").nth(1).click();
    await expect(page.getByRole("heading", { name: "Edit Customer Details" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Update Profile" })).toBeVisible();
  });

  test("profile view drawer shows zeroed Quick Stats and empty-state tabs for a fresh customer", async ({ page }) => {
    const name = uniqueName("Profile Customer");
    await openDrawer(page, "Add Customer");
    await page.getByPlaceholder("e.g. John Doe").fill(name);
    await page.getByPlaceholder("e.g. +91 98400 12345").fill(uniquePhone());
    // Deliberately leave Billing Address / Internal Notes blank to check fallback text.
    await submitDrawer(page, "Add Customer", "/customers");
    await expect(page.getByText(name).first()).toBeVisible();

    const row = page.getByRole("row").filter({ hasText: name });
    await row.locator("button").first().click(); // Customer ID button opens the view drawer
    await expect(page.getByRole("heading", { name: "Customer Profile" })).toBeVisible();

    await expect(page.getByText("No address provided")).toBeVisible();
    await expect(page.getByText("No additional notes recorded for this customer.")).toBeVisible();
    await expect(page.getByText("Repairs")).toBeVisible();
    await expect(page.getByText("Spent")).toBeVisible();
    await expect(page.getByText("₹0.00")).toBeVisible();

    await expect(page.getByRole("button", { name: "Repair History (0)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Purchase Invoices (0)" })).toBeVisible();
    await expect(page.getByText("No repair jobs recorded for this customer.")).toBeVisible();

    await page.getByRole("button", { name: "Purchase Invoices (0)" }).click();
    await expect(page.getByText("No invoices generated for this customer.")).toBeVisible();
  });

  test("profile view drawer reflects a repair job created for that customer", async ({ page }) => {
    const name = uniqueName("Profile Activity Customer");
    await openDrawer(page, "Add Customer");
    await page.getByPlaceholder("e.g. John Doe").fill(name);
    await page.getByPlaceholder("e.g. +91 98400 12345").fill(uniquePhone());
    await submitDrawer(page, "Add Customer", "/customers");
    await expect(page.getByText(name).first()).toBeVisible();

    const jobNumber = `JOB-PROF-${Date.now()}`;
    await page.goto("/repairs");
    await page.getByRole("button", { name: "New Repair Job" }).click();
    await pickSearchableSelect(page, "Client Name", name);
    await pickSearchableSelect(page, "Assigned To", "E2E Technician");
    await page.getByPlaceholder("e.g. REP-001").fill(jobNumber);
    await page.getByPlaceholder("e.g. Smartphone").fill("Fan");
    await page.getByPlaceholder("e.g. 2500").fill("1500");
    await page.getByPlaceholder("Describe the issue in detail...").fill("Not turning on");
    await page.getByRole("button", { name: "Create Job" }).click();
    await expect(page.getByText(jobNumber.toUpperCase()).first()).toBeVisible();

    await page.goto("/customers");
    await page.getByPlaceholder("Search by name, phone, address...").fill(name);
    const row = page.getByRole("row").filter({ hasText: name });
    await row.locator("button").first().click();

    await expect(page.getByRole("button", { name: "Repair History (1)" })).toBeVisible();
    await expect(page.getByText(jobNumber.toUpperCase())).toBeVisible();
    await expect(page.getByText("Not Started")).toBeVisible();
  });

  test("profile view drawer closes via the footer button and the header X button", async ({ page }) => {
    const name = uniqueName("Close Test Customer");
    await openDrawer(page, "Add Customer");
    await page.getByPlaceholder("e.g. John Doe").fill(name);
    await page.getByPlaceholder("e.g. +91 98400 12345").fill(uniquePhone());
    await submitDrawer(page, "Add Customer", "/customers");
    await expect(page.getByText(name).first()).toBeVisible();

    const row = page.getByRole("row").filter({ hasText: name });
    const profileHeading = page.getByRole("heading", { name: "Customer Profile" });

    // The drawer stays mounted off-screen (CSS transform) even when "closed",
    // so .toBeVisible() alone can't tell open from closed (same issue as the
    // Sidebar/other Drawers) — check actual on-screen position instead.
    await row.locator("button").first().click();
    expect(await isOnScreen(profileHeading, page)).toBe(true);
    await page.getByRole("button", { name: "Close Profile" }).click();
    await page.waitForTimeout(350);
    expect(await isOnScreen(profileHeading, page)).toBe(false);

    await row.locator("button").first().click();
    expect(await isOnScreen(profileHeading, page)).toBe(true);
    await headerCloseButton(page).click();
    await page.waitForTimeout(350);
    expect(await isOnScreen(profileHeading, page)).toBe(false);
  });

  test("search matches on notes content too (client-side search covers every field, unlike the backend search param)", async ({
    page,
  }) => {
    const name = uniqueName("Notes Search Customer");
    const marker = `SecretMarker${Date.now()}`;
    await openDrawer(page, "Add Customer");
    await page.getByPlaceholder("e.g. John Doe").fill(name);
    await page.getByPlaceholder("e.g. +91 98400 12345").fill(uniquePhone());
    await page.getByPlaceholder("Any special instructions or details...").fill(marker);
    await submitDrawer(page, "Add Customer", "/customers");
    await expect(page.getByText(name).first()).toBeVisible();

    await page.getByPlaceholder("Search by name, phone, address...").fill(marker);
    await expect(page.getByRole("row").filter({ hasText: name })).toBeVisible();
  });
});

test.describe("customers page — role-based access", () => {
  test("MONITOR cannot see the Add Customer button or the Actions column", async ({ page }) => {
    await loginViaStorage(page, "MONITOR");
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");
    // "Add Customer" also matches the create Drawer's own off-screen submit
    // button (always mounted regardless of role) — anyOnScreen filters that
    // phantom match out, same technique as responsive-buttons.spec.ts.
    expect(await anyOnScreen(page.getByRole("button", { name: "Add Customer" }), page)).toBe(false);
    await expect(page.getByRole("columnheader", { name: "Actions" })).toHaveCount(0);
  });

  test("TECHNICIAN has the same Add Customer / Actions access as ADMIN", async ({ page }) => {
    await loginViaStorage(page, "TECHNICIAN");
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");
    expect(await anyOnScreen(page.getByRole("button", { name: "Add Customer" }), page)).toBe(true);
    await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
  });
});
