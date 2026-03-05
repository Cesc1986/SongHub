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

  return useQuery(
    ['getBackgroundTab', fontSize, widthBrowser],
    async ({ signal }) => getDatasTab(url, fontSize, widthBrowser, signal),
    {
      // Never fetch from network if we have an imported tab
      enabled: !isImported && url.length > 0,
      initialData: isImported ? importedTab : undefined,
      initialDataUpdatedAt: isImported ? Date.now() : undefined,
      staleTime: isImported ? Infinity : 0,
      cacheTime: isImported ? Infinity : 0,
    },
  )
}
