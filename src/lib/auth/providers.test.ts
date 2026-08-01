import { describe, expect, it } from 'vitest'
import { OAUTH_PROVIDERS, isOAuthProvider } from './providers'

describe('isOAuthProvider', () => {
  it('accepts every configured provider', () => {
    for (const provider of OAUTH_PROVIDERS) {
      expect(isOAuthProvider(provider)).toBe(true)
    }
  })

  it('rejects anything else, including other Supabase providers', () => {
    expect(isOAuthProvider('apple')).toBe(false)
    expect(isOAuthProvider('')).toBe(false)
    expect(isOAuthProvider('constructor')).toBe(false)
  })
})
