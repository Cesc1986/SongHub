import { Button, Flex, Icon, useBreakpointValue } from '@chakra-ui/react'
import { Dispatch, SetStateAction } from 'react'
import { FaCircleArrowDown } from 'react-icons/fa6'
import { MdFullscreen, MdFullscreenExit } from 'react-icons/md'

interface TabActionButtonsProps {
  w: any
  showBackingTrack: boolean
  setShowBackingTrack: Dispatch<SetStateAction<boolean>>
  showAutoscroll: boolean
  setShowAutoscroll: Dispatch<SetStateAction<boolean>>
  isFullscreenMode: boolean
  toggleFullscreen: () => void
}

export default function TabActionButtons({
  w,
  showAutoscroll,
  setShowAutoscroll,
  isFullscreenMode,
  toggleFullscreen,
}: TabActionButtonsProps): JSX.Element {
  return (
    <Flex pb={1} w={w} pt={0} flexWrap={'wrap'} gap={2}>
      <Button
        variant="outline"
        _hover={{
          bg: 'blue.400',
          color: 'white',
          opacity: showAutoscroll ? 0.8 : 1,
        }}
        _active={{
          bg: 'fadebp',
          color: 'white',
        }}
        isActive={showAutoscroll}
        onClick={() => {
          setShowAutoscroll((prevState) => !prevState)
        }}
        size={'sm'}
        boxShadow="md"
        fontWeight={'normal'}
        px="3"
        py="4"
        mt={useBreakpointValue({ base: 3, md: 2 })}
        leftIcon={<Icon as={FaCircleArrowDown} />}
      >
        Autoscroll
      </Button>

      <Button
        variant="outline"
        _hover={{ bg: 'blue.400', color: 'white' }}
        _active={{ bg: 'fadebp', color: 'white' }}
        isActive={isFullscreenMode}
        onClick={toggleFullscreen}
        size={'sm'}
        boxShadow="md"
        fontWeight={'normal'}
        px="3"
        py="4"
        mt={useBreakpointValue({ base: 3, md: 2 })}
        leftIcon={<Icon as={isFullscreenMode ? MdFullscreenExit : MdFullscreen} />}
      >
        {isFullscreenMode ? 'Exit Fullscreen' : 'Fullscreen'}
      </Button>
    </Flex>
  )
}
