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
  useDisclosure,
} from '@chakra-ui/react'
import { HamburgerIcon, MoonIcon, SunIcon } from '@chakra-ui/icons'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { MutableRefObject, useEffect, useState } from 'react'
import AutocompleteInput from './AutocompleteInput'
import TabImporter from './TabImporter'
import ImageTabUploader from './ImageTabUploader'

export default function Nav({
  refBackdrop,
}: {
  refBackdrop: MutableRefObject<HTMLDivElement>
}): JSX.Element {
  const router = useRouter()
  const { colorMode, toggleColorMode } = useColorMode()
  const [isAdmin, setIsAdmin] = useState(false)
  const titleHeader = useBreakpointValue({ base: 'SH', md: 'Song Hub' })
  const { isOpen: isUploaderOpen, onOpen: onUploaderOpen, onClose: onUploaderClose } = useDisclosure()
  const { isOpen: isCameraOpen, onOpen: onCameraOpen, onClose: onCameraClose } = useDisclosure()

  useEffect(() => {
    let active = true
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        setIsAdmin(Boolean(data?.authenticated && data?.role === 'admin'))
      })
      .catch(() => {
        if (!active) return
        setIsAdmin(false)
      })
    return () => {
      active = false
    }
  }, [router.pathname])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    await router.replace('/login')
  }

  return (
    <>
      <Box px={'5px'}>
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
                  <ImageTabUploader isOpen={isUploaderOpen} onClose={onUploaderClose} asMenuItem onMenuItemClick={onUploaderOpen} />
                  <ImageTabUploader isOpen={isCameraOpen} onClose={onCameraClose} cameraMode asCameraMenuItem onCameraMenuItemClick={onCameraOpen} />
                  {isAdmin && (
                    <Button
                      as={NextLink}
                      href="/admin"
                      size="sm"
                      variant="ghost"
                      m={2}
                    >
                      Admin
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" m={2} onClick={handleLogout}>Logout</Button>
                </MenuList>
              </Menu>
            </Stack>
          </Flex>
        </Flex>
      </Box>
    </>
  )
}
