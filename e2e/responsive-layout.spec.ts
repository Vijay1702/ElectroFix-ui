import { test, expect } from "@playwright/test";
import { loginViaStorage } from "./utils/auth";
import { hasHorizontalOverflow } from "./utils/layout";
import { VIEWPORTS, ViewportName } from "./utils/viewports";
import { E2E_USERS } from "./utils/fixtures-data";

// Every page already covered by the functional e2e suite, checked for the
// most common responsive-design regression: content forcing the page wider
// than the viewport (a broken layout), as opposed to the app's deliberate
// horizontal-scroll table containers (Table.tsx wraps every table in
// overflow-x-auto by design — that's scoped to the table, not the document,
// so it does not trip this check).
const PAGES: Array<{ path: string; role: keyof typeof E2E_USERS; label: string }> = [
  { path: "/dashboard", role: "ADMIN", label: "Dashboard (ADMIN)" },
  { path: "/dashboard", role: "MONITOR", label: "Dashboard (MONITOR — MonitorDashboard)" },
  { path: "/onboarding", role: "ADMIN", label: "Onboarding" },
  { path: "/attendance", role: "ADMIN", label: "Attendance (ADMIN — tabs)" },
  { path: "/attendance", role: "TECHNICIAN", label: "Attendance (TECHNICIAN — calendar grid)" },
  { path: "/customers", role: "ADMIN", label: "Customers" },
  { path: "/repairs", role: "ADMIN", label: "Repairs" },
  { path: "/products", role: "ADMIN", label: "Products" },
  { path: "/inventory", role: "ADMIN", label: "Inventory" },
  { path: "/invoices", role: "ADMIN", label: "Invoices" },
  { path: "/audit", role: "MONITOR", label: "Audit" },
];

for (const viewportName of Object.keys(VIEWPORTS) as ViewportName[]) {
  test.describe(`${viewportName} (${VIEWPORTS[viewportName].width}px) — no horizontal page overflow`, () => {
    test.use({ viewport: VIEWPORTS[viewportName] });

    for (const { path, role, label } of PAGES) {
      test(`${label} at ${path}`, async ({ page }) => {
        await loginViaStorage(page, role);
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        expect(await hasHorizontalOverflow(page), `${label} overflows horizontally at ${viewportName}`).toBe(false);
      });
    }
  });
}
