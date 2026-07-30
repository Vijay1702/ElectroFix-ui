import { test, expect } from "@playwright/test";
import { loginViaStorage } from "./utils/auth";
import { anyOnScreen } from "./utils/layout";
import { VIEWPORTS } from "./utils/viewports";

// Checks whether each page's primary "Add X" action is actually usable
// (on-screen, not just "matched by locator") at each breakpoint. Note: the
// same accessible name can match TWO elements at once — the toolbar's trigger
// button AND the create Drawer's own submit button, which stays mounted
// off-screen (translate-x-full) even when never opened — so this uses
// anyOnScreen rather than a plain count/visibility assertion (see
// utils/layout.ts for why .toBeVisible() alone is unreliable here).
//
// mobileReachable reflects CONFIRMED, actual per-page behavior (verified by
// running these checks against the real app), not an assumption: Customers
// and Repairs wrap their whole toolbar in `hidden md:block` with no mobile
// equivalent, so creating there is desktop/tablet-only. Products, Onboarding,
// and Invoices do NOT do this — their "Add" action stays reachable on mobile
// too. That's a real inconsistency in the app's responsive design across
// otherwise near-identical DataTable-based pages, not a test artifact.
const PRIMARY_ACTION_PAGES = [
  { path: "/customers", buttonName: "Add Customer", mobileReachable: false },
  { path: "/repairs", buttonName: "New Repair Job", mobileReachable: false },
  { path: "/products", buttonName: "Add Product", mobileReachable: true },
  { path: "/onboarding", buttonName: "Onboard Personnel", mobileReachable: true },
  { path: "/invoices", buttonName: "Generate Invoice", mobileReachable: true },
];

for (const { path, buttonName, mobileReachable } of PRIMARY_ACTION_PAGES) {
  test(`${path}: primary "${buttonName}" action across breakpoints (mobile ${
    mobileReachable ? "reachable" : "hidden — no mobile equivalent"
  })`, async ({ page }) => {
    await loginViaStorage(page, "ADMIN");

    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await anyOnScreen(page.getByRole("button", { name: buttonName }), page)).toBe(mobileReachable);

    await page.setViewportSize(VIEWPORTS.tablet);
    expect(
      await anyOnScreen(page.getByRole("button", { name: buttonName }), page),
      `"${buttonName}" should be reachable at tablet width on ${path}`
    ).toBe(true);

    await page.setViewportSize(VIEWPORTS.desktop);
    expect(
      await anyOnScreen(page.getByRole("button", { name: buttonName }), page),
      `"${buttonName}" should be reachable at desktop width on ${path}`
    ).toBe(true);
  });
}
