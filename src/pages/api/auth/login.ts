import type { NextApiRequest, NextApiResponse } from 'next'
import {
  AUTH_COOKIE_NAME,
  SESSION_SECRET,
  resolveCredentials,
} from '../../../lib/auth'
import { issueSession, SESSION_AGE } from '../../../lib/session'
import { appendAccessLog, getClientIp } from '../../../lib/audit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (SESSION_SECRET.length < 32) {
    return res.status(503).json({ error: 'Authentication is not configured' })
  }

  const { username, password } = req.body ?? {}
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid credentials format' })
  }
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
  let token: string
  try {
    token = await issueSession(resolved.username, resolved.role, SESSION_SECRET)
  } catch {
    return res.status(503).json({ error: 'Could not issue session' })
  }
  res.setHeader('Set-Cookie', `${AUTH_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_AGE}${secure}`)

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
