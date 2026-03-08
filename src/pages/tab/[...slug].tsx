import { useEffect, useState } from 'react'
import TabPanel from '../../components/TabPanel'
import Head from 'next/head'
import useAppStateContext from '../../hooks/useAppStateContext'
import { Tab } from '../../types/tabs'
import { useRouter } from 'next/router'
import { Fade, useToast } from '@chakra-ui/react'

export default function TabPage(): JSX.Element {
  const router = useRouter()
  const slug = Array.isArray(router.query.slug)
    ? router.query.slug.join('/')
    : router.query.slug

  const {
    favorites,
    selectedTab,
    setSelectedTab,
    isLoadingTab,
    selectedTabContent,
    handleClickFavorite,
    refetchTab,
    isLoadingTabBackground,
    selectedTabContentBackground,
  } = useAppStateContext()

  const toast = useToast()

  const title = selectedTabContent
    ? `${selectedTabContent.name} by ${selectedTabContent.artist} - Ultimate Tab`
    : 'Tab - Ultimate Tab'

  const [updatedResponsiveTab, setUpdatedResponsiveTab] =
    useState<Tab>(selectedTabContent)

  useEffect(() => {
    if (!slug) return

    // 1. Check sessionStorage (navigation from saved list)
    try {
      const raw = sessionStorage.getItem('savedTabCache')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.tab?.url?.startsWith('local://')) {
          setSelectedTab((prevState) => ({ ...prevState, url: parsed.tab.url }))
          return
        }
      }
    } catch {}

    // 2. Check if this slug belongs to a saved image-tab (e.g. after refresh)
    fetch(`/api/tab-by-slug?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.tab?.url?.startsWith('local://')) {
          try {
            sessionStorage.setItem('savedTabCache', JSON.stringify({ url: data.tab.url, tab: data.tab }))
          } catch {}
          setSelectedTab((prevState) => ({ ...prevState, url: data.tab.url }))
          setUpdatedResponsiveTab(data.tab)
        } else {
          setSelectedTab((prevState) => ({
            ...prevState,
            url: `https://tabs.ultimate-guitar.com/tab/${slug}`,
          }))
        }
      })
      .catch(() => {
        setSelectedTab((prevState) => ({
          ...prevState,
          url: `https://tabs.ultimate-guitar.com/tab/${slug}`,
        }))
      })
  }, [slug, setSelectedTab])

  useEffect(() => {
    if (!isLoadingTab) {
      if (!isLoadingTabBackground) {
        if (typeof selectedTabContentBackground !== 'undefined') {
          setUpdatedResponsiveTab(selectedTabContentBackground)
        }
      } else {
        toast.closeAll()
        toast({
          description: 'Adapting tab for your browser...🛠️',
          status: 'info',
          position: 'top-right',
          duration: 3000,
          isClosable: true,
        })
      }
    }
  }, [
    selectedTabContentBackground,
    isLoadingTabBackground,
    toast,
    isLoadingTab,
  ])

  useEffect(() => {
    setUpdatedResponsiveTab(selectedTabContent)
  }, [selectedTabContent])

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Fade
        style={{ display: 'flex', flexGrow: '1', flexDirection: 'column' }}
        in={true}
      >
        <TabPanel
          isLoading={isLoadingTab || selectedTab.url == '' ? true : false}
          selectedTab={selectedTab}
          selectedTabContent={updatedResponsiveTab}
          isFavorite={
            typeof favorites.find((el: Tab) => el.url === selectedTab.url) !==
            'undefined'
          }
          handleClickFavorite={handleClickFavorite}
          refetchTab={refetchTab}
        />
      </Fade>
    </>
  )
}
