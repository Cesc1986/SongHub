import type { NextApiRequest, NextApiResponse } from 'next'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE, isValidCredentials } from '../../../lib/auth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username, password } = req.body ?? {}

  if (!isValidCredentials(username, password)) {
    return res.status(401).json({ error: 'Ungültige Zugangsdaten' })
  }

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  const maxAge = 60 * 60 * 24 * 7
  res.setHeader(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
  )

  return res.status(200).json({ success: true })
}
