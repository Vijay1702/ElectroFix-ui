import { Page } from "@playwright/test";

// The app's SearchableSelect combobox (src/components/shared/SearchableSelect.tsx)
// has no ARIA combobox/listbox role and no data-testid. Actual DOM (confirmed
// via a debug snapshot, not guessed): `<label>Client Name<span>*</span></label>`
// followed by `<div class="relative"><button>...` — the "*" is a child of the
// label (so its concatenated text is "Client Name*", breaking exact-text
// matches), and the trigger button is nested inside the label's next sibling
// div, not a direct sibling itself. `following::button[1]` (document order,
// not just direct siblings) reaches it without depending on that nesting.
export async function pickSearchableSelect(page: Page, labelText: string, optionText: string) {
  const trigger = page.locator(`xpath=//label[contains(., "${labelText}")]/following::button[1]`);
  // The Drawer has its own internal scroll container (a taller edit form can
  // put fields below the fold); scrollIntoViewIfNeeded handles that directly
  // rather than relying on click()'s auto-scroll, which was landing the
  // element outside the drawer's visible clipped area.
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  // Option rows render as "<Name> (<phone>)" for customers/technicians, so an
  // exact-text match never hits — and the unfiltered list can contain many
  // rows accumulated from prior runs, so type into the search box first to
  // narrow it down to the one we want.
  await page.getByPlaceholder("Search...").fill(optionText);
  await page.getByRole("button", { name: optionText }).first().click();
}
