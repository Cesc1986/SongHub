import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getAuthFromRequest } from '../../lib/auth'
import { getClientIp, pushSetlistTrash } from '../../lib/audit'

const SETLIST_FILE = path.join(process.cwd(), 'saved-tabs', 'setlists.json')

interface SetlistEntry {
  filename: string
  artist: string
  name: string
  type: string
  order: number
}

interface Setlist {
  [date: string]: SetlistEntry[]
}

function loadSetlists(): Setlist {
  try {
    if (fs.existsSync(SETLIST_FILE)) {
      return JSON.parse(fs.readFileSync(SETLIST_FILE, 'utf-8'))
    }
  } catch {}
  return {}
}

function saveSetlists(setlists: Setlist) {
  fs.writeFileSync(SETLIST_FILE, JSON.stringify(setlists, null, 2))
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = getAuthFromRequest(req)
  const actor = auth.username || 'unknown'
  const role = auth.role
  const ip = getClientIp(req)

  if (req.method === 'GET') {
    const setlists = loadSetlists()
    const { date } = req.query
    if (date && typeof date === 'string') {
      return res.status(200).json({ date, entries: setlists[date] || [] })
    }
    return res.status(200).json({ setlists })
  }

  if (req.method === 'POST') {
    const { date, filename, artist, name, type } = req.body
    if (!date || !filename) {
      return res.status(400).json({ error: 'date und filename sind erforderlich' })
    }

    const setlists = loadSetlists()
    if (!setlists[date]) {
      setlists[date] = []
    }

    // Check if already in setlist
    const exists = setlists[date].some(e => e.filename === filename)
    if (exists) {
      return res.status(200).json({ success: true, message: 'Bereits in Setlist' })
    }

    const maxOrder = setlists[date].reduce((max, e) => Math.max(max, e.order), 0)
    setlists[date].push({
      filename,
      artist: artist || '',
      name: name || '',
      type: type || '',
      order: maxOrder + 1,
    })

    saveSetlists(setlists)
    return res.status(200).json({ success: true })
  }

  if (req.method === 'PUT') {
    const { date, entries } = req.body
    if (!date || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'date und entries[] sind erforderlich' })
    }

    const setlists = loadSetlists()
    setlists[date] = entries.map((e: SetlistEntry, i: number) => ({ ...e, order: i + 1 }))
    saveSetlists(setlists)
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { date, filename } = req.query
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'date ist erforderlich' })
    }

    const setlists = loadSetlists()
    if (filename && typeof filename === 'string') {
      // Remove single entry (no trash entry by request)
      setlists[date] = (setlists[date] || []).filter(e => e.filename !== filename)
      if (setlists[date].length === 0) {
        delete setlists[date]
      }
    } else {
      // Delete entire setlist
      if (setlists[date]?.length) {
        pushSetlistTrash({
          type: 'setlist_day',
          deletedBy: actor,
          deletedByRole: role,
          ip,
          payload: { date, entries: setlists[date] },
        })
      }
      delete setlists[date]
    }

    saveSetlists(setlists)
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
