import type { Provider } from '@supabase/supabase-js'

/**
 * OAuth providers this app offers.
 *
 * `satisfies readonly Provider[]` checks each id against the union Supabase
 * accepts, so a typo is a compile error rather than a runtime 400.
 *
 * Adding a provider here is not enough on its own — it also needs an
 * `[auth.external.<id>]` block in `supabase/config.toml` (or the equivalent in
 * the hosted dashboard) and an entry in `OAuthButtons`.
 */
export const OAUTH_PROVIDERS = [
  'google',
  'github',
  'facebook',
] as const satisfies readonly Provider[]

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]

/**
 * The provider arrives from a form field, so it is untrusted input and has to
 * be narrowed before it reaches `signInWithOAuth`.
 */
export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value)
}
