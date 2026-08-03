import { test, expect } from "@playwright/test";
import { loginViaStorage } from "./utils/auth";
import { uniqueName } from "./utils/factories";
import { pickSearchableSelect } from "./utils/searchable-select";

// Guards the shared Label/Input/Button/Drawer restyle (uppercase labels,
// tightened corner radius, locked-field + info-callout pattern) that was
// rolled out across every drawer in the app. These assert the underlying
// design contract via computed styles, not just visible text, so a future
// change that quietly reverts the shared component styling gets caught here
// rather than only being noticed by eye.

test.describe("design system — shared component styling", () => {
  test("Label renders uppercase, bold, and muted — on the Products drawer", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    await page.goto("/products");
    await page.getByRole("button", { name: "Add Product" }).click();
    const dialog = page.getByRole("dialog", { name: "Add New Product" });
    await expect(dialog).toBeVisible();

    const label = dialog.locator("label").filter({ hasText: "Product Name" });
    await expect(label).toBeVisible();
    await expect(label).toHaveCSS("text-transform", "uppercase");
    await expect(label).toHaveCSS("font-weight", "700");
  });

  test("Input and Button use the tightened rounded-lg corner radius, not the old rounded-xl", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    await page.goto("/products");
    await page.getByRole("button", { name: "Add Product" }).click();

    const input = page.getByPlaceholder("e.g. Milo 1kg");
    const inputRadius = await input.evaluate((el) => getComputedStyle(el).borderRadius);
    // --radius-lg resolves to 0.75rem (12px) in this theme; the old rounded-xl was 16.8px.
    expect(parseFloat(inputRadius)).toBeCloseTo(12, 0);

    const saveButton = page.getByRole("button", { name: "Save Product" });
    const buttonRadius = await saveButton.evaluate((el) => getComputedStyle(el).borderRadius);
    expect(parseFloat(buttonRadius)).toBeCloseTo(12, 0);
  });
});

test.describe("design system — Inventory Update Placement drawer", () => {
  async function createProduct(page: import("@playwright/test").Page, name: string) {
    await page.goto("/products");
    await page.getByRole("button", { name: "Add Product" }).click();
    await expect(page.getByRole("heading", { name: "Add New Product" })).toBeVisible();
    await page.getByPlaceholder("e.g. Milo 1kg").fill(name);
    await pickSearchableSelect(page, "Category", "E2E Test Category");
    await page.getByPlaceholder("0.00").nth(0).fill("30");
    await page.getByPlaceholder("0.00").nth(1).fill("60");
    await page.getByPlaceholder("5").fill("10");
    await page.getByRole("button", { name: "Save Product" }).click();
    await expect(page.getByText(name).first()).toBeVisible();
  }

  test("shows the part name/ID as locked reference fields and an info callout, not an editable alert-limit field", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    const name = uniqueName("Design System Product");
    await createProduct(page, name);

    await page.goto("/inventory");
    await page.getByPlaceholder("Search name, code, brand...").fill(name);
    await page.getByTitle("Update Location").first().click();
    const dialog = page.getByRole("dialog", { name: "Update Placement" });
    await expect(dialog).toBeVisible();

    // Locked reference fields: labeled, showing the value, but not an <input>.
    await expect(dialog.getByText("Part Name", { exact: true })).toBeVisible();
    await expect(dialog.getByText(name)).toBeVisible();
    await expect(dialog.getByText("Part ID", { exact: true })).toBeVisible();
    await expect(dialog.locator("input").filter({ hasText: name })).toHaveCount(0);

    // Editable fields are still real inputs.
    await expect(dialog.getByPlaceholder("e.g. Shelf A")).toBeEditable();
    await expect(dialog.getByPlaceholder("e.g. Row 3")).toBeEditable();

    // The removed "Minimum Stock Alert Limit" field must not be present.
    await expect(dialog.getByText("Minimum Stock Alert Limit")).toHaveCount(0);

    // Info callout explaining the side effect of saving.
    await expect(
      dialog.getByText(/Updating these values will sync the physical location/)
    ).toBeVisible();
  });
});

test.describe("design system — Onboarding banner", () => {
  test("shows the simplified authorization banner without the old gradient/shadow treatment", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    await page.goto("/onboarding");
    await page.getByRole("button", { name: "Onboard Personnel" }).click();
    const dialog = page.getByRole("dialog", { name: "Personnel Onboarding Terminal" });
    await expect(dialog).toBeVisible();

    await expect(dialog.getByText("Authorization Protocol")).toBeVisible();
    await expect(dialog.getByText("Define Personnel Credentials")).toBeVisible();
  });
});
