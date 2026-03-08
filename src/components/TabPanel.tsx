import { ChevronDownIcon, StarIcon, AddIcon, MinusIcon } from '@chakra-ui/icons'
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
import { MouseEventHandler, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { FaPlayCircle } from 'react-icons/fa'
import ChordTransposer from './ChordTransposer'
import BackingtrackPlayer from './BackingtrackPlayer'
import Autoscroller from './Autoscroller'
import useAppStateContext from '../hooks/useAppStateContext'
import FontSizeManager from './FontSizeManager'
import TabActionButtons from './TabActionButtons'
import TabSaveButton from './TabSaveButton'

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

  useEffect(() => {
    setChordsDiagrams(selectedTabContent?.chordsDiagrams)
  }, [selectedTabContent])

  return (
    <>
      <Box
        h="100%"
        px={5}
        py={2}
        borderBottomStyle={'solid'}
        borderBottomWidth={selectedTabContent && '1px'}
        borderBottomColor={borderLightColor}
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
              <>
                <Editable
                  value={editArtist}
                  onChange={setEditArtist}
                  onSubmit={(val) => handleRename(val, editName)}
                  mr={1}
                  flexShrink={0}
                  title="Klicken zum Bearbeiten"
                  display="flex"
                  alignItems="center"
                >
                  <EditablePreview fontSize={'md'} fontWeight="bold" lineHeight={'1.2'} cursor="pointer" _hover={{ textDecoration: 'underline', color: 'blue.400' }} />
                  <EditableInput fontSize={'md'} fontWeight="bold" lineHeight={'1.2'} w="auto" minW="60px" />
                </Editable>
                <Editable
                  value={editName}
                  onChange={setEditName}
                  onSubmit={(val) => handleRename(editArtist, val)}
                  flex={1}
                  minW={0}
                  title="Klicken zum Bearbeiten"
                  display="flex"
                  alignItems="center"
                >
                  <EditablePreview fontSize={'md'} lineHeight={'1.2'} whiteSpace={'nowrap'} overflow={'hidden'} textOverflow={'ellipsis'} cursor="pointer" _hover={{ textDecoration: 'underline', color: 'blue.400' }} />
                  <EditableInput fontSize={'md'} lineHeight={'1.2'} w="100%" />
                </Editable>
              </>
            ) : (
              <>
                <Text fontSize={'lg'} as="b" mr={1} whiteSpace={'nowrap'} flexShrink={0}>
                  {selectedTabContent?.artist}
                </Text>
                <Text fontSize={'md'} whiteSpace={'nowrap'} overflow={'hidden'} textOverflow={'ellipsis'} flex={1} minW={0}>
                  {selectedTabContent?.name}
                </Text>
              </>
            )}
          </Flex>

          {/* Row 2: Rating left — Heart + Save right */}
          <Flex justifyContent={'space-between'} alignItems={'center'} py={1} flexWrap={'wrap'} gap={1}>
            <Flex alignItems={'center'}>
              <StarIcon
                fontSize={'sm'}
                color={'yellow.400'}
                position="relative"
                top="-0.05rem"
                mr={'5px'}
              />{' '}
              <Flex>
                {selectedTabContent?.rating} ({selectedTabContent?.numberRates})
              </Flex>
            </Flex>
            {/* Heart + Save — right side of row 2 */}
            <Flex alignItems={'center'} gap={1} flexShrink={0}>
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
              <TabSaveButton tab={selectedTabContent} isLoading={isLoading} />
            </Flex>
          </Flex>

          {/* Row 2b: More versions — eigene Zeile wenn vorhanden */}
          {selectedTabContent?.versions?.length > 0 && (
            <Flex py={1}>
              <Menu>
                <MenuButton
                  as={Button}
                  variant="outline"
                  _hover={{ bg: 'blue.300', color: 'white' }}
                  _active={{ bg: 'blue.600', color: 'white' }}
                  size={'sm'}
                  boxShadow="md"
                  fontWeight={'normal'}
                  px="3"
                  py="1"
                  rightIcon={<ChevronDownIcon />}
                  leftIcon={<Icon fontSize={'sm'} color={'yellow.400'} position="relative" top="-0.05rem" as={StarIcon} />}
                >
                  More versions
                </MenuButton>
                <MenuList>
                  {selectedTabContent?.versions?.map((tab) => (
                    <MenuItem onClick={() => router.push(`/tab/${tab.slug}`)} key={tab.slug}>
                      <StarIcon fontSize={'sm'} color={'yellow.400'} position="relative" top="-0.05rem" mr={'5px'} />{' '}
                      {tab.rating} ({tab.numberRates})
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </Flex>
          )}
          <Flex justifyContent={'space-between'} flexDirection={'row'}>
            <Flex fontSize={'sm'} py={2}>
              <Text color={'gray.500'} as="b" mr={1}>
                Key
              </Text>{' '}
              <Icon boxSize={5} as={GiMusicalScore} mr={1} />
              {selectedTabContent?.tonality}
            </Flex>{' '}
            <Flex fontSize={'sm'} py={2}>
              <Text color={'gray.500'} as="b" mr={1}>
                Difficulty
              </Text>{' '}
              <Difficulty level={selectedTabContent?.difficulty} />
            </Flex>{' '}
          </Flex>
          <Flex
            justifyContent={'space-between'}
            flexDirection={useBreakpointValue({
              base: 'column-reverse',
              sm: 'row',
            })}
          >
            <Flex fontSize={'sm'} py={2}>
              <Text color={'gray.500'} as="b" mr={1}>
                Capo
              </Text>{' '}
              <Icon boxSize={5} as={GiCrowbar} mr={1} />
              {selectedTabContent?.capo}
            </Flex>{' '}
            <Flex fontSize={'sm'} py={2}>
              <Text color={'gray.500'} as="b" mr={1}>
                Tuning
              </Text>{' '}
              <Icon boxSize={5} as={GiGuitarHead} mr={1} />
              {selectedTabContent?.tuning?.join(' ')}
            </Flex>{' '}
          </Flex>

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
                    onClick={() => setImageZoom((z) => Math.max(50, z - 10))}
                    aria-label="Zoom out"
                    icon={<MinusIcon />}
                  />
                  <Badge mx={2} variant="subtle" fontSize={'sm'} color={'blue.400'}>{imageZoom}%</Badge>
                  <IconButton
                    variant="outline"
                    _hover={{ bg: 'blue.400', color: 'white' }}
                    size={'sm'} boxShadow="md" fontWeight={'normal'} px="3" py="4"
                    onClick={() => setImageZoom((z) => Math.min(300, z + 10))}
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
            />
          )}
        </Skeleton>
      </Box>

      <Flex
        p={5}
        h="100%"
        w="100%"
        flexGrow={1}
        alignItems={'stretch'}
        wrap={'wrap'}
        justifyContent="center"
      >
        <Skeleton display={'flex'} w="100%" isLoaded={!isLoading}>
          <Flex
            h={'100%'}
            w="100%"
            fontSize={`${tabFontSize / 100}rem !important`}
            data-tab-content="true"
            sx={isImageTab ? {
              overflow: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              '& img': {
                display: 'block !important',
                maxWidth: 'none !important',
                width: `${imageZoom}% !important`,
                height: 'auto !important',
                flexShrink: '0',
              }
            } : undefined}
          >
            {selectedTabContent && HTMLReactParser(selectedTabContent?.htmlTab)}
          </Flex>
        </Skeleton>
      </Flex>
      <ChordDiagram chords={chordsDiagrams} />
      <Autoscroller
        showAutoscroll={showAutoscroll}
        isLoading={isLoading}
        bottomCSS={'17px'}
      />
    </>
  )
}
