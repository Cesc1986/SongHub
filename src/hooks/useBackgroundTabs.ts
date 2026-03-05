import { useQuery } from 'react-query'
import { getDatasTab } from './useTabs'
import { Tab } from '../types/tabs'

export default function useBackgroundTabs(
  url: string,
  fontSize: number = 100,
  widthBrowser: number,
  importedTab?: Tab,
) {
  const isImported = Boolean(importedTab && importedTab.url === url)

  // If sessionStorage has a cached saved tab for this URL, skip network fetch entirely
  let hasCachedTab = false
  try {
    if (typeof window !== 'undefined') {
      const raw = sessionStorage.getItem('savedTabCache')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.url === url) hasCachedTab = true
      }
    }
  } catch {}

  return useQuery(
    ['getBackgroundTab', fontSize, widthBrowser],
    async ({ signal }) => getDatasTab(url, fontSize, widthBrowser, signal),
    {
      enabled: !isImported && !hasCachedTab && url.length > 0,
      initialData: isImported ? importedTab : undefined,
      initialDataUpdatedAt: isImported ? Date.now() : undefined,
      staleTime: isImported ? Infinity : 0,
      cacheTime: isImported ? Infinity : 0,
    },
  )
}
