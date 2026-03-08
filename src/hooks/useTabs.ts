import { useQuery } from 'react-query'
import { ApiResponseTab, Tab } from '../types/tabs'

// Load from sessionStorage cache if available (for saved tabs — no Puppeteer needed)
function getCachedTab(url: string): Tab | null {
  try {
    const raw = sessionStorage.getItem('savedTabCache')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.url === url) {
      sessionStorage.removeItem('savedTabCache') // consume once
      return parsed.tab as Tab
    }
  } catch {}
  return null
}

export const getDatasTab = async (
  url: string,
  fontSize: number,
  widthBrowser: number,
  signal: AbortSignal,
): Promise<Tab> => {
  const response = await fetch(
    `/api/tab?q=${url}&width=${Math.ceil(
      widthBrowser * (1 - (fontSize - 100) / 100),
    )}&height=${Math.ceil(
      document.documentElement.clientHeight * (1 - (fontSize - 100) / 100),
    )}`,
    { signal },
  )
  const parsedResponse: ApiResponseTab = await response.json()
  return parsedResponse.tab
}

export default function useTabs(
  url: string,
  fontSize: number = 100,
  widthBrowser: number,
  importedTab?: Tab,
) {
  const isImported = Boolean(importedTab && importedTab.url === url)
  const isLocalUrl = url.startsWith('local://')

  // Check sessionStorage for a cached saved tab
  const cachedTab = typeof window !== 'undefined' ? getCachedTab(url) : null

  return useQuery(
    ['getTab', url],
    async ({ signal }) => getDatasTab(url, fontSize, widthBrowser, signal),
    {
      // Skip network fetch if we have an imported tab or a sessionStorage cache hit
      enabled: !isImported && !cachedTab && !isLocalUrl && url.length > 0,
      initialData: cachedTab ?? (isImported ? importedTab : undefined),
      initialDataUpdatedAt: (cachedTab || isImported) ? Date.now() : undefined,
      staleTime: (cachedTab || isImported) ? Infinity : 0,
    },
  )
}
