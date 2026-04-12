import type { NextApiRequest, NextApiResponse } from 'next'
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_VALUE,
  AUTH_ROLE_COOKIE_NAME,
  AUTH_USER_COOKIE_NAME,
  resolveCredentials,
} from '../../../lib/auth'
import { appendAccessLog, getClientIp } from '../../../lib/audit'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username, password } = req.body ?? {}
  const resolved = resolveCredentials(username, password)

  if (!resolved.valid) {
    appendAccessLog({
      timestamp: new Date().toISOString(),
      username: username || 'unknown',
      role: 'user',
      ip: getClientIp(req),
      success: false,
      event: 'login_failed',
    })

    return res.status(401).json({ error: 'Ungültige Zugangsdaten' })
  }

  const forwardedProto = req.headers['x-forwarded-proto']
  const isHttps =
    (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) === 'https'

  // Secure-Cookie nur auf HTTPS setzen (sonst funktioniert Login auf http:// nicht)
  const secure = isHttps ? '; Secure' : ''
  const maxAge = 60 * 60 * 24 * 7

  res.setHeader('Set-Cookie', [
    `${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
    `${AUTH_ROLE_COOKIE_NAME}=${resolved.role}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
    `${AUTH_USER_COOKIE_NAME}=${encodeURIComponent(resolved.username)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
  ])

  appendAccessLog({
    timestamp: new Date().toISOString(),
    username: resolved.username,
    role: resolved.role,
    ip: getClientIp(req),
    success: true,
    event: 'login_success',
  })

  return res.status(200).json({ success: true, role: resolved.role })
}
