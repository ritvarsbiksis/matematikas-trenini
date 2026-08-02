import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

/** Route prefixes that require an authenticated user. */
const PROTECTED_PREFIXES = ['/protected', '/profile', '/reizinasana']

/**
 * Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`, and the exported
 * `middleware()` function to `proxy()`. Behaviour is otherwise unchanged.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)

    const redirect = NextResponse.redirect(loginUrl)
    // Carry over any cookies the session refresh just rotated.
    response.cookies.getAll().forEach(cookie => {
      redirect.cookies.set(cookie)
    })

    return redirect
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match every request path except:
     * - _next/static  (build output)
     * - _next/image   (image optimizer)
     * - favicon.ico
     * - image files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
