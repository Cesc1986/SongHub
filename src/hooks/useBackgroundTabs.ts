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
  const isLocalUrl = url.startsWith('local://')

  return useQuery(
    ['getBackgroundTab', url, fontSize, widthBrowser],
    async ({ signal }) => getDatasTab(url, fontSize, widthBrowser, signal),
    {
      // Keep background adaptation for remote tabs, skip only for local image tabs/imported tabs
      enabled: !isImported && !isLocalUrl && url.length > 0,
      initialData: isImported ? importedTab : undefined,
      initialDataUpdatedAt: isImported ? Date.now() : undefined,
      staleTime: isImported ? Infinity : 0,
      cacheTime: isImported ? Infinity : 0,
    },
  )
}
