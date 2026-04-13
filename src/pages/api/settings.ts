import type { NextApiRequest, NextApiResponse } from 'next'
import { getMusicianMarkingEnabled } from '../../lib/settings'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return res.status(200).json({ musicianMarkingEnabled: getMusicianMarkingEnabled() })
}
