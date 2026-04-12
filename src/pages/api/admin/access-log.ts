import type { NextApiRequest, NextApiResponse } from 'next'
import { isAdminRequest } from '../../../lib/auth'
import { readAccessLogs } from '../../../lib/audit'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!isAdminRequest(req)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const limit = Number(req.query.limit || 200)
  return res.status(200).json({ logs: readAccessLogs(limit) })
}
