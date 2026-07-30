import { Page } from "@playwright/test";

// The app's Drawer/Modal (src/components/shared/Drawer.tsx, Modal.tsx) stays
// mounted in the DOM even when closed (positioned off-screen via CSS, not
// unmounted) — confirmed via a failing test's page snapshot, which showed both
// the toolbar trigger AND the drawer's own submit button in the accessibility
// tree simultaneously before any click. When trigger and submit share the same
// text (e.g. both are "Add Customer"), DOM order disambiguates them: the
// toolbar button always renders before the drawer, so .first() opens it and
// .last() submits it.
export async function openDrawer(page: Page, buttonText: string) {
  await page.getByRole("button", { name: buttonText }).first().click();
}

// waitForUrlSubstring, if given, waits for a matching successful API response
// alongside the click — more reliable than asserting on the resulting UI text,
// which occasionally lost the race against the request completing.
export async function submitDrawer(page: Page, buttonText: string, waitForUrlSubstring?: string) {
  const button = page.getByRole("button", { name: buttonText }).last();
  if (waitForUrlSubstring) {
    await Promise.all([
      page.waitForResponse((r) => r.url().includes(waitForUrlSubstring) && r.request().method() === "POST" && r.ok()),
      button.click(),
    ]);
  } else {
    await button.click();
  }
}
