import { test, expect } from "@playwright/test";
import { loginViaUI } from "./utils/auth";
import { E2E_PASSWORD, E2E_USERS } from "./utils/fixtures-data";

test.describe("login", () => {
  test("renders the login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In to System" })).toBeVisible();
  });

  test("shows an error for invalid credentials and stays on /login", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(E2E_USERS.ADMIN.email);
    await page.locator('input[type="password"]').fill("wrong-password");
    await page.getByRole("button", { name: "Sign In to System" }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("empty submit is blocked by native required validation", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign In to System" }).click();
    const emailValidity = await page.locator('input[type="email"]').evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(emailValidity).toBe(false);
    await expect(page).toHaveURL(/\/login$/);
  });

  test("valid login redirects to /dashboard and shows the sidebar", async ({ page }) => {
    await loginViaUI(page, E2E_USERS.ADMIN.email, E2E_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("logout confirmation flow signs the user out", async ({ page }) => {
    await loginViaUI(page, E2E_USERS.ADMIN.email, E2E_PASSWORD);

    await page.getByRole("button", { name: "Logout" }).click();
    // Two "Logout" texts exist once the dialog opens (sidebar trigger + dialog confirm) —
    // scope to the confirm dialog, which is the last one rendered.
    await page.getByRole("button", { name: "Logout" }).last().click();

    await expect(page).toHaveURL(/\/login$/);
  });
});
