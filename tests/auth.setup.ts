import { test as setup, expect } from '@playwright/test'
import { STORAGE_STATE } from './helpers/paths'

/**
 * Signs in once and saves the session cookies for the `chromium-authenticated` project.
 *
 * Credentials default to the local dev user seeded by `supabase/seed.sql`
 * (`pnpm db:start && pnpm db:reset`). Point the app at local Supabase before running:
 * a hosted project has no such user. Override with TEST_USER_EMAIL / TEST_USER_PASSWORD.
 */
const email = process.env.TEST_USER_EMAIL ?? 'demo@example.com'
const password = process.env.TEST_USER_PASSWORD ?? 'password123'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  // A successful sign-in redirects away from /login; the home page greets the user.
  await expect(page.getByText('Gatavs šodienas treniņam?')).toBeVisible()

  await page.context().storageState({ path: STORAGE_STATE })
})
