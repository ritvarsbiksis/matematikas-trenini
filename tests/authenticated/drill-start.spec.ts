import { test, expect } from '@playwright/test'
import { answerCards, readQuestion, startDrill } from '../helpers/drill'

/**
 * Test plan: specs/basic-operations.md — "Suite: Drill start screen (authenticated)".
 * Seed: tests/auth.setup.ts (signed in as the demo user).
 */

test.describe('Drill start screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reizinasana')
  })

  test('intro copy and actions', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reizināšana' })).toBeVisible()
    await expect(
      page.getByText('10 piemēri ar reizināšanu no 1 līdz 10. Izvēlies pareizo atbildi!'),
    ).toBeVisible()

    await expect(page.getByRole('button', { name: 'Sākt' })).toBeEnabled()
    await expect(page.getByRole('link', { name: 'Uz Sākumu' })).toHaveAttribute('href', '/')
    await expect(page.getByRole('link', { name: 'Statistika' })).toHaveAttribute(
      'href',
      '/statistika',
    )
  })

  test('starting shows the first question', async ({ page }) => {
    await startDrill(page)

    const { left, right } = await readQuestion(page)
    expect(left).toBeGreaterThanOrEqual(1)
    expect(left).toBeLessThanOrEqual(10)
    expect(right).toBeGreaterThanOrEqual(1)
    expect(right).toBeLessThanOrEqual(10)

    await expect(page.getByText('= ?')).toBeVisible()
    await expect(answerCards(page)).toHaveCount(3)
    await expect(page.getByText('Izvēlies pareizo atbildi', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Beigt treniņu' })).toBeVisible()

    // The intro screen is gone once the drill is running.
    await expect(page.getByRole('button', { name: 'Sākt' })).toHaveCount(0)
  })

  test('the correct answer is always offered', async ({ page }) => {
    await startDrill(page)

    const { product } = await readQuestion(page)
    const options = (await answerCards(page).allInnerTexts()).map(Number)

    expect(options).toHaveLength(3)
    expect(options).toContain(product)
    expect(new Set(options).size).toBe(3)
    expect(options.every(option => option > 0)).toBe(true)
  })
})
