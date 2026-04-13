import fs from 'fs'
import path from 'path'

interface RuntimeSettings {
  musicianMarkingEnabled?: boolean
}

const truthy = new Set(['1', 'true', 'yes', 'on'])
const CONFIG_DIR = path.join(process.cwd(), 'config')
const SETTINGS_FILE = path.join(CONFIG_DIR, 'runtime-settings.json')

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function readRuntimeSettings(): RuntimeSettings {
  ensureConfigDir()
  if (!fs.existsSync(SETTINGS_FILE)) return {}

  try {
    const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeRuntimeSettings(next: RuntimeSettings) {
  ensureConfigDir()
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf-8')
}

function envDefaultMusicianMarkingEnabled(): boolean {
  const raw = process.env.SONGHUB_FEATURE_MUSICIAN_MARKING
  if (typeof raw === 'undefined') return true
  return truthy.has(String(raw).trim().toLowerCase())
}

export function getMusicianMarkingEnabled(): boolean {
  const settings = readRuntimeSettings()
  if (typeof settings.musicianMarkingEnabled === 'boolean') {
    return settings.musicianMarkingEnabled
  }
  return envDefaultMusicianMarkingEnabled()
}

export function setMusicianMarkingEnabled(enabled: boolean): boolean {
  const current = readRuntimeSettings()
  current.musicianMarkingEnabled = Boolean(enabled)
  writeRuntimeSettings(current)
  return current.musicianMarkingEnabled
}
