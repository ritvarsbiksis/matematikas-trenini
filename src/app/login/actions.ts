'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { isOAuthProvider } from '@/lib/auth/providers'
import { safeRedirect } from '@/lib/auth/redirects'
import { readField } from '@/lib/formData'
import type { AuthState } from '@/lib/auth/authState'

function readCredentials(formData: FormData) {
  return {
    email: readField(formData, 'email').trim(),
    password: readField(formData, 'password'),
    // Never hand a raw query-string value to `redirect()` — see safeRedirect.
    redirectTo: safeRedirect(readField(formData, 'redirectTo')),
  }
}

async function getOrigin() {
  const headerList = await headers()
  const host = headerList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https'

  return `${protocol}://${host}`
}

export async function signIn(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password, redirectTo } = readCredentials(formData)

  if (!email || !password) {
    return { error: 'Email and password are both required.', message: null }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message, message: null }
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData)

  if (!email || !password) {
    return { error: 'Email and password are both required.', message: null }
  }

  const supabase = await createClient()
  const origin = await getOrigin()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })

  if (error) {
    return { error: error.message, message: null }
  }

  return { error: null, message: 'Check your inbox to confirm your email address.' }
}

export async function signInWithMagicLink(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email } = readCredentials(formData)

  if (!email) {
    return { error: 'Enter your email address first.', message: null }
  }

  const supabase = await createClient()
  const origin = await getOrigin()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })

  if (error) {
    return { error: error.message, message: null }
  }

  return { error: null, message: `Magic link sent to ${email}.` }
}

/**
 * Start an OAuth round trip.
 *
 * On the server `signInWithOAuth` does not navigate — it stashes the PKCE code
 * verifier in a cookie (allowed here, because Server Actions may write cookies)
 * and hands back the provider's authorize URL for us to redirect to.
 *
 * This is both sign-in and sign-up: Supabase creates the user on the first
 * successful callback.
 */
export async function signInWithOAuth(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const provider = readField(formData, 'provider')

  if (!isOAuthProvider(provider)) {
    return { error: 'Unknown sign-in provider.', message: null }
  }

  const next = safeRedirect(readField(formData, 'redirectTo'))
  const supabase = await createClient()
  const origin = await getOrigin()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  })

  if (error) {
    return { error: error.message, message: null }
  }

  // Leaves the app for the provider's consent screen; `/auth/callback` finishes
  // the flow by exchanging the returned code for a session.
  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login')
}
