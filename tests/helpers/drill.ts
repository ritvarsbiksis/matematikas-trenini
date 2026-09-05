import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Helpers for the multiplication drill (`/reizinasana`).
 *
 * Questions are generated at random on the client, so tests must read the operands out
 * of the DOM and compute the expected product rather than hard-coding answers.
 */

/** The three answer tiles — the only buttons on the screen whose label is a number. */
export function answerCards(page: Page): Locator {
  return page.getByRole('button').filter({ hasText: /^\d+$/ })
}

/** Reads the current question, e.g. "7 × 8", and returns its operands and product. */
export async function readQuestion(page: Page) {
  const text = await page.getByText(/^\d+ × \d+$/).innerText()
  const [left, right] = text.split('×').map(part => Number(part.trim()))

  expect(Number.isInteger(left) && Number.isInteger(right)).toBe(true)

  return { left, right, product: left * right, text }
}

/** Starts a drill from the idle screen and waits for the first question. */
export async function startDrill(page: Page) {
  await page.getByRole('button', { name: 'Sākt' }).click()
  await expect(page.getByText('1 / 10')).toBeVisible()
}
