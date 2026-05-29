import { NextRequest, NextResponse } from 'next/server'

// Routes that require authentication
const PROTECTED = ['/today', '/settings', '/reports', '/gamification', '/groups', '/profile', '/admin', '/premium', '/themes', '/support', '/export', '/prayer-times']

// Routes only for guests (redirect to /today if logged in)
const GUEST_ONLY = ['/login', '/register', '/welcome']

// Edge-compatible JWT decode (no Node.js crypto needed)
function decodeToken(token: string): { userId: string; exp?: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    if (payload.exp && payload.exp < Date.now() / 1000) return null
    return payload
  } catch {
    return null
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('yw_token')?.value
  const payload = token ? decodeToken(token) : null
  const isLoggedIn = !!payload

  // Root → redirect based on auth state
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(isLoggedIn ? '/today' : '/welcome', req.url)
    )
  }

  // Protected routes — must be logged in
  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  if (isProtected && !isLoggedIn) {
    const url = new URL('/login', req.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Guest-only routes — redirect away if already logged in
  const isGuestOnly = GUEST_ONLY.some(p => pathname.startsWith(p))
  if (isGuestOnly && isLoggedIn) {
    return NextResponse.redirect(new URL('/today', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|icons|manifest.json|sw.js|favicon.ico).*)',
  ],
}
