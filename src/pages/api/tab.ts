import type { NextApiRequest, NextApiResponse } from 'next'
import type { ApiRequestTab, ApiResponseTab } from '../../types/tabs'
import { getTab } from '../../lib/core/tab'

type TabCacheEntry = {
  expiresAt: number
  payload: ApiResponseTab
}

class RequestLimiter {
  private readonly concurrency: number
  private active = 0
  private queue: Array<() => void> = []

  constructor(concurrency: number) {
    this.concurrency = Math.max(1, concurrency)
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }

  stats() {
    return {
      concurrency: this.concurrency,
      active: this.active,
      queued: this.queue.length,
    }
  }

  private acquire(): Promise<void> {
    if (this.active < this.concurrency) {
      this.active += 1
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.active += 1
        resolve()
      })
    })
  }

  private release() {
    this.active = Math.max(0, this.active - 1)
    const next = this.queue.shift()
    if (next) next()
  }
}

const TAB_CACHE_TTL_MS = Number(process.env.SONGHUB_TAB_CACHE_TTL_MS || 15 * 60 * 1000)
const TAB_CACHE_MAX_ITEMS = Number(process.env.SONGHUB_TAB_CACHE_MAX_ITEMS || 200)
const TAB_SCRAPE_CONCURRENCY = Number(process.env.SONGHUB_TAB_SCRAPE_CONCURRENCY || 2)

const tabCache = new Map<string, TabCacheEntry>()
const inflightRequests = new Map<string, Promise<ApiResponseTab>>()
const tabLimiter = new RequestLimiter(TAB_SCRAPE_CONCURRENCY)
let cacheHits = 0
let cacheMisses = 0
let inflightHits = 0

function getCacheKey(url: string, width: string, height: string): string {
  return `${url}|${width || ''}|${height || ''}`
}

function pruneExpiredCache() {
  const now = Date.now()
  for (const [key, entry] of tabCache.entries()) {
    if (entry.expiresAt <= now) {
      tabCache.delete(key)
    }
  }
}

function getFromCache(key: string): ApiResponseTab | null {
  const entry = tabCache.get(key)
  if (!entry) return null

  if (entry.expiresAt <= Date.now()) {
    tabCache.delete(key)
    return null
  }

  // refresh insertion order for simple LRU behavior
  tabCache.delete(key)
  tabCache.set(key, entry)
  return entry.payload
}

function setInCache(key: string, payload: ApiResponseTab) {
  if (tabCache.size >= TAB_CACHE_MAX_ITEMS) {
    const oldestKey = tabCache.keys().next().value
    if (oldestKey) tabCache.delete(oldestKey)
  }

  tabCache.set(key, {
    payload,
    expiresAt: Date.now() + TAB_CACHE_TTL_MS,
  })
}

export function getTabApiStats() {
  pruneExpiredCache()
  return {
    tabCache: {
      ttlMs: TAB_CACHE_TTL_MS,
      maxItems: TAB_CACHE_MAX_ITEMS,
      size: tabCache.size,
      hits: cacheHits,
      misses: cacheMisses,
    },
    inflight: {
      size: inflightRequests.size,
      hits: inflightHits,
    },
    limiter: tabLimiter.stats(),
  }
}

export default async function handlerTab(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const formattedReq: ApiRequestTab = {
    url: req.query.q as string,
    width: req.query.width as string,
    height: req.query.height as string,
  }

  if (!formattedReq.url) {
    return res.status(400).json({ error: '"q" parameter is missing' })
  }

  const key = getCacheKey(formattedReq.url, formattedReq.width, formattedReq.height)

  // 1) cache hit
  const cached = getFromCache(key)
  if (cached) {
    cacheHits += 1
    res.setHeader('X-SongHub-Cache', 'HIT')
    return res.status(200).json(cached)
  }

  // 2) in-flight dedupe
  const existingInflight = inflightRequests.get(key)
  if (existingInflight) {
    inflightHits += 1
    try {
      const payload = await existingInflight
      res.setHeader('X-SongHub-Cache', 'INFLIGHT')
      return res.status(200).json(payload)
    } catch {
      return res.status(500).json({ error: 'failed to load data' })
    }
  }

  cacheMisses += 1

  // 3) queued scrape with concurrency cap
  const promise = tabLimiter.run(async () => {
    const payload = await getTab(formattedReq.url, formattedReq.width, formattedReq.height)
    if (!payload) {
      throw new Error('failed to load data')
    }
    setInCache(key, payload)
    return payload
  })

  inflightRequests.set(key, promise)

  try {
    const payload = await promise
    res.setHeader('X-SongHub-Cache', 'MISS')
    return res.status(200).json(payload)
  } catch {
    return res.status(500).json({ error: 'failed to load data' })
  } finally {
    inflightRequests.delete(key)
  }
}
