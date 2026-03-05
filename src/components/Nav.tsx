import {
  Box,
  Flex,
  Button,
  Stack,
  useColorMode,
  Text,
  Link,
  useBreakpointValue,
  Menu,
  MenuButton,
  MenuList,
  IconButton,
} from '@chakra-ui/react'
import { HamburgerIcon, MoonIcon, SunIcon } from '@chakra-ui/icons'
import NextLink from 'next/link'
import { MutableRefObject } from 'react'
import AutocompleteInput from './AutocompleteInput'
import TabImporter from './TabImporter'

export default function Nav({
  refBackdrop,
}: {
  refBackdrop: MutableRefObject<HTMLDivElement>
}): JSX.Element {
  const { colorMode, toggleColorMode } = useColorMode()
  const titleHeader = useBreakpointValue({ base: 'Ut', md: 'Ultimate tab' })
  return (
    <>
      <Box px={4}>
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <Flex alignItems={'center'}>
            <Link as={NextLink} href="/" style={{ textDecoration: 'none' }}>
              <Text
                bg="fadebp"
                bgClip="text"
                fontSize={useBreakpointValue({ base: 'xl', md: 'xl' })}
                mr={4}
                fontWeight="extrabold"
                whiteSpace={'nowrap'}
              >
                {titleHeader}
              </Text>
            </Link>
          </Flex>
          <Flex alignItems={'center'} width={'100%'}>
            <AutocompleteInput refBackdrop={refBackdrop} />
          </Flex>
          <Flex alignItems={'center'}>
            <Stack direction={'row'} spacing={3}>
              <Button
                size={useBreakpointValue({ base: 'sm', md: 'md' })}
                onClick={toggleColorMode}
              >
                {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              </Button>
              <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label="Menü"
                  icon={<HamburgerIcon />}
                  size={useBreakpointValue({ base: 'sm', md: 'md' })}
                  variant="outline"
                />
                <MenuList>
                  <TabImporter />
                </MenuList>
              </Menu>
            </Stack>
          </Flex>
        </Flex>
      </Box>
    </>
  )
}
