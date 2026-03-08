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
  Divider,
  useToast,
  useColorModeValue,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import Head from 'next/head'
import { FiDownload, FiTrash2, FiSearch } from 'react-icons/fi'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'
import useAppStateContext from '../hooks/useAppStateContext'

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
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')

  const fetchSavedTabs = async () => {
    setLoading(true)
    const res = await fetch('/api/saved-tabs')
    const data = await res.json()
    setSavedTabs(data.tabs || [])
    setLoading(false)
  }

  useEffect(() => { fetchSavedTabs() }, [])

  const handleOpen = async (tab: SavedTabMeta) => {
    const res = await fetch(`/api/download-tab?filename=${encodeURIComponent(tab.filename)}`)
    const parsed = await res.json()
    const fullTab = parsed.tab
    if (!fullTab) return

    // Image-tabs have local:// URLs — keep them as-is, use slug from URL
    if (fullTab.url?.startsWith('local://')) {
      const slug = fullTab.url.replace('local://image-tab/', '')
      fullTab.slug = slug
      try {
        sessionStorage.setItem('savedTabCache', JSON.stringify({ url: fullTab.url, tab: fullTab }))
      } catch {}
      window.location.href = `/tab/${slug}`
      return
    }

    // Fix slug: remove leading 'tab/' if present (avoid double tab/tab/ in URL)
    const slug = (fullTab.slug || '').replace(/^tab\//, '')
    const url = `https://tabs.ultimate-guitar.com/tab/${slug}`
    fullTab.url = url
    fullTab.slug = slug
    // Store in sessionStorage so /tab/[slug] can load instantly without Puppeteer
    try {
      sessionStorage.setItem('savedTabCache', JSON.stringify({ url, tab: fullTab }))
    } catch {}
    window.location.href = `/tab/${slug}`
  }

  const handleDownload = (filename: string) => {
    window.open(`/api/download-tab?filename=${encodeURIComponent(filename)}`)
  }

  const handleDelete = async (filename: string) => {
    await fetch(`/api/saved-tabs?filename=${encodeURIComponent(filename)}`, { method: 'DELETE' })
    toast({ description: 'Tab gelöscht', status: 'info', position: 'top-right', duration: 1500 })
    fetchSavedTabs()
  }

  return (
    <>
      <Head>
        <title>Ultimate Tab</title>
      </Head>
      <Fade style={{ display: 'flex', flexGrow: '1' }} in={true}>
        <Flex w="100%" p={8} direction="column" maxW="2xl" mx="auto">

          {/* Header row */}
          <Flex align="center" justify="space-between" mb={6}>
            <Heading fontSize={{ base: '2xl', md: '3xl' }}>
              🎸 Gespeicherte Tabs
            </Heading>
          </Flex>

          {/* Search bar */}
          <InputGroup mb={4}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray" />
            </InputLeftElement>
            <Input
              placeholder="Gespeicherte Tabs durchsuchen…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </InputGroup>

          {/* Tab list */}
          {loading ? (
            <Flex justify="center" mt={10}><Spinner /></Flex>
          ) : (() => {
            const q = searchQuery.toLowerCase()
            const filtered = savedTabs.filter(tab =>
              !q ||
              tab.artist?.toLowerCase().includes(q) ||
              tab.name?.toLowerCase().includes(q) ||
              tab.type?.toLowerCase().includes(q)
            )
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
                  <Box flex={1} mr={2}>
                    <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                      {tab.artist} — {tab.name}
                    </Text>
                    <Flex align="center" gap={2} mt={0.5}>
                      <Badge fontSize="xs" colorScheme="blue">{tab.type}</Badge>
                      <Text fontSize="xs" color="gray.400">
                        {tab.savedAt ? new Date(tab.savedAt).toLocaleDateString('de-DE') : ''}
                      </Text>
                    </Flex>
                  </Box>
                  <Flex gap={1} onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      aria-label="JSON herunterladen"
                      icon={<FiDownload />}
                      size="xs"
                      variant="ghost"
                      title="JSON herunterladen"
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
              ))}
            </Stack>
            )
          })()}
        </Flex>
      </Fade>
    </>
  )
}
