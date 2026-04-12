import type { NextApiRequest } from 'next'

export type UserRole = 'user' | 'admin'

export const AUTH_COOKIE_NAME = 'songhub_auth'
export const AUTH_COOKIE_VALUE = 'ok'
export const AUTH_ROLE_COOKIE_NAME = 'songhub_role'
export const AUTH_USER_COOKIE_NAME = 'songhub_user'

export const LOGIN_USERNAME = process.env.SONGHUB_LOGIN_USERNAME ?? ''
export const LOGIN_PASSWORD = process.env.SONGHUB_LOGIN_PASSWORD ?? ''

export const ADMIN_USERNAME = process.env.SONGHUB_ADMIN_USERNAME ?? ''
export const ADMIN_PASSWORD = process.env.SONGHUB_ADMIN_PASSWORD ?? ''

export interface AuthResult {
  valid: boolean
  role: UserRole
  username: string
}

export const resolveCredentials = (
  username?: string,
  password?: string,
): AuthResult => {
  if (!username || !password) {
    return { valid: false, role: 'user', username: username || '' }
  }

  // Admin credentials win if both usernames are equal but passwords differ.
  if (
    ADMIN_USERNAME &&
    ADMIN_PASSWORD &&
    username === ADMIN_USERNAME &&
    password === ADMIN_PASSWORD
  ) {
    return { valid: true, role: 'admin', username }
  }

  if (
    LOGIN_USERNAME &&
    LOGIN_PASSWORD &&
    username === LOGIN_USERNAME &&
    password === LOGIN_PASSWORD
  ) {
    return { valid: true, role: 'user', username }
  }

  return { valid: false, role: 'user', username }
}

export const isValidCredentials = (username?: string, password?: string): boolean => {
  return resolveCredentials(username, password).valid
}

export const getAuthFromRequest = (req: NextApiRequest): {
  isAuthed: boolean
  role: UserRole
  username: string
} => {
  const authCookie = req.cookies?.[AUTH_COOKIE_NAME]
  const roleCookie = req.cookies?.[AUTH_ROLE_COOKIE_NAME]
  const userCookie = req.cookies?.[AUTH_USER_COOKIE_NAME]

  const isAuthed = authCookie === AUTH_COOKIE_VALUE
  const role: UserRole = roleCookie === 'admin' ? 'admin' : 'user'
  const username = userCookie || ''

  return { isAuthed, role, username }
}

export const isAdminRequest = (req: NextApiRequest): boolean => {
  const auth = getAuthFromRequest(req)
  return auth.isAuthed && auth.role === 'admin'
}
