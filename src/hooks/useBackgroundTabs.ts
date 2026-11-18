import { useQuery } from 'react-query'
import { getCachedTab, getDatasTab } from './useTabs'
import { Tab } from '../types/tabs'

export default function useBackgroundTabs(
  url: string,
  fontSize: number = 100,
  widthBrowser: number,
  importedTab?: Tab,
) {
  const isImported = Boolean(importedTab && importedTab.url === url)
  const isLocalUrl = url.startsWith('local://')
  const isSaved = typeof window !== 'undefined' && Boolean(getCachedTab(url))

  return useQuery(
    ['getBackgroundTab', url, fontSize, widthBrowser],
    async ({ signal }) => getDatasTab(url, fontSize, widthBrowser, signal),
    {
      // Saved content is authoritative; don't scrape it again on navigation or zoom.
      enabled: !isImported && !isSaved && !isLocalUrl && url.length > 0 && widthBrowser > 0,
      initialData: isImported ? importedTab : undefined,
      initialDataUpdatedAt: isImported ? Date.now() : undefined,
      staleTime: isImported ? Infinity : 0,
      cacheTime: isImported ? Infinity : 0,
    },
  )
}
