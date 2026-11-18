import type { NextApiRequest, NextApiResponse } from 'next'
import { getPuppeteerStats } from '../../lib/api/request'
import { getTabApiStats } from './tab'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const hasUser = Boolean(process.env.SONGHUB_LOGIN_USERNAME)
  const hasPassword = Boolean(process.env.SONGHUB_LOGIN_PASSWORD)

  const authConfigured = hasUser && hasPassword && (process.env.SONGHUB_SESSION_SECRET?.length ?? 0) >= 32
  res.status(authConfigured ? 200 : 503).json({
    status: authConfigured ? 'ok' : 'unavailable',
    service: 'songhub',
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    authConfigured,
    performance: {
      tabApi: getTabApiStats(),
      puppeteer: getPuppeteerStats(),
    },
  })
}
