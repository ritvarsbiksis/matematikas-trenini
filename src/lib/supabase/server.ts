import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseEnv } from '@/lib/env'
import type { Database } from './database.types'

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Always `await` this — `cookies()` is async in the App Router.
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseEnv()
  const cookieStore = await cookies()

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot write cookies. This is safe to ignore because
          // `src/proxy.ts` refreshes the session on every matched request.
        }
      },
    },
  })
}
