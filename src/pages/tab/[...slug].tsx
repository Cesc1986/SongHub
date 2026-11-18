import { useEffect, useMemo } from 'react'
import TabPanel from '../../components/TabPanel'
import Head from 'next/head'
import useAppStateContext from '../../hooks/useAppStateContext'
import { useRouter } from 'next/router'
import { Alert, Fade } from '@chakra-ui/react'
import { chooseTab, hasTabContent } from '../../lib/tab-rendering'

export default function TabPage(): JSX.Element {
  const router = useRouter()
  const slug = Array.isArray(router.query.slug) ? router.query.slug.join('/') : router.query.slug
  const { selectedTab, setSelectedTab, isLoadingTab, selectedTabContent, refetchTab,
    isLoadingTabBackground, selectedTabContentBackground } = useAppStateContext()

  const displayedTab = useMemo(() => chooseTab(
    selectedTab.url, selectedTabContent, selectedTabContentBackground,
  ), [selectedTab.url, selectedTabContent, selectedTabContentBackground])
  const loading = !hasTabContent(displayedTab?.htmlTab) &&
    (isLoadingTab || isLoadingTabBackground || !selectedTab.url)
  const title = displayedTab ? `${displayedTab.name} by ${displayedTab.artist} - Song Hub` : 'Tab - Song Hub'

  useEffect(() => {
    if (!slug) return
    const remoteUrl = `https://tabs.ultimate-guitar.com/tab/${slug}`
    const select = (url: string) => setSelectedTab(prev => prev.url === url ? prev : { ...prev, url })
    try {
      const cached = JSON.parse(sessionStorage.getItem('savedTabCache') || 'null')
      if ((cached?.url === remoteUrl || cached?.url === `local://image-tab/${slug}`) && hasTabContent(cached.tab?.htmlTab)) {
        select(cached.url)
        return
      }
    } catch {}

    const controller = new AbortController()
    fetch(`/api/tab-by-slug?slug=${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (controller.signal.aborted) return
        if (data?.tab?.url && hasTabContent(data.tab.htmlTab)) {
          const url = data.tab.url.startsWith('local://') ? data.tab.url : remoteUrl
          const tab = { ...data.tab, url }
          try { sessionStorage.setItem('savedTabCache', JSON.stringify({ url, tab })) } catch {}
          select(url)
        } else {
          select(remoteUrl)
        }
      })
      .catch(() => { if (!controller.signal.aborted) select(remoteUrl) })
    return () => controller.abort()
  }, [slug, setSelectedTab])

  return (
    <>
      <Head><title>{title}</title></Head>
      <Fade style={{ display: 'flex', flexGrow: '1', flexDirection: 'column' }} in={true}>
        {!loading && !hasTabContent(displayedTab?.htmlTab) && <Alert status="warning">Tab content could not be loaded. Reload to try again.</Alert>}
        <TabPanel isLoading={loading} selectedTab={selectedTab} selectedTabContent={displayedTab} refetchTab={refetchTab} />
      </Fade>
    </>
  )
}
