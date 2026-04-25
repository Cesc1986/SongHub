import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthFromRequest } from '../../lib/auth'
import { appendAccessLog, getClientIp } from '../../lib/audit'

const TRACKED_METHODS = new Set(['GET'])

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = getAuthFromRequest(req)
  if (!auth.isAuthed) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const path = typeof req.body?.path === 'string' ? req.body.path : ''
  const method = typeof req.body?.method === 'string' ? req.body.method.toUpperCase() : 'GET'

  if (!path || !path.startsWith('/')) {
    return res.status(400).json({ error: 'path required' })
  }

  if (!TRACKED_METHODS.has(method)) {
    return res.status(200).json({ success: true, skipped: true })
  }

  // Rauschen vermeiden: keine Assets/Framework/API-Calls loggen
  if (
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.startsWith('/api') ||
    path.includes('.')
  ) {
    return res.status(200).json({ success: true, skipped: true })
  }

  appendAccessLog({
    timestamp: new Date().toISOString(),
    username: auth.username || 'unknown',
    role: auth.role,
    ip: getClientIp(req),
    success: true,
    event: 'page_view',
    details: {
      path,
      method,
      query: req.body?.query || null,
      referrer: req.body?.referrer || null,
    },
  })

  return res.status(200).json({ success: true })
}
