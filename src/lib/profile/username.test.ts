import { describe, expect, it } from 'vitest'
import { USERNAME_RULE_MESSAGE, validateUsername } from './username'

describe('validateUsername', () => {
  it.each(['abc', 'demo', 'a_1', 'A'.repeat(30), 'Some_User_99'])('accepts %s', value => {
    expect(validateUsername(value)).toBeNull()
  })

  it('rejects an empty value with its own message', () => {
    expect(validateUsername('')).toBe('Enter a username.')
  })

  it.each([
    ['too short', 'ab'],
    ['too long', 'a'.repeat(31)],
    ['containing a space', 'demo user'],
    ['containing a hyphen', 'demo-user'],
    ['containing punctuation', 'demo!'],
  ])('rejects a username %s', (_label, value) => {
    expect(validateUsername(value)).toBe(USERNAME_RULE_MESSAGE)
  })
})
