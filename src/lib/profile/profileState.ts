/**
 * Shared shape for the profile Server Actions.
 *
 * Like `src/lib/auth/authState.ts`, this deliberately lives outside `actions.ts`:
 * a `'use server'` module may only export async functions, so the constant below
 * cannot be declared there.
 */
export type ProfileState = {
  error: string | null
  message: string | null
}

export const initialProfileState: ProfileState = { error: null, message: null }
