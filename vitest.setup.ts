import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library auto-cleans when `globals: true`, but this keeps the behaviour
// explicit and correct if that flag is ever turned off.
afterEach(() => {
  cleanup()
})
