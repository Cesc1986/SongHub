import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getAuthFromRequest } from '../../lib/auth'
import { appendChangeLog, getClientIp } from '../../lib/audit'
import { wrapTabBlocks, escapeHtml } from '../../lib/core/textTab'
import { Tab } from '../../types/tabs'

const SAVED_DIR = path.join(process.cwd(), 'saved-tabs')

if (!fs.existsSync(SAVED_DIR)) {
  fs.mkdirSync(SAVED_DIR, { recursive: true })
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = getAuthFromRequest(req)
  const actor = auth.username || 'unknown'
  const role = auth.role
  const ip = getClientIp(req)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    artist,
    name,
    type = 'Tab',
    tabText,
    tuning,
    capo,
    tonality,
    sourceUrl,
  } = req.body

  if (!artist?.trim() || !name?.trim() || !tabText?.trim()) {
    return res.status(400).json({ error: 'artist, name und tabText sind erforderlich' })
  }

  const slug = `${artist} - ${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const url = `local://text-tab/${slug}`

  const rawTabs = wrapTabBlocks(tabText)
  const htmlTab = `<pre>${escapeHtml(tabText)}</pre>`

  const tab: Tab = {
    url,
    slug,
    name,
    artist,
    type,
    numberRates: 0,
    rating: 0,
    raw_tabs: rawTabs,
    htmlTab,
    ...(tuning?.length ? { tuning } : {}),
    ...(capo ? { capo } : {}),
    ...(tonality ? { tonality } : {}),
  }

  const filename =
    `${artist} - ${name} (${type})`
      .replace(/[/\\?%*:|"<>]/g, '-')
      .trim() + '.ultimatetab.json'

  const filepath = path.join(SAVED_DIR, filename)
  const existedBefore = fs.existsSync(filepath)

  fs.writeFileSync(
    filepath,
    JSON.stringify(
      {
        savedAt: new Date().toISOString(),
        version: '1.0',
        marks: { A: false, F: false },
        tab,
      },
      null,
      2,
    ),
  )

  if (!existedBefore) {
    appendChangeLog({
      timestamp: new Date().toISOString(),
      username: actor,
      role,
      ip,
      action: 'song_created',
      details: {
        filename,
        artist,
        name,
        type,
        slug,
        source: 'text-import',
        ...(sourceUrl ? { sourceUrl } : {}),
      },
    })
  }

  return res.status(200).json({ success: true, filename, slug, tab })
}
