import { test, expect, type Page } from '@playwright/test'

/**
 * Test plan: specs/basic-operations.md — "Suite: Home screen".
 * Seed: seed.spec.ts (unauthenticated visit to the home page).
 */

const WORLDS = [
  { title: 'Reizināšana', subtitle: '1 × 1 līdz 10 × 10' },
  { title: 'Saskaitīšana', subtitle: 'Drīzumā' },
  { title: 'Atņemšana', subtitle: 'Drīzumā' },
  { title: 'Dalīšana', subtitle: 'Drīzumā' },
]

/** A world tile is either a `<a>` (playable) or an `aria-disabled` `<div>` (coming soon). */
function tile(page: Page, title: string) {
  return page.locator('main div, main a').filter({ hasText: title }).last()
}

test.describe('Home screen', () => {
  test('shows the four training worlds', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Matemātikas treniņi 🚀')
    await expect(page.getByRole('heading', { name: 'Izvēlies pasauli' })).toBeVisible()

    for (const world of WORLDS) {
      const card = tile(page, world.title)
      await expect(card).toBeVisible()
      await expect(card).toContainText(world.subtitle)
    }
  })

  test('only multiplication is a link', async ({ page }) => {
    await page.goto('/')

    const multiplication = page.getByRole('link', { name: /Reizināšana/ })
    await expect(multiplication).toHaveAttribute('href', '/reizinasana')

    for (const title of ['Saskaitīšana', 'Atņemšana', 'Dalīšana']) {
      await expect(page.getByRole('link', { name: new RegExp(title) })).toHaveCount(0)
      await expect(tile(page, title)).toHaveAttribute('aria-disabled', 'true')
    }
  })

  test('signed-out header and action', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Sveiks!')).toBeVisible()
    await expect(page.getByText('Pieslēdzies, lai sāktu trenēties.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pieslēgties' })).toHaveAttribute('href', '/login')
    await expect(page.getByRole('link', { name: 'Mans profils' })).toHaveCount(0)
  })
})
