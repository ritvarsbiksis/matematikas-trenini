import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeRedirect } from '@/lib/auth/redirects'

/**
 * PKCE callback. Supabase redirects here after email confirmation, a magic link,
 * or an OAuth provider round trip, with a `code` to exchange for a session.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  // `next` survives a round trip through the provider, so treat it as untrusted.
  const next = safeRedirect(searchParams.get('next') ?? '')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  const message = encodeURIComponent('Could not sign you in. The link may have expired.')

  return NextResponse.redirect(`${origin}/login?error=${message}`)
}
