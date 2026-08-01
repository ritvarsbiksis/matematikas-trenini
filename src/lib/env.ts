/**
 * `NEXT_PUBLIC_*` variables must be read with **literal** keys. Next.js inlines them
 * at build time via static analysis, so a dynamic lookup like `process.env[name]`
 * resolves to `undefined` in the browser bundle.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export type SupabaseEnv = {
  url: string
  anonKey: string
}

export function getSupabaseEnv(): SupabaseEnv {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Copy `.env.example` to `.env.local` and set ' +
        'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    )
  }

  return { url: supabaseUrl, anonKey: supabaseAnonKey }
}
