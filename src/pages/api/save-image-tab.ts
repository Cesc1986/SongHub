import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getAuthFromRequest } from '../../lib/auth'
import { appendChangeLog, getClientIp } from '../../lib/audit'

const SAVED_DIR = path.join(process.cwd(), 'saved-tabs')

if (!fs.existsSync(SAVED_DIR)) {
  fs.mkdirSync(SAVED_DIR, { recursive: true })
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = getAuthFromRequest(req)
  const actor = auth.username || 'unknown'
  const role = auth.role
  const ip = getClientIp(req)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { artist, name, type = 'Chords', imageBase64, mimeType = 'image/jpeg' } = req.body

  if (!artist || !name || !imageBase64) {
    return res.status(400).json({ error: 'artist, name und imageBase64 sind erforderlich' })
  }

  // Build a slug from artist + name (no UG URL needed)
  const slug = `${artist} - ${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const url = `local://image-tab/${slug}`

  // Embed image as an <img> tag in htmlTab so TabPanel renders it
  const htmlTab = `<div class="image-tab-container" style="text-align:center;padding:16px"><img src="data:${mimeType};base64,${imageBase64}" alt="${name}" style="max-width:100%;height:auto;border-radius:8px" /></div>`

  const tab = {
    url,
    slug,
    name,
    artist,
    type,
    numberRates: 0,
    rating: 0,
    htmlTab,
    raw_tabs: '',
  }

  const filename =
    `${artist} - ${name} (${type})`
      .replace(/[/\\?%*:|"<>]/g, '-')
      .trim() + '.ultimatetab.json'

  const filepath = path.join(SAVED_DIR, filename)
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

  appendChangeLog({
    timestamp: new Date().toISOString(),
    username: actor,
    role,
    ip,
    action: 'song_saved_image',
    details: {
      filename,
      artist,
      name,
      type,
      slug,
    },
  })

  return res.status(200).json({ success: true, filename, slug })
}
