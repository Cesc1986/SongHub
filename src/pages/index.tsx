import {
  Flex,
  Text,
  Heading,
  Stack,
  Button,
  Fade,
  Box,
  Badge,
  IconButton,
  useToast,
  useColorModeValue,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useDisclosure,
} from '@chakra-ui/react'
import Head from 'next/head'
import { FiDownload, FiTrash2, FiSearch, FiPlus } from 'react-icons/fi'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'
import useAppStateContext from '../hooks/useAppStateContext'
import SetlistView from '../components/SetlistView'
import DatePickerModal, { getLastSelectedDate, setLastSelectedDate } from '../components/DatePickerModal'

interface SavedTabMeta {
  filename: string
  savedAt: string
  artist: string
  name: string
  type: string
  slug: string
  url: string
  error?: boolean
}

export default function Home(): JSX.Element {
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { setSelectedTab, setImportedTab } = useAppStateContext()
  const [savedTabs, setSavedTabs] = useState<SavedTabMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [tabIndex, setTabIndex] = useState(0)
  
  // Restore tab from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('homeTabIndex')
    if (saved) {
      setTabIndex(parseInt(saved, 10))
    }
  }, [])
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')

  // Setlist date picker
  const { isOpen: isDatePickerOpen, onOpen: openDatePicker, onClose: closeDatePicker } = useDisclosure()
  const [setlistTarget, setSetlistTarget] = useState<SavedTabMeta | null>(null)
  const [lastSelectedDate, setLastSelectedDateState] = useState<string | null>(null)

  useEffect(() => {
    setLastSelectedDateState(getLastSelectedDate())
  }, [])

  const fetchSavedTabs = async () => {
    setLoading(true)
    const res = await fetch('/api/saved-tabs')
    const data = await res.json()
    setSavedTabs(data.tabs || [])
    setLoading(false)
  }

  useEffect(() => { fetchSavedTabs() }, [])

  // Listen for tab-saved events (from ImageTabUploader)
  useEffect(() => {
    const handler = () => fetchSavedTabs()
    window.addEventListener('tab-saved', handler)
    return () => window.removeEventListener('tab-saved', handler)
  }, [])

  const handleOpen = async (tab: SavedTabMeta) => {
    const res = await fetch(`/api/download-tab?filename=${encodeURIComponent(tab.filename)}`)
    const parsed = await res.json()
    const fullTab = parsed.tab
    if (!fullTab) return

    if (fullTab.url?.startsWith('local://')) {
      const slug = fullTab.url.replace('local://image-tab/', '')
      fullTab.slug = slug
      try {
        sessionStorage.setItem('savedTabCache', JSON.stringify({ url: fullTab.url, tab: fullTab }))
      } catch {}
      window.location.href = `/tab/${slug}`
      return
    }

    const slug = (fullTab.slug || '').replace(/^tab\//, '')
    const url = `https://tabs.ultimate-guitar.com/tab/${slug}`
    fullTab.url = url
    fullTab.slug = slug
    try {
      sessionStorage.setItem('savedTabCache', JSON.stringify({ url, tab: fullTab }))
    } catch {}
    window.location.href = `/tab/${slug}`
  }

  const handleOpenByFilename = async (filename: string) => {
    const tab = savedTabs.find(t => t.filename === filename)
    if (tab) {
      await handleOpen(tab)
    } else {
      // Fallback: fetch directly
      const res = await fetch(`/api/download-tab?filename=${encodeURIComponent(filename)}`)
      const parsed = await res.json()
      const fullTab = parsed.tab
      if (fullTab) {
        if (fullTab.url?.startsWith('local://')) {
          const slug = fullTab.url.replace('local://image-tab/', '')
          fullTab.slug = slug
          try {
            sessionStorage.setItem('savedTabCache', JSON.stringify({ url: fullTab.url, tab: fullTab }))
          } catch {}
          window.location.href = `/tab/${slug}`
        }
      }
    }
  }

  const handleDownload = (filename: string) => {
    window.open(`/api/download-tab?filename=${encodeURIComponent(filename)}`)
  }

  const handleDelete = async (filename: string) => {
    await fetch(`/api/saved-tabs?filename=${encodeURIComponent(filename)}`, { method: 'DELETE' })
    toast({ description: 'Tab gelöscht', status: 'info', position: 'top-right', duration: 1500 })
    fetchSavedTabs()
  }

  const handleAddToSetlist = (tab: SavedTabMeta) => {
    setSetlistTarget(tab)
    openDatePicker()
  }

  const handleDateSelect = async (date: string) => {
    if (!setlistTarget) return
    setLastSelectedDate(date)
    setLastSelectedDateState(date)

    await fetch('/api/setlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        filename: setlistTarget.filename,
        artist: setlistTarget.artist,
        name: setlistTarget.name,
        type: setlistTarget.type,
      }),
    })
    setSetlistTarget(null)
    // Notify setlist view to refresh
    window.dispatchEvent(new Event('setlist-updated'))
  }

  const handleTabChange = (index: number) => {
    setTabIndex(index)
    try {
      sessionStorage.setItem('homeTabIndex', String(index))
    } catch {}
  }

  return (
    <>
      <Head>
        <title>Song Hub</title>
      </Head>
      <Fade style={{ display: 'flex', flexGrow: '1' }} in={true}>
        <Flex w="100%" px={'5px'} py={{ base: 4, md: 8 }} direction="column" maxW="100%" mx="auto">

          <Tabs index={tabIndex} onChange={handleTabChange} variant="soft-rounded" colorScheme="blue" mb={4}>
            <TabList>
              <Tab>{`🎸 Songs (${savedTabs.length})`}</Tab>
              <Tab>📋 Setlist</Tab>
            </TabList>

            <TabPanels>
              {/* Songs Tab */}
              <TabPanel px={0}>
                <InputGroup mb={4}>
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search saved songs...…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>

                {loading ? (
                  <Flex justify="center" mt={10}><Spinner /></Flex>
                ) : (() => {
                  const q = searchQuery.toLowerCase()
                  const filtered = savedTabs
                    .filter(tab =>
                      !q ||
                      tab.artist?.toLowerCase().includes(q) ||
                      tab.name?.toLowerCase().includes(q) ||
                      tab.type?.toLowerCase().includes(q)
                    )
                    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'))
                  if (filtered.length === 0) return (
                    <Box textAlign="center" mt={10} color="gray.400">
                      <Text fontSize="lg" mb={2}>
                        {savedTabs.length === 0 ? 'Noch keine Tabs gespeichert.' : 'Keine Treffer.'}
                      </Text>
                      {savedTabs.length === 0 && (
                        <Text fontSize="sm">Suche einen Tab und klicke auf &quot;Speichern&quot;.</Text>
                      )}
                    </Box>
                  )
                  return (
                    <Stack spacing={2}>
                      {filtered.map((tab) => (
                        <Flex
                          key={tab.filename}
                          align="center"
                          justify="space-between"
                          px={4}
                          py={3}
                          borderWidth="1px"
                          borderColor={borderColor}
                          borderRadius="md"
                          cursor="pointer"
                          _hover={{ bg: hoverBg }}
                          onClick={() => handleOpen(tab)}
                        >
                          <Box flex={1}>
                            <Text fontSize="lg" fontWeight="bold" noOfLines={1}>
                              {tab.name}
                            </Text>
                            <Flex align="center" justify="space-between" mt={1}>
                              <Text fontSize="sm" color="gray.500">{tab.artist}</Text>
                              <Flex gap={1} onClick={(e) => e.stopPropagation()}>
                                <IconButton
                                  aria-label="Zur Setlist hinzufügen"
                                  icon={<FiPlus />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="green"
                                  onClick={() => handleAddToSetlist(tab)}
                                />
                                <IconButton
                                  aria-label="JSON herunterladen"
                                  icon={<FiDownload />}
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => handleDownload(tab.filename)}
                                />
                                <IconButton
                                  aria-label="Löschen"
                                  icon={<FiTrash2 />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => handleDelete(tab.filename)}
                                />
                              </Flex>
                            </Flex>
                          </Box>
                        </Flex>
                      ))}
                    </Stack>
                  )
                })()}
              </TabPanel>

              {/* Setlist Tab */}
              <TabPanel px={0}>
                <SetlistView onOpenTab={handleOpenByFilename} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Flex>
      </Fade>

      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={closeDatePicker}
        onDateSelect={handleDateSelect}
        selectedDate={lastSelectedDate}
      />
    </>
  )
}
