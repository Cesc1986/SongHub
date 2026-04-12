import type { NextApiRequest, NextApiResponse } from 'next'
import { getPuppeteerStats } from '../../lib/api/request'
import { getTabApiStats } from './tab'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const hasUser = Boolean(process.env.SONGHUB_LOGIN_USERNAME)
  const hasPassword = Boolean(process.env.SONGHUB_LOGIN_PASSWORD)

  res.status(200).json({
    status: 'ok',
    service: 'songhub',
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    authConfigured: hasUser && hasPassword,
    performance: {
      tabApi: getTabApiStats(),
      puppeteer: getPuppeteerStats(),
    },
  })
}
