import { test, expect } from "@playwright/test";
import { loginViaStorage } from "./utils/auth";
import { uniqueEmail, uniqueName, uniquePhone } from "./utils/factories";

test.describe("onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    await page.goto("/onboarding");
  });

  test("onboards a new technician", async ({ page }) => {
    const name = uniqueName("Playwright Technician");
    const email = uniqueEmail("pw-tech");
    const phone = uniquePhone();

    await page.getByRole("button", { name: "Onboard Personnel" }).click();
    await expect(page.getByRole("heading", { name: "Personnel Onboarding Terminal" })).toBeVisible();

    await page.getByPlaceholder("e.g. Vijay Raghavan").fill(name);
    await page.getByPlaceholder("v.raghavan@electrofix.com").fill(email);
    await page.getByPlaceholder("+91 98400 12345").fill(phone);
    await page.getByPlaceholder("••••••••").fill("Test@1234");
    await page.getByPlaceholder("e.g. 750").fill("700");
    await page.getByRole("button", { name: "Technician" }).click();

    await page.getByRole("button", { name: "Finalize Onboarding" }).click();

    await expect(page.getByText(name).first()).toBeVisible();
    await expect(page.getByText(email).first()).toBeVisible();
  });

  test("shows inline validation errors for an incomplete submission", async ({ page }) => {
    await page.getByRole("button", { name: "Onboard Personnel" }).click();
    await page.getByPlaceholder("e.g. Vijay Raghavan").fill("Al");
    await page.getByRole("button", { name: "Finalize Onboarding" }).click();

    await expect(page.getByText("Full legal name must be at least 3 characters")).toBeVisible();
    await expect(page.getByText("Digital ID (Email) is required")).toBeVisible();
  });
});

test("admin marks daily attendance for a technician", async ({ page }) => {
  await loginViaStorage(page, "ADMIN");
  await page.goto("/onboarding");

  const name = uniqueName("Attendance Technician");
  const email = uniqueEmail("pw-attendance");
  const phone = uniquePhone();

  await page.getByRole("button", { name: "Onboard Personnel" }).click();
  await page.getByPlaceholder("e.g. Vijay Raghavan").fill(name);
  await page.getByPlaceholder("v.raghavan@electrofix.com").fill(email);
  await page.getByPlaceholder("+91 98400 12345").fill(phone);
  await page.getByPlaceholder("••••••••").fill("Test@1234");
  await page.getByPlaceholder("e.g. 750").fill("700");
  await page.getByRole("button", { name: "Technician" }).click();
  await page.getByRole("button", { name: "Finalize Onboarding" }).click();
  await expect(page.getByText(name).first()).toBeVisible();

  await page.goto("/attendance");
  await page.getByRole("button", { name: "Daily Log Roster" }).click();
  await page.getByPlaceholder("Search employee...").fill(name);

  const row = page.getByRole("row").filter({ hasText: name });
  await row.getByRole("button", { name: "Present", exact: true }).first().click();
  // Toasts auto-dismiss quickly and are flaky to assert on — wait on the
  // actual API response instead.
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/attendance/bulk") && r.ok()),
    page.getByRole("button", { name: "Lock Attendance Sheet" }).click(),
  ]);
});
