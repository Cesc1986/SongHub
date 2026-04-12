import { AddIcon, MinusIcon } from '@chakra-ui/icons'
import {
  Flex,
  useBreakpointValue,
  useColorModeValue,
  Text,
  Icon,
  Button,
  IconButton,
} from '@chakra-ui/react'
import { Dispatch, RefObject, SetStateAction, useEffect, useRef, useState } from 'react'
import { FaPlayCircle } from 'react-icons/fa'

interface AutoscrollerProps {
  showAutoscroll: boolean
  bottomCSS: string
  isLoading: boolean
  scrollContainerRef?: RefObject<HTMLElement | null>
  useContainerScroll?: boolean
  hidePanel?: boolean
  scrollSpeed?: number
  setScrollSpeed?: Dispatch<SetStateAction<number>>
}

const MIN_SPEED = 2
const MAX_SPEED = 100
const STEP_DOWN = 3
const STEP_UP = 5
const DEFAULT_SPEED = 10

export default function Autoscroller({
  showAutoscroll,
  bottomCSS,
  isLoading,
  scrollContainerRef,
  useContainerScroll = false,
  hidePanel = false,
  scrollSpeed,
  setScrollSpeed,
}: AutoscrollerProps): JSX.Element {
  const widthToolsBar = useBreakpointValue({ base: '100%', sm: '50%' })
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const [isEnabled, setIsEnabled] = useState<boolean>(showAutoscroll)
  const [internalScrollSpeed, setInternalScrollSpeed] = useState<number>(DEFAULT_SPEED)
  const effectiveScrollSpeed = scrollSpeed ?? internalScrollSpeed

  const rafRef = useRef<number>(null)
  const lastTimeRef = useRef<number>(null)
  const accumulatedRef = useRef<number>(0) // fractional pixel accumulator
  const scrollSpeedRef = useRef<number>(DEFAULT_SPEED)
  const isEnabledRef = useRef<boolean>(showAutoscroll)
  const manualTimerRef = useRef<NodeJS.Timeout>(null)

  if (typeof document !== 'undefined') {
    var isTouch = 'ontouchstart' in document.documentElement
  }

  // Keep refs in sync
  useEffect(() => {
    scrollSpeedRef.current = effectiveScrollSpeed
  }, [effectiveScrollSpeed])

  useEffect(() => {
    isEnabledRef.current = isEnabled
  }, [isEnabled])

  const stopScroll = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    lastTimeRef.current = null
    accumulatedRef.current = 0
  }

  const startScroll = () => {
    stopScroll()
    const step = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp
      }
      const delta = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp

      // Accumulate fractional pixels to avoid sub-pixel rounding to 0
      accumulatedRef.current += scrollSpeedRef.current * delta
      const px = Math.floor(accumulatedRef.current)

      const targetEl = useContainerScroll ? scrollContainerRef?.current : null

      if (px >= 1) {
        if (targetEl) {
          targetEl.scrollBy(0, px)
        } else {
          window.scrollBy(0, px)
        }
        accumulatedRef.current -= px
      }

      const atBottom = targetEl
        ? targetEl.scrollTop + targetEl.clientHeight >= targetEl.scrollHeight - 2
        : window.scrollY + window.innerHeight >= document.body.scrollHeight - 2

      if (!atBottom) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  useEffect(() => {
    setIsEnabled(showAutoscroll)
  }, [showAutoscroll])

  useEffect(() => {
    if (isEnabled) {
      startScroll()
    } else {
      stopScroll()
    }
    return stopScroll
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled])

  useEffect(() => {
    const handleManualScroll = () => {
      if (!isEnabledRef.current) return
      stopScroll()
      clearTimeout(manualTimerRef.current)
      manualTimerRef.current = setTimeout(() => {
        if (isEnabledRef.current) startScroll()
      }, 600)
    }

    const events: Array<'wheel' | 'touchstart'> = ['wheel', 'touchstart']
    const targetEl = useContainerScroll ? scrollContainerRef?.current : null

    if (targetEl) {
      events.forEach((evt) =>
        targetEl.addEventListener(evt, handleManualScroll, { passive: true }),
      )
      return () => {
        events.forEach((evt) =>
          targetEl.removeEventListener(evt, handleManualScroll),
        )
      }
    }

    events.forEach((evt) =>
      window.addEventListener(evt, handleManualScroll, { passive: true }),
    )
    return () => {
      events.forEach((evt) =>
        window.removeEventListener(evt, handleManualScroll),
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useContainerScroll, scrollContainerRef])

  const handlePlayButton = () => {
    setIsEnabled((prev) => !prev)
  }

  const updateSpeed = (updater: (current: number) => number) => {
    if (setScrollSpeed) {
      setScrollSpeed((current) => updater(current))
      return
    }
    setInternalScrollSpeed((current) => updater(current))
  }

  return (
    <>
      {showAutoscroll && !hidePanel && (
        <Flex
          position={'fixed'}
          width={widthToolsBar}
          left={'50%'}
          transform={'translate(-50%, 0)'}
          height={'60px'}
          bg={'whiteAlpha.50'}
          border={'1px'}
          borderColor={borderColor}
          backdropFilter={'blur(6px)'}
          shadow={'lg'}
          rounded={'full'}
          bottom={bottomCSS}
          justifyContent={'space-between'}
          alignItems={'center'}
          px={3}
          display={isLoading ? 'none' : 'flex'}
        >
          <Text px={1} fontSize="xs">
            Autoscroll
          </Text>
          <Button
            variant="outline"
            _hover={{ bg: 'blue.400', color: 'white' }}
            _active={{ bg: 'fadebp', color: 'white' }}
            isActive={isEnabled}
            onTouchStart={handlePlayButton}
            onMouseDown={!isTouch ? handlePlayButton : undefined}
            size={'sm'}
            boxShadow="md"
            fontWeight={'normal'}
            px="3"
            py="4"
            leftIcon={<Icon as={FaPlayCircle} />}
          >
            {isEnabled ? 'Stop' : 'Start'}
          </Button>
          <Text px={1} fontSize="sm">
            {effectiveScrollSpeed} px/s
          </Text>
          <Flex>
            <IconButton
              variant="outline"
              _hover={{ bg: 'blue.400', color: 'white' }}
              size={'sm'}
              boxShadow="md"
              px="3"
              py="4"
              mr={1}
              onClick={() =>
                updateSpeed((s) => Math.max(s - STEP_DOWN, MIN_SPEED))
              }
              aria-label="Slower"
              icon={<MinusIcon />}
            />
            <IconButton
              variant="outline"
              _hover={{ bg: 'blue.400', color: 'white' }}
              size={'sm'}
              boxShadow="md"
              px="3"
              py="4"
              onClick={() =>
                updateSpeed((s) => Math.min(s + STEP_UP, MAX_SPEED))
              }
              aria-label="Faster"
              icon={<AddIcon />}
            />
          </Flex>
        </Flex>
      )}
    </>
  )
}
