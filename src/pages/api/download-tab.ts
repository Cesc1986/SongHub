import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const SAVED_DIR = path.join(process.cwd(), 'saved-tabs')

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { filename } = req.query
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'filename required' })
  }

  const filepath = path.join(SAVED_DIR, path.basename(filename))
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' })
  }

  const content = fs.readFileSync(filepath, 'utf-8')
  const parsed = JSON.parse(content)
  
  // Copy savedAt into tab object so it's available in the UI
  if (parsed.savedAt && parsed.tab) {
    parsed.tab.savedAt = parsed.savedAt
  }
  
  res.setHeader('Content-Type', 'application/json')
  res.status(200).json(parsed)
}
