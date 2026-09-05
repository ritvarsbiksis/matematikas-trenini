import { test, expect } from '@playwright/test'

/**
 * Test plan: specs/basic-operations.md — "Suite: Route protection".
 * Seed: seed.spec.ts (unauthenticated visit to the home page).
 *
 * The guard lives in src/proxy.ts: any path under PROTECTED_PREFIXES is bounced to
 * /login with the original pathname preserved in `redirectTo`.
 */

test.describe('Route protection', () => {
  test('drill redirects when signed out', async ({ page }) => {
    await page.goto('/reizinasana')

    await expect(page).toHaveURL('/login?redirectTo=%2Freizinasana')
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('statistics redirects when signed out', async ({ page }) => {
    await page.goto('/statistika')

    await expect(page).toHaveURL('/login?redirectTo=%2Fstatistika')
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('session detail redirects when signed out', async ({ page }) => {
    await page.goto('/statistika/abc-123')

    await expect(page).toHaveURL('/login?redirectTo=%2Fstatistika%2Fabc-123')
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })
})
