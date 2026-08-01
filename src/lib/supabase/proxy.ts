import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { getSupabaseEnv } from '@/lib/env'
import type { Database } from './database.types'

export type SessionResult = {
  response: NextResponse
  user: User | null
}

/**
 * Refreshes the Supabase auth session and forwards the rotated cookies onto the
 * response. Called from `src/proxy.ts` on every matched request.
 */
export async function updateSession(request: NextRequest): Promise<SessionResult> {
  let response = NextResponse.next({ request })

  const { url, anonKey } = getSupabaseEnv()

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({ request })

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })

        // A response that sets auth cookies must never be cached by a CDN or reverse
        // proxy — otherwise one user's session token can be served to another.
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      },
    },
  })

  // `getUser()` revalidates the token against the Auth server. Do not swap this for
  // `getSession()`, which trusts the cookie contents without verifying them.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}
