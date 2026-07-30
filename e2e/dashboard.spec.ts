import { test, expect } from "@playwright/test";
import { loginViaStorage } from "./utils/auth";
import { VIEWPORTS } from "./utils/viewports";

// Previously the dashboard had zero functional coverage — only incidental
// touches (login redirect target, nav link visibility, page-level overflow
// check). This covers the real ADMIN/TECHNICIAN dashboard (index.tsx) and the
// separate MONITOR-only dashboard (MonitorDashboard.tsx, swapped in by role,
// same route/URL — no redirect to distinguish them), plus responsive/design
// checks specific to this page's own widgets.

test.describe("ADMIN dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, "ADMIN");
    await page.goto("/dashboard");
  });

  test("renders the header, stat cards, and section headings", async ({ page }) => {
    await expect(page.getByText(/Welcome back, /)).toBeVisible();
    await expect(page.getByText("Active Repairs")).toBeVisible();
    await expect(page.getByText("Pending to Deliver")).toBeVisible();
    await expect(page.getByText("Throughput")).toBeVisible();
    await expect(page.getByText("Net Revenue")).toBeVisible(); // ADMIN gets the revenue card, not "Staff Efficiency"

    await expect(page.getByRole("heading", { name: "Active Repair Stream" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Shop Vitals" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Quick Actions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Workforce Utilization" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Low Stock Details" })).toBeVisible();
  });

  test("Shop Vitals shows the fixed Live Clients / Catalog Assets / Critical Stock rows", async ({ page }) => {
    await expect(page.getByText("Live Clients")).toBeVisible();
    await expect(page.getByText("Catalog Assets")).toBeVisible();
    await expect(page.getByText("Critical Stock")).toBeVisible();
  });

  test("Quick Actions has all 4 admin actions and each navigates correctly", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Inventory Registry/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Client Records/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Financial Registry/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Job Archives/ })).toBeVisible();

    await page.getByRole("button", { name: /Client Records/ }).click();
    await expect(page).toHaveURL(/\/customers$/);

    await page.goto("/dashboard");
    await page.getByRole("button", { name: /Financial Registry/ }).click();
    await expect(page).toHaveURL(/\/invoices$/);
  });

  test('"View Registry" on the Active Repair Stream widget navigates to /repairs', async ({ page }) => {
    await page.getByRole("button", { name: "View Registry" }).click();
    await expect(page).toHaveURL(/\/repairs$/);
  });

  test("date range picker opens, offers quick-select presets, and applying one updates the range and refetches", async ({
    page,
  }) => {
    // Hand-rolled div trigger (not a real <select>/<button> with a stable
    // name) — located by its displayed "DD Mon YYYY - DD Mon YYYY" text.
    const trigger = page.getByText(/\d{2} \w{3} \d{4} - \d{2} \w{3} \d{4}/);
    await expect(trigger).toBeVisible();
    const initialRangeText = await trigger.textContent();
    await trigger.click();

    await expect(page.getByText("Custom Range")).toBeVisible();
    await expect(page.getByText("Quick Select")).toBeVisible();
    await expect(page.getByRole("button", { name: "Today" })).toBeVisible();
    await expect(page.getByRole("button", { name: "This Week" })).toBeVisible();
    await expect(page.getByRole("button", { name: "This Month" })).toBeVisible();
    await expect(page.getByRole("button", { name: "This Year" })).toBeVisible();
    await expect(page.getByRole("button", { name: "All Time" })).toBeVisible();

    // Confirmed via screenshot: clicking a preset applies it and closes the
    // popover immediately — no separate "Done" step for presets (that button
    // is for the custom-range date inputs instead).
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/dashboard/summary") && r.ok()),
      page.getByRole("button", { name: "All Time" }).click(),
    ]);

    await expect(page.getByText("Custom Range")).toHaveCount(0);
    await expect(trigger).not.toHaveText(initialRangeText || "");
  });
});

test.describe("TECHNICIAN dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, "TECHNICIAN");
    await page.goto("/dashboard");
  });

  test("has no date range picker and shows the static Staff Efficiency card instead of Net Revenue", async ({
    page,
  }) => {
    await expect(page.getByText(/\d{2} \w{3} \d{4} - \d{2} \w{3} \d{4}/)).toHaveCount(0);
    await expect(page.getByText("Staff Efficiency")).toBeVisible();
    await expect(page.getByText("92%")).toBeVisible();
    await expect(page.getByText("Net Revenue")).toHaveCount(0);
  });

  test("Quick Actions only offers Inventory Registry and Job Archives (no Client Records / Financial Registry)", async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: /Inventory Registry/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Job Archives/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Client Records/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Financial Registry/ })).toHaveCount(0);
  });
});

test.describe("MONITOR dashboard (separate MonitorDashboard.tsx, same URL)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, "MONITOR");
    await page.goto("/dashboard");
  });

  test("renders its own header, stat cards, and chart/widget headings distinct from the admin dashboard", async ({
    page,
  }) => {
    await expect(page.getByRole("heading", { name: "System Overview" })).toBeVisible();
    await expect(page.getByText("Gross Revenue")).toBeVisible();
    await expect(page.getByText("Active Jobs")).toBeVisible();
    await expect(page.getByText("Items Low on Stock")).toBeVisible();
    await expect(page.getByText("Customers Served")).toBeVisible();

    await expect(page.getByRole("heading", { name: "Operations Performance (Revenue)" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Repair Pipeline" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Top Products" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Top Repair Devices" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Top Customers" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Technician Workload" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Stock Alerts" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent Jobs" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent Sales" })).toBeVisible();
  });

  test("Repair Pipeline renders a custom HTML legend with the 3 status buckets", async ({ page }) => {
    await expect(page.getByText("Active & Not Started")).toBeVisible();
    await expect(page.getByText("Pending Delivery")).toBeVisible();
    await expect(page.getByText("Completed Today")).toBeVisible();
  });

  test("Recent Jobs and Recent Sales tables have the expected column headers", async ({ page }) => {
    const jobsTable = page.locator("table", { has: page.getByRole("columnheader", { name: "Job No." }) });
    await expect(jobsTable.getByRole("columnheader", { name: "Device" })).toBeVisible();
    await expect(jobsTable.getByRole("columnheader", { name: "Status" })).toBeVisible();

    const salesTable = page.locator("table", { has: page.getByRole("columnheader", { name: "Inv No." }) });
    await expect(salesTable.getByRole("columnheader", { name: "Client" })).toBeVisible();
    await expect(salesTable.getByRole("columnheader", { name: "Amount" })).toBeVisible();
  });
});

test.describe("dashboard responsive design", () => {
  // Unlike Customers/Repairs (whose whole toolbar is `hidden md:block` with no
  // mobile equivalent), the dashboard has no such gate in its source — it
  // should stay usable at every breakpoint. Note: this uses plain
  // .toBeVisible(), not the isOnScreen bounding-box helper used for the
  // Sidebar/Drawer elsewhere — dashboard sections are ordinary scrollable
  // content (not CSS-transform-hidden), so requiring them to be within the
  // current scroll position without scrolling would be testing an unreasonable
  // bar, not a real responsive-design bug. .toBeVisible() correctly reports
  // below-the-fold-but-normally-rendered content as visible.
  for (const viewportName of ["mobile", "tablet", "desktop"] as const) {
    test(`ADMIN dashboard: stat cards and Quick Actions render without horizontal overflow at ${viewportName} (${VIEWPORTS[viewportName].width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize(VIEWPORTS[viewportName]);
      await loginViaStorage(page, "ADMIN");
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      await expect(page.getByText("Active Repairs").first()).toBeVisible();
      const jobArchives = page.getByRole("button", { name: /Job Archives/ }).first();
      await jobArchives.scrollIntoViewIfNeeded();
      await expect(jobArchives).toBeVisible();
    });

    test(`MONITOR dashboard: stat cards and widgets render without horizontal overflow at ${viewportName} (${VIEWPORTS[viewportName].width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize(VIEWPORTS[viewportName]);
      await loginViaStorage(page, "MONITOR");
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      await expect(page.getByText("Gross Revenue").first()).toBeVisible();
      const recentJobs = page.getByRole("heading", { name: "Recent Jobs" }).first();
      await recentJobs.scrollIntoViewIfNeeded();
      await expect(recentJobs).toBeVisible();
    });
  }
});
