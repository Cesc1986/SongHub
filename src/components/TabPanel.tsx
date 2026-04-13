import { ChevronDownIcon, AddIcon, MinusIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Skeleton,
  Text,
  Tooltip,
  useBreakpointValue,
  useColorModeValue,
  useToast,
  Input,
  EditableInput,
  Editable,
  EditablePreview,
} from '@chakra-ui/react'
import HTMLReactParser from 'html-react-parser'
import { GiGuitarHead } from 'react-icons/gi'
import { RiHeartFill, RiHeartLine } from 'react-icons/ri'
import { FaCircleArrowDown } from 'react-icons/fa6'
import { GiMusicalScore } from 'react-icons/gi'
import { GiCrowbar } from 'react-icons/gi'
import Difficulty from './Difficulty'
import ChordDiagram from './ChordDiagram'
import { Tab, UGChordCollection } from '../types/tabs'
import { MouseEvent, MouseEventHandler, useEffect, useMemo, useRef, useState } from 'react'
import { FaPlayCircle } from 'react-icons/fa'
import { MdFullscreenExit } from 'react-icons/md'
import ChordTransposer from './ChordTransposer'
import BackingtrackPlayer from './BackingtrackPlayer'
import Autoscroller from './Autoscroller'
import useAppStateContext from '../hooks/useAppStateContext'
import FontSizeManager from './FontSizeManager'
import TabActionButtons from './TabActionButtons'
import TabSaveButton from './TabSaveButton'
import SetlistAddButton from './SetlistAddButton'

interface TabPanelProps {
  selectedTab: Tab
  isFavorite: boolean
  selectedTabContent: Tab
  isLoading: boolean
  handleClickFavorite: MouseEventHandler<HTMLButtonElement>
  refetchTab: Function
}

export default function TabPanel({
  isFavorite,
  selectedTab,
  selectedTabContent,
  isLoading,
  handleClickFavorite,
}: TabPanelProps) {
  const { tabFontSize } = useAppStateContext()
  const toast = useToast()

  const isImageTab = selectedTab?.url?.startsWith('local://') || selectedTabContent?.url?.startsWith('local://')
  const isLikelyImageContent =
    isImageTab || Boolean(selectedTabContent?.htmlTab?.includes('<img'))
  const [isImageContentRuntime, setIsImageContentRuntime] = useState<boolean>(false)
  const isImageContentMode = isLikelyImageContent || isImageContentRuntime
  const [editArtist, setEditArtist] = useState<string>('')
  const [editName, setEditName] = useState<string>('')

  useEffect(() => {
    setEditArtist(selectedTabContent?.artist || '')
    setEditName(selectedTabContent?.name || '')
  }, [selectedTabContent?.artist, selectedTabContent?.name])

  const handleRename = async (newArtist: string, newName: string) => {
    if (!isImageTab || (!newArtist.trim() && !newName.trim())) return
    const artist = newArtist.trim() || selectedTabContent?.artist
    const name = newName.trim() || selectedTabContent?.name
    if (artist === selectedTabContent?.artist && name === selectedTabContent?.name) return
    try {
      // Find filename from sessionStorage or construct it
      const oldFilename = `${selectedTabContent?.artist} - ${selectedTabContent?.name} (${selectedTabContent?.type || 'Chords'}).ultimatetab.json`
      const res = await fetch('/api/rename-tab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: oldFilename, artist, name }),
      })
      if (res.ok) {
        toast({ description: 'Gespeichert', status: 'success', position: 'top-right', duration: 1500 })
      }
    } catch {}
  }

  const [chordsDiagrams, setChordsDiagrams] = useState<UGChordCollection[]>(
    selectedTabContent?.chordsDiagrams,
  )
  const [showAutoscroll, setShowAutoscroll] = useState<boolean>(false)
  const [showBackingTrack, setShowBackingTrack] = useState<boolean>(false)
  const [imageZoom, setImageZoom] = useState<number>(100)
  const [songMarks, setSongMarks] = useState<{ A: boolean; F: boolean }>({ A: false, F: false })
  const [musicianMarkingEnabled, setMusicianMarkingEnabled] = useState<boolean>(false)
  const [autoscrollSpeed, setAutoscrollSpeed] = useState<number>(10)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const contentContainerRef = useRef<HTMLDivElement>(null)
  const [fullscreenInsets, setFullscreenInsets] = useState<{ left: number; right: number }>({ left: 0, right: 0 })
  const fullscreenClickTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isFullscreenMode, setIsFullscreenMode] = useState<boolean>(false)
  const fullscreenBgBase = useColorModeValue('white', 'gray.900')
  const fullscreenBg = isImageContentMode ? 'black' : fullscreenBgBase

  const toggleFullscreen = () => {
    if (!isFullscreenMode && !isImageContentMode && contentContainerRef.current && typeof window !== 'undefined') {
      const rect = contentContainerRef.current.getBoundingClientRect()
      setFullscreenInsets({
        left: Math.max(0, Math.round(rect.left)),
        right: Math.max(0, Math.round(window.innerWidth - rect.right)),
      })
    }

    setIsFullscreenMode((prev) => !prev)
  }

  const handleImageContentClick = (event: MouseEvent<HTMLDivElement>) => {
    const hasImgInTarget = Boolean(event.currentTarget.querySelector('img'))
    if (hasImgInTarget) {
      setIsImageContentRuntime(true)
    }

    if (!(isImageContentMode || hasImgInTarget)) return

    // Ignore second click from double-click gesture (used for zoom)
    if (event.detail > 1) return

    const targetImgs = Array.from(event.currentTarget.querySelectorAll('img')) as HTMLImageElement[]

    if (isFullscreenMode) {
      if (fullscreenClickTimeoutRef.current) {
        clearTimeout(fullscreenClickTimeoutRef.current)
      }
      fullscreenClickTimeoutRef.current = setTimeout(() => {
        targetImgs.forEach((img) => {
          if (img.dataset.prevWidth !== undefined) img.style.width = img.dataset.prevWidth || ''
          if (img.dataset.prevMaxWidth !== undefined) img.style.maxWidth = img.dataset.prevMaxWidth || ''
          if (img.dataset.prevMaxHeight !== undefined) img.style.maxHeight = img.dataset.prevMaxHeight || ''
          if (img.dataset.prevMargin !== undefined) img.style.margin = img.dataset.prevMargin || ''
          if (img.dataset.prevDisplay !== undefined) img.style.display = img.dataset.prevDisplay || ''
        })
        setIsFullscreenMode(false)
      }, 220)
      return
    }

    targetImgs.forEach((img) => {
      if (!img.dataset.prevWidth) img.dataset.prevWidth = img.style.width || ''
      if (!img.dataset.prevMaxWidth) img.dataset.prevMaxWidth = img.style.maxWidth || ''
      if (!img.dataset.prevMaxHeight) img.dataset.prevMaxHeight = img.style.maxHeight || ''
      if (!img.dataset.prevMargin) img.dataset.prevMargin = img.style.margin || ''
      if (!img.dataset.prevDisplay) img.dataset.prevDisplay = img.style.display || ''

      img.style.width = 'auto'
      img.style.maxWidth = '100%'
      img.style.maxHeight = '100dvh'
      img.style.margin = '0 auto'
      img.style.display = 'block'
    })

    setIsFullscreenMode(true)
  }

  const handleImageDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!isImageContentMode) return
    event.preventDefault()

    if (fullscreenClickTimeoutRef.current) {
      clearTimeout(fullscreenClickTimeoutRef.current)
      fullscreenClickTimeoutRef.current = null
    }

    // Double-click zoom only in normal mode.
    // Fullscreen image should remain fit-to-screen without horizontal scrolling.
    if (isFullscreenMode) return

    setImageZoom((prev) => {
      if (prev >= 200) return 100
      return prev + 25
    })
  }

  const changeZoom = (delta: number) => {
    setImageZoom((z) => {
      const next = Math.min(300, Math.max(50, z + delta))
      // After state update, scroll container to horizontal center
      setTimeout(() => {
        const el = imageContainerRef.current
        if (el) {
          const scrollMax = el.scrollWidth - el.clientWidth
          el.scrollLeft = scrollMax / 2
        }
      }, 0)
      return next
    })
  }

  const borderLightColor = useColorModeValue('gray.200', 'gray.700')
  const headerRowDirection =
    (useBreakpointValue({ base: 'column', md: 'row' }) as 'column' | 'row') || 'row'

  useEffect(() => {
    setChordsDiagrams(selectedTabContent?.chordsDiagrams)
  }, [selectedTabContent])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const originalOverflow = document.body.style.overflow
    if (isFullscreenMode) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = originalOverflow || ''
    }

    return () => {
      document.body.style.overflow = originalOverflow || ''
    }
  }, [isFullscreenMode])

  useEffect(() => {
    return () => {
      if (fullscreenClickTimeoutRef.current) {
        clearTimeout(fullscreenClickTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isImageContentMode && isFullscreenMode) {
      // Image fullscreen is purely visual; disable autoscroll there.
      setShowAutoscroll(false)
      // ensure fit-to-screen default when entering fullscreen
      setImageZoom(100)
    }

    const root = contentContainerRef.current
    if (!root) return

    const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[]
    imgs.forEach((img) => {
      const wrapper = img.parentElement as HTMLElement | null

      if (isImageContentMode && isFullscreenMode) {
        if (!img.dataset.prevWidth) img.dataset.prevWidth = img.style.width || ''
        if (!img.dataset.prevMaxWidth) img.dataset.prevMaxWidth = img.style.maxWidth || ''
        if (!img.dataset.prevMaxHeight) img.dataset.prevMaxHeight = img.style.maxHeight || ''
        if (!img.dataset.prevMargin) img.dataset.prevMargin = img.style.margin || ''
        if (!img.dataset.prevDisplay) img.dataset.prevDisplay = img.style.display || ''

        img.style.width = 'auto'
        img.style.maxWidth = '100%'
        img.style.maxHeight = '100dvh'
        img.style.margin = '0 auto'
        img.style.display = 'block'

        if (wrapper) {
          if (wrapper.dataset.prevPadding === undefined) {
            wrapper.dataset.prevPadding = wrapper.style.padding || ''
          }
          wrapper.style.padding = '0px'
        }
      } else {
        if (img.dataset.prevWidth !== undefined) img.style.width = img.dataset.prevWidth || ''
        if (img.dataset.prevMaxWidth !== undefined) img.style.maxWidth = img.dataset.prevMaxWidth || ''
        if (img.dataset.prevMaxHeight !== undefined) img.style.maxHeight = img.dataset.prevMaxHeight || ''
        if (img.dataset.prevMargin !== undefined) img.style.margin = img.dataset.prevMargin || ''
        if (img.dataset.prevDisplay !== undefined) img.style.display = img.dataset.prevDisplay || ''

        if (wrapper && wrapper.dataset.prevPadding !== undefined) {
          wrapper.style.padding = wrapper.dataset.prevPadding || ''
        }
      }
    })
  }, [isImageContentMode, isFullscreenMode])

  useEffect(() => {
    setIsImageContentRuntime(false)
  }, [selectedTabContent?.url])

  const savedFilename = useMemo(() => {
    if (selectedTabContent?.savedFilename) return selectedTabContent.savedFilename

    const isSavedTab = Boolean(selectedTabContent?.savedAt || selectedTab?.savedAt)
    if (!isSavedTab) return ''
    if (!selectedTabContent?.artist || !selectedTabContent?.name) return ''

    const type = selectedTabContent?.type || 'Chords'
    return `${selectedTabContent.artist} - ${selectedTabContent.name} (${type}).ultimatetab.json`
  }, [
    selectedTabContent?.savedFilename,
    selectedTabContent?.savedAt,
    selectedTab?.savedAt,
    selectedTabContent?.artist,
    selectedTabContent?.name,
    selectedTabContent?.type,
  ])

  useEffect(() => {
    let active = true
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        setMusicianMarkingEnabled(Boolean(data?.musicianMarkingEnabled))
      })
      .catch(() => {
        if (!active) return
        setMusicianMarkingEnabled(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const marks = selectedTabContent?.marks
    setSongMarks({
      A: Boolean(marks?.A),
      F: Boolean(marks?.F),
    })
  }, [selectedTabContent?.marks, selectedTabContent?.savedFilename])

  const toggleSongMark = async (mark: 'A' | 'F') => {
    if (!musicianMarkingEnabled || !savedFilename) return

    const nextMarks = {
      ...songMarks,
      [mark]: !songMarks[mark],
    }

    setSongMarks(nextMarks)

    const res = await fetch('/api/song-marks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: savedFilename, marks: nextMarks }),
    })

    if (!res.ok) {
      setSongMarks((prev) => ({ ...prev, [mark]: !nextMarks[mark] }))
      toast({
        description: 'Markierung konnte nicht gespeichert werden',
        status: 'error',
        duration: 1500,
        position: 'top-right',
      })
    }
  }

  return (
    <>
      <Box
        h="100%"
        px={'5px'}
        py={1}
        borderBottomStyle={'solid'}
        borderBottomWidth={selectedTabContent && '1px'}
        borderBottomColor={borderLightColor}
        display={isFullscreenMode ? 'none' : 'block'}
      >
        <Skeleton
          justifyContent={'space-between'}
          flexDirection="column"
          display={'flex'}
          h="100%"
          gap={1}
          isLoaded={!isLoading}
        >
          {/* Row 1: Artist + Title — full width */}
          <Flex
            alignItems={{ base: 'flex-start', md: 'center' }}
            flexDirection={{ base: 'column', md: 'row' }}
            py={0}
            flexWrap={'nowrap'}
            minW={0}
            overflow={'hidden'}
            width={'100%'}
            lineHeight={'1.2'}
            gap={{ base: 0, md: 2 }}
          >
            {isImageTab ? (
              <Flex
                flex={1}
                minW={0}
                alignItems={{ base: 'flex-start', md: 'center' }}
                flexDirection={{ base: 'column', md: 'row' }}
                gap={{ base: 0, md: 2 }}
              >
                <Editable
                  value={editName}
                  onChange={setEditName}
                  onSubmit={(val) => handleRename(editArtist, val)}
                  title="Klicken zum Bearbeiten"
                  display="flex"
                  alignItems="center"
                  flex={1}
                  minW={0}
                >
                  <EditablePreview
                    fontSize={'xl'}
                    fontWeight="bold"
                    lineHeight={'1.2'}
                    cursor="pointer"
                    _hover={{ textDecoration: 'underline', color: 'blue.400' }}
                    noOfLines={1}
                    whiteSpace={'nowrap'}
                    overflow={'hidden'}
                    textOverflow={'ellipsis'}
                  />
                  <EditableInput fontSize={'xl'} fontWeight="bold" lineHeight={'1.2'} w="100%" />
                </Editable>
                <Editable
                  value={editArtist}
                  onChange={setEditArtist}
                  onSubmit={(val) => handleRename(val, editName)}
                  title="Klicken zum Bearbeiten"
                  display="flex"
                  alignItems="center"
                  flexShrink={0}
                >
                  <EditablePreview
                    fontSize={'sm'}
                    color="gray.500"
                    lineHeight={'1.2'}
                    cursor="pointer"
                    _hover={{ textDecoration: 'underline', color: 'blue.400' }}
                    whiteSpace={{ base: 'normal', md: 'nowrap' }}
                  />
                  <EditableInput fontSize={'sm'} lineHeight={'1.2'} w="auto" minW="60px" />
                </Editable>
              </Flex>
            ) : (
              <>
                <Text fontSize={'xl'} as="b" mr={1} whiteSpace={'nowrap'} overflow={'hidden'} textOverflow={'ellipsis'} flex={1} minW={0}>
                  {selectedTabContent?.name}
                </Text>
                <Text fontSize={'sm'} color="gray.500" whiteSpace={{ base: 'normal', md: 'nowrap' }} flexShrink={0}>
                  {selectedTabContent?.artist}
                </Text>
              </>
            )}
          </Flex>

          {/* Row 2: metadata + primary actions in one compact line */}
          <Flex justifyContent={'space-between'} alignItems={'center'} py={0} flexWrap={'wrap'} gap={2}>
            <Flex flexWrap={'wrap'} gap={2} alignItems={'center'}>
              {isImageTab && (
                <Badge variant="subtle" colorScheme="gray" px={2} py={1}>
                  <Text fontSize={'xs'}>Foto</Text>
                </Badge>
              )}

              {selectedTabContent?.tonality && (
                <Badge variant="subtle" colorScheme="blue" px={2} py={1}>
                  <Flex align="center" gap={1}>
                    <Icon boxSize={3.5} as={GiMusicalScore} />
                    <Text fontSize={'xs'}>Key: {selectedTabContent?.tonality}</Text>
                  </Flex>
                </Badge>
              )}

              {selectedTabContent?.difficulty && (
                <Badge variant="subtle" colorScheme="purple" px={2} py={1}>
                  <Flex align="center" gap={1}>
                    <Text fontSize={'xs'}>Difficulty:</Text>
                    <Difficulty level={selectedTabContent?.difficulty} />
                  </Flex>
                </Badge>
              )}

              {selectedTabContent?.capo && (
                <Badge variant="subtle" colorScheme="orange" px={2} py={1}>
                  <Flex align="center" gap={1}>
                    <Icon boxSize={3.5} as={GiCrowbar} />
                    <Text fontSize={'xs'}>Capo: {selectedTabContent?.capo}</Text>
                  </Flex>
                </Badge>
              )}

              {selectedTabContent?.tuning && (
                <Badge variant="subtle" colorScheme="teal" px={2} py={1}>
                  <Flex align="center" gap={1}>
                    <Icon boxSize={3.5} as={GiGuitarHead} />
                    <Text fontSize={'xs'}>Tuning: {selectedTabContent?.tuning?.join(' ')}</Text>
                  </Flex>
                </Badge>
              )}
            </Flex>

            <Flex alignItems={'center'} gap={1} flexShrink={0} ml={{ base: 0, md: 'auto' }}>
              <Tooltip placement="left" label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton
                  icon={isFavorite ? <RiHeartFill /> : <RiHeartLine />}
                  onClick={handleClickFavorite}
                  colorScheme={isFavorite ? 'red' : 'gray'}
                  variant="ghost"
                  aria-label="Add to favorites"
                  size={'sm'}
                />
              </Tooltip>
              <SetlistAddButton tab={selectedTabContent} isLoading={isLoading} />
              <TabSaveButton tab={selectedTabContent} isLoading={isLoading} />
            </Flex>
          </Flex>

          {(chordsDiagrams && selectedTabContent?.type === 'Chords') || (musicianMarkingEnabled && savedFilename) ? (
            <Flex
              justifyContent={'space-between'}
              flexDirection={headerRowDirection}
              alignItems={{ base: 'stretch', md: 'center' }}
              gap={2}
            >
              {chordsDiagrams && selectedTabContent?.type === 'Chords' ? (
                <Flex pb={0} justifyContent={'start'} flex={1} minW={0}>
                  <ChordTransposer
                    chords={chordsDiagrams}
                    setChords={setChordsDiagrams}
                  />
                </Flex>
              ) : (
                <Box flex={1} />
              )}

              {musicianMarkingEnabled && savedFilename && (
                <Flex alignItems={'center'} gap={1} justifyContent={{ base: 'flex-start', md: 'flex-end' }} flexShrink={0}>
                  <Button
                    size="xs"
                    variant={songMarks.A ? 'solid' : 'outline'}
                    colorScheme={songMarks.A ? 'green' : 'gray'}
                    onClick={() => toggleSongMark('A')}
                    minW={'28px'}
                    px={2}
                  >
                    A
                  </Button>
                  <Button
                    size="xs"
                    variant={songMarks.F ? 'solid' : 'outline'}
                    colorScheme={songMarks.F ? 'orange' : 'gray'}
                    onClick={() => toggleSongMark('F')}
                    minW={'28px'}
                    px={2}
                  >
                    F
                  </Button>
                </Flex>
              )}
            </Flex>
          ) : null}

          <Flex
            justifyContent={'space-between'}
            flexDirection={headerRowDirection}
            alignItems={{ base: 'stretch', md: 'center' }}
            gap={2}
            flexWrap={'wrap'}
          >
            {isImageTab ? (
              <Flex fontSize={'sm'} alignItems={'center'} w={{ base: '100%', md: 'auto' }} pt={0} flexWrap={'wrap'}>
                <Text color={'gray.500'} as="b" mr={1}>Zoom</Text>
                <IconButton
                  variant="outline"
                  _hover={{ bg: 'blue.400', color: 'white' }}
                  size={'sm'} boxShadow="md" fontWeight={'normal'} px="3" py="4"
                  onClick={() => changeZoom(-10)}
                  aria-label="Zoom out"
                  icon={<MinusIcon />}
                />
                <Badge mx={2} variant="subtle" fontSize={'sm'} color={'blue.400'}>{imageZoom}%</Badge>
                <IconButton
                  variant="outline"
                  _hover={{ bg: 'blue.400', color: 'white' }}
                  size={'sm'} boxShadow="md" fontWeight={'normal'} px="3" py="4"
                  onClick={() => changeZoom(10)}
                  aria-label="Zoom in"
                  icon={<AddIcon />}
                />
              </Flex>
            ) : (
              <FontSizeManager
                w={{ base: '100%', md: 'auto' }}
                mt={0}
                pt={0}
              />
            )}

            <TabActionButtons
              w={{ base: '100%', md: 'auto' }}
              showBackingTrack={showBackingTrack}
              setShowBackingTrack={setShowBackingTrack}
              showAutoscroll={showAutoscroll}
              setShowAutoscroll={setShowAutoscroll}
              isFullscreenMode={isFullscreenMode}
              toggleFullscreen={toggleFullscreen}
            />
          </Flex>
        </Skeleton>
      </Box>

      <Flex
        ref={contentContainerRef}
        p={isFullscreenMode ? 0 : '5px'}
        pt={isFullscreenMode && !isImageContentMode ? '56px' : undefined}
        h={isFullscreenMode ? '100dvh' : '100%'}
        w="100%"
        flexGrow={1}
        alignItems={'stretch'}
        wrap={'wrap'}
        justifyContent="center"
        position={isFullscreenMode ? 'fixed' : 'relative'}
        top={isFullscreenMode ? 0 : undefined}
        bottom={isFullscreenMode ? 0 : undefined}
        left={
          isFullscreenMode
            ? isImageContentMode
              ? 0
              : `${fullscreenInsets.left}px`
            : undefined
        }
        right={
          isFullscreenMode
            ? isImageContentMode
              ? 0
              : `${fullscreenInsets.right}px`
            : undefined
        }
        zIndex={isFullscreenMode ? 1400 : undefined}
        bg={isFullscreenMode ? fullscreenBg : undefined}
        overflow={isFullscreenMode ? 'auto' : 'visible'}
      >
        <Skeleton display={'flex'} w="100%" isLoaded={!isLoading}>
          <Flex
            ref={isImageContentMode ? imageContainerRef : undefined}
            h={isFullscreenMode ? 'auto' : '100%'}
            minH={isFullscreenMode ? '100dvh' : undefined}
            w="100%"
            px={isFullscreenMode && !isImageContentMode ? '5px' : 0}
            fontSize={`${tabFontSize / 100}rem !important`}
            data-tab-content="true"
            cursor={isImageContentMode ? (isFullscreenMode ? 'zoom-out' : 'zoom-in') : 'default'}
            onClick={handleImageContentClick}
            onDoubleClick={handleImageDoubleClick}
            sx={isImageContentMode ? {
              overflowY: 'auto',
              overflowX: isFullscreenMode ? 'hidden' : 'auto',
              textAlign: 'center',
              background: isFullscreenMode ? 'black' : undefined,
              display: isFullscreenMode ? 'flex' : undefined,
              alignItems: isFullscreenMode ? 'center' : undefined,
              justifyContent: isFullscreenMode ? 'center' : undefined,
              '& .image-tab-container': {
                display: isFullscreenMode ? 'flex' : 'inline-block',
                alignItems: isFullscreenMode ? 'center' : undefined,
                justifyContent: isFullscreenMode ? 'center' : undefined,
                minWidth: '100%',
                minHeight: isFullscreenMode ? '100dvh' : undefined,
                width: isFullscreenMode ? '100%' : undefined,
              },
              '& img': {
                display: 'block !important',
                maxWidth: isFullscreenMode ? '100%' : 'none',
                maxHeight: isFullscreenMode ? '100dvh' : 'none',
                width: isFullscreenMode ? 'auto' : `${imageZoom}%`,
                height: 'auto',
                margin: '0 auto',
              }
            } : undefined}
          >
            {typeof selectedTabContent?.htmlTab === 'string'
              ? HTMLReactParser(selectedTabContent.htmlTab)
              : null}
          </Flex>
        </Skeleton>
      </Flex>
      {isFullscreenMode && (
        <Flex
          position="fixed"
          top={3}
          right={
            isImageContentMode
              ? 3
              : `${Math.max(5, fullscreenInsets.right + 5)}px`
          }
          zIndex={1600}
          gap={2}
          alignItems="center"
          flexWrap="wrap"
          justifyContent="flex-end"
        >
          {!isImageContentMode && (
            <>
              <Button
                size="sm"
                variant="outline"
                boxShadow="md"
                _hover={{ bg: 'blue.400', color: 'white' }}
                _active={{ bg: 'fadebp', color: 'white' }}
                isActive={showAutoscroll}
                leftIcon={<Icon as={FaCircleArrowDown} />}
                onClick={() => setShowAutoscroll((prev) => !prev)}
              >
                Autoscroll
              </Button>

              {showAutoscroll && (
                <>
                  <IconButton
                    size="sm"
                    variant="outline"
                    boxShadow="md"
                    _hover={{ bg: 'blue.400', color: 'white' }}
                    _active={{ bg: 'fadebp', color: 'white' }}
                    aria-label="Autoscroll slower"
                    icon={<MinusIcon />}
                    onClick={() => setAutoscrollSpeed((s) => Math.max(s - 3, 2))}
                  />
                  <Badge variant="subtle" fontSize="sm" color="blue.500" px={2} py={1}>
                    {autoscrollSpeed} px/s
                  </Badge>
                  <IconButton
                    size="sm"
                    variant="outline"
                    boxShadow="md"
                    _hover={{ bg: 'blue.400', color: 'white' }}
                    _active={{ bg: 'fadebp', color: 'white' }}
                    aria-label="Autoscroll faster"
                    icon={<AddIcon />}
                    onClick={() => setAutoscrollSpeed((s) => Math.min(s + 5, 100))}
                  />
                </>
              )}
            </>
          )}

          <IconButton
            size="sm"
            variant={isImageContentMode ? 'solid' : 'outline'}
            boxShadow="md"
            bg={isImageContentMode ? 'whiteAlpha.900' : undefined}
            color={isImageContentMode ? 'black' : undefined}
            _hover={isImageContentMode ? { bg: 'whiteAlpha.800', color: 'black' } : { bg: 'blue.400', color: 'white' }}
            _active={isImageContentMode ? { bg: 'whiteAlpha.700', color: 'black' } : { bg: 'fadebp', color: 'white' }}
            aria-label="Exit fullscreen"
            icon={<MdFullscreenExit />}
            onClick={toggleFullscreen}
          />
        </Flex>
      )}

      <ChordDiagram chords={chordsDiagrams} />
      <Autoscroller
        showAutoscroll={showAutoscroll}
        isLoading={isLoading}
        bottomCSS={'17px'}
        scrollContainerRef={contentContainerRef}
        useContainerScroll={isFullscreenMode}
        hidePanel={isFullscreenMode}
        scrollSpeed={autoscrollSpeed}
        setScrollSpeed={setAutoscrollSpeed}
      />
    </>
  )
}
