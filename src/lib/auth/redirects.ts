/**
 * Constrain a post-auth redirect target to this origin.
 *
 * `redirectTo` reaches us from a query string (`/login?redirectTo=…`) and rides
 * through the OAuth round trip as `?next=`, so it is attacker-controllable: a
 * crafted link would otherwise bounce a freshly signed-in user to an external
 * site that looks like a continuation of the login flow.
 *
 * Only same-origin absolute paths are allowed. `//evil.com` is rejected too —
 * browsers read a protocol-relative URL as a different host.
 */
export function safeRedirect(value: string, fallback = '/protected'): string {
  return value.startsWith('/') && !value.startsWith('//') ? value : fallback
}
