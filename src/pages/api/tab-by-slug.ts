import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const SAVED_DIR = path.join(process.cwd(), 'saved-tabs')

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query
  if (!slug) return res.status(400).json({ error: 'slug erforderlich' })

  const slugStr = Array.isArray(slug) ? slug.join('/') : slug

  if (!fs.existsSync(SAVED_DIR)) return res.status(404).json({ tab: null })

  const files = fs.readdirSync(SAVED_DIR).filter((f) => f.endsWith('.ultimatetab.json'))
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(SAVED_DIR, file), 'utf-8')
      const parsed = JSON.parse(raw)
      const tab = parsed.tab
      if (!tab) continue
      // Match by slug or by local:// URL
      if (
        tab.slug === slugStr ||
        tab.url === `local://image-tab/${slugStr}` ||
        tab.slug === `image-tab/${slugStr}`
      ) {
        return res.status(200).json({ tab })
      }
    } catch {}
  }

  return res.status(404).json({ tab: null })
}
