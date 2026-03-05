import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const SAVED_DIR = path.join(process.cwd(), 'saved-tabs')

if (!fs.existsSync(SAVED_DIR)) {
  fs.mkdirSync(SAVED_DIR, { recursive: true })
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Save tab to server
    const { tab } = req.body
    if (!tab || !tab.url || !tab.htmlTab) {
      return res.status(400).json({ error: 'Invalid tab data' })
    }
    const filename = `${tab.artist} - ${tab.name} (${tab.type})`
      .replace(/[/\\?%*:|"<>]/g, '-')
      .trim() + '.ultimatetab.json'

    const filepath = path.join(SAVED_DIR, filename)
    fs.writeFileSync(filepath, JSON.stringify({ savedAt: new Date().toISOString(), version: '1.0', tab }, null, 2))
    return res.status(200).json({ success: true, filename })

  } else if (req.method === 'GET') {
    // List all saved tabs
    const files = fs.readdirSync(SAVED_DIR).filter(f => f.endsWith('.ultimatetab.json'))
    const tabs = files.map(filename => {
      try {
        const raw = fs.readFileSync(path.join(SAVED_DIR, filename), 'utf-8')
        const parsed = JSON.parse(raw)
        return {
          filename,
          savedAt: parsed.savedAt,
          artist: parsed.tab?.artist,
          name: parsed.tab?.name,
          type: parsed.tab?.type,
          slug: parsed.tab?.slug,
          url: parsed.tab?.url,
        }
      } catch {
        return { filename, error: true }
      }
    })
    return res.status(200).json({ tabs })

  } else if (req.method === 'DELETE') {
    const { filename } = req.query
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'filename required' })
    }
    const filepath = path.join(SAVED_DIR, path.basename(filename))
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
      return res.status(200).json({ success: true })
    }
    return res.status(404).json({ error: 'File not found' })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
