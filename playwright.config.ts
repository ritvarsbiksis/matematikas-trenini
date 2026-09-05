import { defineConfig, devices } from '@playwright/test'
import { STORAGE_STATE } from './tests/helpers/paths'

const baseURL = process.env.BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      // Signed-out suites. Must not inherit the saved session.
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/authenticated/**'],
    },
    {
      // Suites under tests/authenticated/ run as the demo user.
      name: 'chromium-authenticated',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      testMatch: ['**/authenticated/**/*.spec.ts'],
      dependencies: ['setup'],
    },
  ],
  // Reuses an already-running `pnpm dev` locally; starts one on CI.
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
