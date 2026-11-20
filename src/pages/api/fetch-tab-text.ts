import type { NextApiRequest, NextApiResponse } from 'next'

const FETCH_TIMEOUT_MS = 10_000
const MAX_RESPONSE_BYTES = 2_000_000

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

function extractTabText(html: string): string {
  const preMatches = [...html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/gi)]
  if (preMatches.length > 0) {
    const longest = preMatches.reduce((best, current) =>
      current[1].length > best[1].length ? current : best,
    )
    return decodeEntities(stripTags(longest[1])).trim()
  }

  const withoutScripts = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

  return decodeEntities(stripTags(withoutScripts))
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? decodeEntities(match[1]).trim() : undefined
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.body

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url ist erforderlich' })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return res.status(400).json({ error: 'Ungültige URL' })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Nur http/https URLs sind erlaubt' })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SongHub-Importer/1.0)' },
    })

    if (!response.ok) {
      return res.status(502).json({ error: `Quelle antwortete mit Status ${response.status}` })
    }

    const reader = response.body?.getReader()
    let html = ''
    if (reader) {
      let received = 0
      const decoder = new TextDecoder()
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        received += value.length
        if (received > MAX_RESPONSE_BYTES) {
          controller.abort()
          break
        }
        html += decoder.decode(value, { stream: true })
      }
    } else {
      html = await response.text()
    }

    return res.status(200).json({
      text: extractTabText(html),
      title: extractTitle(html),
    })
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: 'Zeitüberschreitung beim Abrufen der URL' })
    }
    return res.status(502).json({ error: 'URL konnte nicht abgerufen werden' })
  } finally {
    clearTimeout(timeout)
  }
}
