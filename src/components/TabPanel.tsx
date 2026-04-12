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
import { MouseEvent, MouseEventHandler, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
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
  const router = useRouter()
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
  const [autoscrollSpeed, setAutoscrollSpeed] = useState<number>(10)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const contentContainerRef = useRef<HTMLDivElement>(null)
  const fullscreenClickTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isFullscreenMode, setIsFullscreenMode] = useState<boolean>(false)
  const fullscreenBgBase = useColorModeValue('white', 'gray.900')
  const fullscreenBg = isImageContentMode ? 'black' : fullscreenBgBase

  const toggleFullscreen = () => {
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
      if (!img.dataset.prevMargin) img.dataset.prevMargin = img.style.margin || ''
      if (!img.dataset.prevDisplay) img.dataset.prevDisplay = img.style.display || ''

      img.style.width = '100%'
      img.style.maxWidth = '100%'
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

  const flexSongNameDirection = useBreakpointValue({
    base:
      selectedTabContent &&
      selectedTabContent.artist?.length + selectedTabContent.name?.length > 30
        ? 'column'
        : 'row',
    sm: 'row',
  })
  const borderLightColor = useColorModeValue('gray.200', 'gray.700')
  const widthThirdRow = useBreakpointValue({ base: '100%', md: 'initial' })
  const marginTopThirdRow = useBreakpointValue({ base: 0, md: 2 })
  const paddingTopThirdRow = useBreakpointValue({ base: 1, md: 0 })
  const capoTuningFlexDirection = useBreakpointValue<'column-reverse' | 'row'>({
    base: 'column-reverse',
    sm: 'row',
  })

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
        if (!img.dataset.prevMargin) img.dataset.prevMargin = img.style.margin || ''
        if (!img.dataset.prevDisplay) img.dataset.prevDisplay = img.style.display || ''

        img.style.width = '100%'
        img.style.maxWidth = '100%'
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

  return (
    <>
      <Box
        h="100%"
        px={'5px'}
        py={2}
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
          isLoaded={!isLoading}
        >
          {/* Row 1: Artist + Title — full width */}
          <Flex alignItems={'center'} flexDirection={'row'} py={1} flexWrap={'nowrap'} minW={0} overflow={'hidden'} width={'100%'} lineHeight={'1.2'}>
            {isImageTab ? (
              <Flex direction="column" flex={1} minW={0}>
                <Editable
                  value={editName}
                  onChange={setEditName}
                  onSubmit={(val) => handleRename(editArtist, val)}
                  title="Klicken zum Bearbeiten"
                  display="flex"
                  alignItems="center"
                >
                  <EditablePreview fontSize={'xl'} fontWeight="bold" lineHeight={'1.2'} cursor="pointer" _hover={{ textDecoration: 'underline', color: 'blue.400' }} noOfLines={1} />
                  <EditableInput fontSize={'xl'} fontWeight="bold" lineHeight={'1.2'} w="100%" />
                </Editable>
                <Editable
                  value={editArtist}
                  onChange={setEditArtist}
                  onSubmit={(val) => handleRename(val, editName)}
                  title="Klicken zum Bearbeiten"
                  display="flex"
                  alignItems="center"
                >
                  <EditablePreview fontSize={'sm'} color="gray.500" lineHeight={'1.2'} cursor="pointer" _hover={{ textDecoration: 'underline', color: 'blue.400' }} />
                  <EditableInput fontSize={'sm'} lineHeight={'1.2'} w="auto" minW="60px" />
                </Editable>
              </Flex>
            ) : (
              <>
                <Text fontSize={'xl'} as="b" mr={1} whiteSpace={'nowrap'} overflow={'hidden'} textOverflow={'ellipsis'} flex={1} minW={0}>
                  {selectedTabContent?.name}
                </Text>
                <Text fontSize={'sm'} color="gray.500" whiteSpace={'nowrap'} flexShrink={0}>
                  {selectedTabContent?.artist}
                </Text>
              </>
            )}
          </Flex>

          {/* Row 2: Heart + Save right */}
          <Flex justifyContent={'space-between'} alignItems={'center'} py={1} flexWrap={'wrap'} gap={1}>
            {/* Heart + Setlist + Save — right side of row 2 */}
            <Flex alignItems={'center'} gap={1} flexShrink={0} ml={"auto"}>
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

          {selectedTabContent?.tonality && (
            <Flex justifyContent={'space-between'} flexDirection={'row'}>
              <Flex fontSize={'sm'} py={2}>
                <Text color={'gray.500'} as="b" mr={1}>
                  Key
                </Text>{' '}
                <Icon boxSize={5} as={GiMusicalScore} mr={1} />
                {selectedTabContent?.tonality}
              </Flex>{' '}
              {selectedTabContent?.difficulty && (
                <Flex fontSize={'sm'} py={2}>
                  <Text color={'gray.500'} as="b" mr={1}>
                    Difficulty
                  </Text>{' '}
                  <Difficulty level={selectedTabContent?.difficulty} />
                </Flex>
              )}{' '}
            </Flex>
          )}
          {(selectedTabContent?.capo || selectedTabContent?.tuning) && (
            <Flex
              justifyContent={'space-between'}
              flexDirection={capoTuningFlexDirection}
            >
              {selectedTabContent?.capo && (
                <Flex fontSize={'sm'} py={2}>
                  <Text color={'gray.500'} as="b" mr={1}>
                    Capo
                  </Text>{' '}
                  <Icon boxSize={5} as={GiCrowbar} mr={1} />
                  {selectedTabContent?.capo}
                </Flex>
              )}{' '}
              {selectedTabContent?.tuning && (
                <Flex fontSize={'sm'} py={2}>
                  <Text color={'gray.500'} as="b" mr={1}>
                    Tuning
                  </Text>{' '}
                  <Icon boxSize={5} as={GiGuitarHead} mr={1} />
                  {selectedTabContent?.tuning?.join(' ')}
                </Flex>
              )}{' '}
            </Flex>
          )}

          <Flex
            justifyContent={'space-between'}
            flexDirection={useBreakpointValue({ base: 'column', md: 'row' })}
            alignItems={'center'}
          >
            {chordsDiagrams && selectedTabContent?.type === 'Chords' && (
              <Flex
                pb={1}
                justifyContent={'start'}
                w={widthThirdRow}
                mt={marginTopThirdRow}
                pt={paddingTopThirdRow}
              >
                <ChordTransposer
                  chords={chordsDiagrams}
                  setChords={setChordsDiagrams}
                />
              </Flex>
            )}

            <Flex pb={1} w={widthThirdRow} pt={0} flexWrap={'wrap'}>
              {isImageTab ? (
                <Flex fontSize={'sm'} alignItems={'center'} w={widthThirdRow} mt={marginTopThirdRow} pt={paddingTopThirdRow}>
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
                  w={widthThirdRow}
                  mt={marginTopThirdRow}
                  pt={paddingTopThirdRow}
                />
              )}
            </Flex>
            {(isImageTab || selectedTabContent?.type != 'Chords') && (
              <TabActionButtons
                w={widthThirdRow}
                showBackingTrack={showBackingTrack}
                setShowBackingTrack={setShowBackingTrack}
                showAutoscroll={showAutoscroll}
                setShowAutoscroll={setShowAutoscroll}
                isFullscreenMode={isFullscreenMode}
                toggleFullscreen={toggleFullscreen}
              />
            )}
          </Flex>
          {!isImageTab && chordsDiagrams && selectedTabContent?.type === 'Chords' && (
            <TabActionButtons
              w={widthThirdRow}
              showBackingTrack={showBackingTrack}
              setShowBackingTrack={setShowBackingTrack}
              showAutoscroll={showAutoscroll}
              setShowAutoscroll={setShowAutoscroll}
              isFullscreenMode={isFullscreenMode}
              toggleFullscreen={toggleFullscreen}
            />
          )}
        </Skeleton>
      </Box>

      <Flex
        ref={contentContainerRef}
        p={isFullscreenMode ? 0 : '5px'}
        h={isFullscreenMode ? '100dvh' : '100%'}
        w="100%"
        flexGrow={1}
        alignItems={'stretch'}
        wrap={'wrap'}
        justifyContent="center"
        position={isFullscreenMode ? 'fixed' : 'relative'}
        inset={isFullscreenMode ? 0 : undefined}
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
              '& .image-tab-container': {
                display: isFullscreenMode ? 'block' : 'inline-block',
                minWidth: '100%',
                width: isFullscreenMode ? '100%' : undefined,
              },
              '& img': {
                display: 'block !important',
                maxWidth: isFullscreenMode ? '100%' : 'none',
                width: isFullscreenMode ? '100%' : `${imageZoom}%`,
                height: 'auto',
                margin: '0 auto',
              }
            } : undefined}
          >
            {selectedTabContent && HTMLReactParser(selectedTabContent?.htmlTab)}
          </Flex>
        </Skeleton>
      </Flex>
      {isFullscreenMode && (
        <Flex position="fixed" top={3} right={3} zIndex={1600} gap={2} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
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
            variant="outline"
            boxShadow="md"
            _hover={{ bg: 'blue.400', color: 'white' }}
            _active={{ bg: 'fadebp', color: 'white' }}
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
