import { test, expect } from "@playwright/test";
import { loginViaStorage } from "./utils/auth";
import { isOnScreen } from "./utils/layout";
import { VIEWPORTS } from "./utils/viewports";

// AppLayout.tsx / Sidebar.tsx: below the md breakpoint (768px) the sidebar
// becomes an off-canvas drawer (translate-x-full, pointer-events-none) opened
// via a hamburger button (aria-label="Open menu") in a mobile-only header,
// with a backdrop and a "Close sidebar" button. At/above md it's a static
// rail and the hamburger/close button are CSS-hidden (md:hidden) but still
// present in the DOM. Position is checked via bounding box (see utils/layout
// isOnScreen) rather than .toBeVisible() — confirmed via debugging that
// Playwright reports the off-canvas drawer as "visible" even when translated
// fully off-screen, since transform-based hiding isn't display/visibility.

test.describe("mobile navigation (< 768px)", () => {
  test.use({ viewport: VIEWPORTS.mobile });

  test("sidebar starts off-screen, hamburger brings it on-screen", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");

    const hamburger = page.getByRole("button", { name: "Open menu" });
    await expect(hamburger).toBeVisible();

    const dashboardLink = page.getByRole("link", { name: "Dashboard" });
    expect(await isOnScreen(dashboardLink, page), "sidebar should start off-screen on mobile").toBe(false);

    await hamburger.click();
    await page.waitForTimeout(350); // CSS transition (duration-300)
    expect(await isOnScreen(dashboardLink, page), "sidebar should be on-screen after opening").toBe(true);
    expect(await isOnScreen(page.getByRole("button", { name: "Close sidebar" }), page)).toBe(true);
  });

  test("clicking a nav link closes the drawer after navigating", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.waitForTimeout(350);

    const customersLink = page.getByRole("link", { name: "Customers" });
    expect(await isOnScreen(customersLink, page)).toBe(true);
    await customersLink.click();

    await expect(page).toHaveURL(/\/customers$/);
    await page.waitForTimeout(350);
    expect(await isOnScreen(page.getByRole("link", { name: "Dashboard" }), page)).toBe(false);
  });

  test("close button collapses the drawer again", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.waitForTimeout(350);
    await page.getByRole("button", { name: "Close sidebar" }).click();
    await page.waitForTimeout(350);
    expect(await isOnScreen(page.getByRole("link", { name: "Dashboard" }), page)).toBe(false);
  });
});

test.describe("desktop navigation (>= 768px)", () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test("sidebar is always on-screen, hamburger is not shown", async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    expect(await isOnScreen(page.getByRole("link", { name: "Dashboard" }), page)).toBe(true);
    await expect(page.getByRole("button", { name: "Open menu" })).not.toBeVisible();
  });
});
