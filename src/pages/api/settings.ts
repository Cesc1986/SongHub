import type { NextApiRequest, NextApiResponse } from 'next'

const truthy = new Set(['1', 'true', 'yes', 'on'])

function isMusicianMarkingEnabled(): boolean {
  const raw = process.env.SONGHUB_FEATURE_MUSICIAN_MARKING
  if (typeof raw === 'undefined') return true
  return truthy.has(String(raw).trim().toLowerCase())
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return res.status(200).json({ musicianMarkingEnabled: isMusicianMarkingEnabled() })
}
