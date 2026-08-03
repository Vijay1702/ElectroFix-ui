import { test, expect } from "@playwright/test";
import { loginViaStorage } from "./utils/auth";
import { uniqueName } from "./utils/factories";
import { pickSearchableSelect } from "./utils/searchable-select";

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

test("admin creates a product and adjusts its stock from the inventory page", async ({ page }) => {
  await loginViaStorage(page, "ADMIN");
  const name = uniqueName("Playwright Product");
  await createProduct(page, name);

  await page.goto("/inventory");
  await page.getByPlaceholder("Search name, code, brand...").fill(name);
  await expect(page.getByText(name).first()).toBeVisible();

  await page.getByTitle("Adjust Stock").first().click();
  await expect(page.getByRole("heading", { name: "Adjust Inventory Stock" })).toBeVisible();
  // The page also has Category/Stock-Status filter selects and a page-size
  // select mounted underneath; the drawer's own select is the last in DOM order.
  await page.locator("select").last().selectOption({ value: "in" });
  await page.locator('input[type="number"]').last().fill("5");
  // Toasts auto-dismiss quickly (flaky to assert on) and the drawer doesn't
  // auto-close on success — waiting on the actual API response is the only
  // reliable signal here.
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/stock-movements") && r.request().method() === "POST" && r.ok()),
    page.getByRole("button", { name: "Save Adjustment" }).click(),
  ]);
});

test.describe("products page", () => {
  test("edits a product with pre-filled values and deletes it", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    const name = uniqueName("Edit Product");
    await createProduct(page, name);

    const row = page.getByRole("row").filter({ hasText: name });
    await row.locator("button.text-indigo-500").click();
    await expect(page.getByRole("heading", { name: "Edit Product" })).toBeVisible();
    // Confirm the form is pre-filled with the existing values, not blank.
    await expect(page.getByPlaceholder("e.g. Milo 1kg")).toHaveValue(name);
    await expect(page.getByPlaceholder("0.00").nth(0)).toHaveValue("30");

    const updatedName = `${name} Updated`;
    await page.getByPlaceholder("e.g. Milo 1kg").fill(updatedName);
    await page.getByRole("button", { name: "Update Product" }).click();
    await expect(page.getByText(updatedName).first()).toBeVisible();

    const updatedRow = page.getByRole("row").filter({ hasText: updatedName });
    await updatedRow.locator("button.text-red-500").click();
    await expect(page.getByRole("heading", { name: "Delete Inventory Item" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("row").filter({ hasText: updatedName })).toHaveCount(0);
  });

  test("read-only Product Information view shows details with no editable fields", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    const name = uniqueName("View Product");
    await createProduct(page, name);

    const row = page.getByRole("row").filter({ hasText: name });
    await row.locator("button").first().click(); // product name/image button opens the read-only view
    await expect(page.getByRole("heading", { name: "Product Information" })).toBeVisible();
    // "₹60.00" also appears in the table row behind the drawer — .last() lands
    // on the drawer's own Selling Price paragraph (rendered after the table in
    // DOM order, same convention as every other Drawer on this page).
    await expect(page.getByText("₹60.00").last()).toBeVisible();
    await expect(page.getByRole("button", { name: "Update Product" })).toHaveCount(0);
  });

  test("category filter narrows the product list", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    const name = uniqueName("Category Filter Product");
    await createProduct(page, name);

    await page.goto("/products");
    const categoryFilter = page.locator("select").filter({ has: page.locator('option[value=""]:has-text("All Categories")') });
    const options = await categoryFilter.locator("option").allTextContents();
    const otherCategory = options.find((o) => o !== "All Categories" && o !== "E2E Test Category");

    if (otherCategory) {
      await categoryFilter.selectOption({ label: otherCategory });
      await expect(page.getByRole("row").filter({ hasText: name })).toHaveCount(0);
    }

    await categoryFilter.selectOption({ label: "E2E Test Category" });
    await expect(page.getByRole("row").filter({ hasText: name })).toBeVisible();
  });

  test("rejects an oversized/invalid image upload with a toast", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    await page.goto("/products");
    await page.getByRole("button", { name: "Add Product" }).click();
    await expect(page.getByRole("heading", { name: "Add New Product" })).toBeVisible();

    // A .txt file (wrong MIME type) — rejected client-side before any upload request.
    await page.locator('input[type="file"]').setInputFiles({
      name: "not-an-image.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });
    await expect(page.getByText("Invalid file format. Only JPG and PNG are supported.")).toBeVisible();
  });

  test("uploads a valid PNG image and shows the preview", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    await page.goto("/products");
    await page.getByRole("button", { name: "Add Product" }).click();
    await expect(page.getByRole("heading", { name: "Add New Product" })).toBeVisible();

    // Minimal valid 1x1 transparent PNG.
    const pngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

    const [uploadResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/uploads/product") && r.request().method() === "POST"),
      page.locator('input[type="file"]').setInputFiles({
        name: "test-image.png",
        mimeType: "image/png",
        buffer: Buffer.from(pngBase64, "base64"),
      }),
    ]);

    expect(uploadResponse.ok(), "upload request should succeed, not fail multipart parsing").toBeTruthy();
    await expect(page.getByAltText("Uploaded preview")).toBeVisible();
    await expect(page.getByAltText("Uploaded preview")).toHaveAttribute("src", /\/uploads\/product\//);
  });
});

test.describe("inventory page", () => {
  test("the Stock Movements Ledger tab has been removed — inventory page shows only the Stock Levels table", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    await page.goto("/inventory");
    await expect(page.getByRole("heading", { name: "Inventory & Stock Control" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Stock Movements Ledger" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Stock Levels" })).toHaveCount(0);
  });

  test("adjusting stock updates the displayed quantity in the Stock Levels table", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    const name = uniqueName("Ledger Product");
    await createProduct(page, name);

    await page.goto("/inventory");
    await page.getByPlaceholder("Search name, code, brand...").fill(name);
    await page.getByTitle("Adjust Stock").first().click();
    await page.locator("select").last().selectOption({ value: "in" });
    await page.locator('input[type="number"]').last().fill("7");
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/stock-movements") && r.request().method() === "POST" && r.ok()),
      page.getByRole("button", { name: "Save Adjustment" }).click(),
    ]);

    await expect(page.getByRole("row").filter({ hasText: name }).getByText("7 pcs")).toBeVisible();
  });

  test("Update Placement drawer saves shelf/row", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    const name = uniqueName("Placement Product");
    await createProduct(page, name);

    await page.goto("/inventory");
    await page.getByPlaceholder("Search name, code, brand...").fill(name);
    await page.getByTitle("Update Location").first().click();
    await expect(page.getByRole("heading", { name: "Update Placement" })).toBeVisible();

    await page.getByPlaceholder("e.g. Shelf A").fill("Shelf Z");
    await page.getByPlaceholder("e.g. Row 3").fill("Row 9");
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/products/") && r.request().method() === "PUT" && r.ok()),
      page.getByRole("button", { name: "Save Locations" }).click(),
    ]);

    // Read-only Product Details drawer should reflect the new location.
    const row = page.getByRole("row").filter({ hasText: name });
    await row.locator("button").first().click();
    await expect(page.getByRole("heading", { name: "Product Details" })).toBeVisible();
    await expect(page.getByText("Shelf Z / Row 9")).toBeVisible();
  });

  test("Adjust Stock: quantity 0 with the default Stock In type shows the '> zero' error, not the adjustment-specific one", async ({
    page,
  }) => {
    await loginViaStorage(page, "ADMIN");
    const name = uniqueName("Zero Qty Product");
    await createProduct(page, name);

    await page.goto("/inventory");
    await page.getByPlaceholder("Search name, code, brand...").fill(name);
    await page.getByTitle("Adjust Stock").first().click();
    await expect(page.getByRole("heading", { name: "Adjust Inventory Stock" })).toBeVisible();
    // Default movementType on open is "in" — leave it unchanged and submit qty 0.
    await page.locator('input[type="number"]').last().fill("0");
    await page.getByRole("button", { name: "Save Adjustment" }).click();
    await expect(page.getByText("Quantity must be greater than zero")).toBeVisible();
  });
});
