/**
 * Shared shape for the auth Server Actions.
 *
 * This deliberately lives outside `actions.ts`: a `'use server'` module may only
 * export async functions, so the constant below cannot be declared there.
 */
export type AuthState = {
  error: string | null
  message: string | null
}

export const initialAuthState: AuthState = { error: null, message: null }
