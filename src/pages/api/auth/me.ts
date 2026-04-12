import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthFromRequest } from '../../../lib/auth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = getAuthFromRequest(req)

  if (!auth.isAuthed) {
    return res.status(200).json({ authenticated: false, role: 'user', username: '' })
  }

  return res.status(200).json({
    authenticated: true,
    role: auth.role,
    username: auth.username,
  })
}
