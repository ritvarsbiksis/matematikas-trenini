import { describe, expect, it } from 'vitest'
import { safeRedirect } from './redirects'

describe('safeRedirect', () => {
  it('passes same-origin paths through untouched', () => {
    expect(safeRedirect('/protected')).toBe('/protected')
    expect(safeRedirect('/settings/profile?tab=email')).toBe('/settings/profile?tab=email')
  })

  it('rejects absolute URLs pointing at another origin', () => {
    expect(safeRedirect('https://evil.com')).toBe('/protected')
    expect(safeRedirect('http://evil.com/login')).toBe('/protected')
  })

  it('rejects protocol-relative URLs, which browsers treat as another host', () => {
    expect(safeRedirect('//evil.com')).toBe('/protected')
  })

  it('falls back when the value is missing or not a path', () => {
    expect(safeRedirect('')).toBe('/protected')
    expect(safeRedirect('protected')).toBe('/protected')
  })

  it('honours a caller-supplied fallback', () => {
    expect(safeRedirect('https://evil.com', '/')).toBe('/')
  })
})
