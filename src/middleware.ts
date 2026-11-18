import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  AUTH_COOKIE_NAME,
  SESSION_SECRET,
} from './lib/auth'
import { verifySession } from './lib/session'

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/me',
  '/api/health',
  '/favicon.ico',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/static/') ||
    PUBLIC_PATHS.some((path) => pathname === path)
  ) {
    return NextResponse.next()
  }

  const session = await verifySession(req.cookies.get(AUTH_COOKIE_NAME)?.value, SESSION_SECRET)
  const isAuthed = Boolean(session)
  const isAdmin = session?.role === 'admin'

  if (pathname === '/login') {
    if (isAuthed) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (!isAuthed) {
    // Return API-friendly error for admin API calls
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = req.nextUrl.clone()
    url.pathname = '/login'
    if (pathname !== '/') {
      url.searchParams.set('next', pathname)
    }
    return NextResponse.redirect(url)
  }

  if (pathname === '/admin' && !isAdmin) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/api/admin') && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth/logout).*)'],
}
