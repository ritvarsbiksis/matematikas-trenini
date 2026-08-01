import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv } from '@/lib/env'
import type { Database } from './database.types'

/**
 * Supabase client for Client Components. Reads and writes the auth cookies via
 * `document.cookie`, so it stays in sync with the server-side client.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv()

  return createBrowserClient<Database>(url, anonKey)
}
