import { test, expect } from '@playwright/test'

/**
 * Test plan: specs/basic-operations.md — the (authenticated) cases from
 * "Suite: Home screen" and "Suite: Route protection". They live here rather than
 * beside their signed-out siblings so they run in the `chromium-authenticated` project.
 *
 * Seed: tests/auth.setup.ts (signed in as the demo user).
 */

test('Home screen: signed-in header and action', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('Gatavs šodienas treniņam?')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mans profils' })).toHaveAttribute('href', '/profile')
  await expect(page.getByRole('link', { name: 'Pieslēgties' })).toHaveCount(0)
})

test('Route protection: signed-in user is bounced off login', async ({ page }) => {
  await page.goto('/login?redirectTo=/reizinasana')

  await expect(page).toHaveURL('/reizinasana')
  await expect(page.getByRole('heading', { name: 'Reizināšana' })).toBeVisible()
})
