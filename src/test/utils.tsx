import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import type { RenderOptions } from '@testing-library/react'

/**
 * Render a component with the app's providers attached.
 *
 * Tests should import `renderWithProviders` (and everything else) from this module
 * rather than from `@testing-library/react` directly — when a provider is added to
 * the app, it goes in `Providers` below and every test picks it up for free.
 */
function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return {
    // Set up user-event before render, per Testing Library's guidance.
    user: userEvent.setup(),
    ...render(ui, { wrapper: Providers, ...options }),
  }
}

export * from '@testing-library/react'
export { userEvent }
