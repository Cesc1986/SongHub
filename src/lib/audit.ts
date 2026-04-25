import fs from 'fs'
import path from 'path'
import type { NextApiRequest } from 'next'

export interface AccessLogEntry {
  timestamp: string
  username: string
  role: 'user' | 'admin'
  ip: string
  success: boolean
  event: 'login_success' | 'login_failed' | 'page_view'
  details?: Record<string, any>
}

export interface ChangeLogEntry {
  timestamp: string
  username: string
  role: 'user' | 'admin'
  ip: string
  action: 'song_created' | 'song_deleted' | 'song_renamed'
  details?: Record<string, any>
}

export interface TrashEntry {
  id: string
  type: 'song_file' | 'setlist_entry' | 'setlist_day'
  deletedAt: string
  deletedBy: string
  deletedByRole: 'user' | 'admin'
  ip?: string
  originalPath?: string
  trashPath?: string
  payload?: any
}

const SAVED_DIR = path.join(process.cwd(), 'saved-tabs')
const ADMIN_DIR = path.join(SAVED_DIR, 'admin')
const TRASH_FILES_DIR = path.join(SAVED_DIR, '.trash')
const SETLIST_FILE = path.join(SAVED_DIR, 'setlists.json')

const ACCESS_LOG_FILE = path.join(ADMIN_DIR, 'access-log.ndjson')
const CHANGE_LOG_FILE = path.join(ADMIN_DIR, 'change-log.ndjson')
const TRASH_INDEX_FILE = path.join(ADMIN_DIR, 'trash-index.json')

function ensureDirs() {
  ;[SAVED_DIR, ADMIN_DIR, TRASH_FILES_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  })
}

function appendJsonLine(filePath: string, data: Record<string, any>) {
  ensureDirs()
  fs.appendFileSync(filePath, `${JSON.stringify(data)}\n`, 'utf-8')
}

function readNdjson(filePath: string, limit = 500): any[] {
  ensureDirs()
  if (!fs.existsSync(filePath)) return []
  const lines = fs
    .readFileSync(filePath, 'utf-8')
    .split('\n')
    .filter(Boolean)

  return lines
    .slice(-Math.max(1, limit))
    .map((line) => {
      try {
        return JSON.parse(line)
      } catch {
        return null
      }
    })
    .filter(Boolean)
    .reverse()
}

function loadSetlists(): Record<string, any[]> {
  ensureDirs()
  if (!fs.existsSync(SETLIST_FILE)) return {}
  try {
    const parsed = JSON.parse(fs.readFileSync(SETLIST_FILE, 'utf-8'))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveSetlists(setlists: Record<string, any[]>) {
  ensureDirs()
  fs.writeFileSync(SETLIST_FILE, JSON.stringify(setlists, null, 2), 'utf-8')
}

export function getClientIp(req: NextApiRequest): string {
  const fwd = req.headers['x-forwarded-for']
  if (Array.isArray(fwd)) return fwd[0]
  if (typeof fwd === 'string') return fwd.split(',')[0].trim()

  const realIp = req.headers['x-real-ip']
  if (Array.isArray(realIp)) return realIp[0]
  if (typeof realIp === 'string') return realIp

  return req.socket?.remoteAddress || 'unknown'
}

export function appendAccessLog(entry: AccessLogEntry) {
  appendJsonLine(ACCESS_LOG_FILE, entry)
}

export function appendChangeLog(entry: ChangeLogEntry) {
  appendJsonLine(CHANGE_LOG_FILE, entry)
}

export function readAccessLogs(limit = 200): AccessLogEntry[] {
  return readNdjson(ACCESS_LOG_FILE, limit)
}

export function readChangeLogs(limit = 200): ChangeLogEntry[] {
  return readNdjson(CHANGE_LOG_FILE, limit)
}

function loadTrashIndex(): TrashEntry[] {
  ensureDirs()
  if (!fs.existsSync(TRASH_INDEX_FILE)) return []
  try {
    const parsed = JSON.parse(fs.readFileSync(TRASH_INDEX_FILE, 'utf-8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveTrashIndex(entries: TrashEntry[]) {
  ensureDirs()
  fs.writeFileSync(TRASH_INDEX_FILE, JSON.stringify(entries, null, 2), 'utf-8')
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function uniqueRestoreFilename(baseName: string): string {
  const safeBase = path.basename(baseName)
  const candidatePath = path.join(SAVED_DIR, safeBase)
  if (!fs.existsSync(candidatePath)) return safeBase

  const ext = path.extname(safeBase)
  const stem = safeBase.slice(0, -ext.length)
  const restored = `${stem} (restored ${Date.now()})${ext}`
  return restored
}

export function moveSongToTrash(params: {
  filePath: string
  originalFilename: string
  deletedBy: string
  deletedByRole: 'user' | 'admin'
  ip?: string
}): TrashEntry {
  ensureDirs()

  const id = makeId('song')
  const trashFilename = `${id}_${path.basename(params.originalFilename)}`
  const trashPath = path.join(TRASH_FILES_DIR, trashFilename)

  fs.renameSync(params.filePath, trashPath)

  const entry: TrashEntry = {
    id,
    type: 'song_file',
    deletedAt: new Date().toISOString(),
    deletedBy: params.deletedBy,
    deletedByRole: params.deletedByRole,
    ip: params.ip,
    originalPath: path.basename(params.originalFilename),
    trashPath: path.basename(trashFilename),
  }

  const index = loadTrashIndex()
  index.unshift(entry)
  saveTrashIndex(index)
  return entry
}

export function pushSetlistTrash(params: {
  type: 'setlist_entry' | 'setlist_day'
  deletedBy: string
  deletedByRole: 'user' | 'admin'
  ip?: string
  payload: any
}): TrashEntry {
  const entry: TrashEntry = {
    id: makeId(params.type === 'setlist_day' ? 'setlist_day' : 'setlist_entry'),
    type: params.type,
    deletedAt: new Date().toISOString(),
    deletedBy: params.deletedBy,
    deletedByRole: params.deletedByRole,
    ip: params.ip,
    payload: params.payload,
  }

  const index = loadTrashIndex()
  index.unshift(entry)
  saveTrashIndex(index)
  return entry
}

export function listTrash(): TrashEntry[] {
  return loadTrashIndex()
}

export function restoreTrashById(id: string): {
  success: boolean
  restored: boolean
  type?: string
  message?: string
} {
  const index = loadTrashIndex()
  const found = index.find((e) => e.id === id)
  if (!found) return { success: true, restored: false, message: 'Not found' }

  if (found.type === 'song_file') {
    if (!found.trashPath || !found.originalPath) {
      return { success: false, restored: false, message: 'Missing song trash metadata' }
    }

    const source = path.join(TRASH_FILES_DIR, found.trashPath)
    if (!fs.existsSync(source)) {
      return { success: false, restored: false, message: 'Trash file missing' }
    }

    const restoredName = uniqueRestoreFilename(found.originalPath)
    const target = path.join(SAVED_DIR, restoredName)
    fs.renameSync(source, target)

    saveTrashIndex(index.filter((e) => e.id !== id))
    return { success: true, restored: true, type: found.type }
  }

  if (found.type === 'setlist_day') {
    const payload = found.payload || {}
    const date = payload?.date
    const entries = Array.isArray(payload?.entries) ? payload.entries : []
    if (!date) {
      return { success: false, restored: false, message: 'Missing setlist date' }
    }

    const setlists = loadSetlists()
    setlists[date] = entries.map((e: any, i: number) => ({ ...e, order: i + 1 }))
    saveSetlists(setlists)

    saveTrashIndex(index.filter((e) => e.id !== id))
    return { success: true, restored: true, type: found.type }
  }

  // Legacy support: restore single setlist entry from older trash items
  if (found.type === 'setlist_entry') {
    const payload = found.payload || {}
    const date = payload?.date
    const entry = payload?.entry
    if (!date || !entry) {
      return { success: false, restored: false, message: 'Missing setlist entry payload' }
    }

    const setlists = loadSetlists()
    const arr = Array.isArray(setlists[date]) ? setlists[date] : []
    const exists = arr.some((e: any) => e.filename === entry.filename)
    if (!exists) arr.push(entry)
    setlists[date] = arr.map((e: any, i: number) => ({ ...e, order: i + 1 }))
    saveSetlists(setlists)

    saveTrashIndex(index.filter((e) => e.id !== id))
    return { success: true, restored: true, type: found.type }
  }

  return { success: false, restored: false, message: 'Unsupported trash type' }
}

export function purgeTrashById(id: string): { success: boolean; removed: boolean } {
  const index = loadTrashIndex()
  const found = index.find((e) => e.id === id)
  if (!found) return { success: true, removed: false }

  if (found.trashPath) {
    const filePath = path.join(TRASH_FILES_DIR, found.trashPath)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  const next = index.filter((e) => e.id !== id)
  saveTrashIndex(next)
  return { success: true, removed: true }
}

export function purgeTrashAll(): { success: boolean; removedCount: number } {
  const index = loadTrashIndex()

  for (const entry of index) {
    if (entry.trashPath) {
      const filePath = path.join(TRASH_FILES_DIR, entry.trashPath)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }
  }

  saveTrashIndex([])
  return { success: true, removedCount: index.length }
}
