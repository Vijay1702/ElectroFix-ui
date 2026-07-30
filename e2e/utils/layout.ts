import { Locator, Page } from "@playwright/test";

// True if the page's own layout forces the document wider than the viewport
// (a broken/unresponsive layout) — as opposed to an intentional horizontal
// scroll container inside a wide table (Table.tsx wraps every table in
// overflow-x-auto by design), which does NOT make documentElement wider.
export async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}

// The app's Drawers/Modals/Sidebar are never unmounted — they're always in the
// DOM and hidden via CSS transform (translate-x-full / -translate-x-full),
// not display:none. Playwright's .toBeVisible()/.isVisible() only checks
// display/visibility/size, NOT whether a transform has pushed the element
// outside the viewport, so it reports these as "visible" even fully
// off-screen. This checks actual on-screen position instead. Returns false
// for elements that aren't rendered at all (boundingBox() null, e.g. real
// display:none) too.
export async function isOnScreen(locator: Locator, page: Page): Promise<boolean> {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) return false;
  return box.x + box.width > 0 && box.x < viewport.width && box.y + box.height > 0 && box.y < viewport.height;
}

// Same idea across every element matching a locator (e.g. a button whose text
// appears both on an off-screen drawer's own submit button AND, at wider
// viewports, on the toolbar trigger that opens it) — true if ANY match is
// actually on-screen right now.
export async function anyOnScreen(locator: Locator, page: Page): Promise<boolean> {
  const count = await locator.count();
  for (let i = 0; i < count; i++) {
    if (await isOnScreen(locator.nth(i), page)) return true;
  }
  return false;
}
