/**
 * Username rules, kept in one place so the client input, the Server Action and the
 * database constraint (`profiles_username_format` in `0002_profile_username.sql`)
 * cannot drift apart.
 */

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30

/** Bare string so it can be handed straight to an `<input pattern>` attribute. */
export const USERNAME_PATTERN = '^[A-Za-z0-9_]{3,30}$'

export const USERNAME_RULE_MESSAGE =
  'Usernames must be 3-30 characters, using only letters, numbers and underscores.'

/** Returns an error message, or `null` when the username is acceptable. */
export function validateUsername(value: string): string | null {
  if (!value) {
    return 'Enter a username.'
  }

  return new RegExp(USERNAME_PATTERN).test(value) ? null : USERNAME_RULE_MESSAGE
}
