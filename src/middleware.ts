import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE } from './lib/auth'

const PUBLIC_PATHS = ['/api/auth/login', '/favicon.ico']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    PUBLIC_PATHS.some((path) => pathname === path)
  ) {
    return NextResponse.next()
  }

  const authCookie = req.cookies.get(AUTH_COOKIE_NAME)?.value
  const isAuthed = authCookie === AUTH_COOKIE_VALUE

  if (pathname === '/login') {
    if (isAuthed) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (!isAuthed) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    if (pathname !== '/') {
      url.searchParams.set('next', pathname)
    }
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth/logout).*)'],
}
