import type { Locator, Page } from "@playwright/test"

// A board card, found by the heading it shows.
// Pass `exact` when a shorter title would otherwise also match a longer one, such as "Today" against "Today's reminder".
export const cardByTitle = (page: Page, title: string, exact = false): Locator =>
  page
    .locator(".board-row")
    .filter({ has: page.getByRole("heading", { name: title, exact }) })

// A bounding box that is known to exist, so the caller can do arithmetic on it without a null check of its own.
// `what` names the thing being measured, since a bare "no bounds" failure gives nothing to go on.
export const boxOf = async (locator: Locator, what: string) => {
  const box = await locator.boundingBox()

  if (!box) {
    throw new Error(`Unable to measure ${what}`)
  }

  return box
}
