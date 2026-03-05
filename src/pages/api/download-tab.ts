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

  const content = fs.readFileSync(filepath)
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filename)}"`)
  res.status(200).send(content)
}
