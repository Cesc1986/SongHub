import { Text, Divider, Link, IconButton, Flex } from '@chakra-ui/react'
import { FaGithub } from 'react-icons/fa'

export default function Nav({}: {}): JSX.Element {
  const version: string =
    process.env.NEXT_PUBLIC_APP_VERSION ||
    process.env.NEXT_PUBLIC_UT_VERSION ||
    'dev'
  return (
    <footer>
      <Divider mt={4} />
      <Flex
        direction={'row'}
        justifyContent="space-between"
        alignItems={'center'}
        px={'5px'}
        py={2}
        flexWrap={'nowrap'}
        gap={2}
        minW={0}
      >
        <Text fontSize="xs" whiteSpace={'nowrap'} overflow={'hidden'} textOverflow={'ellipsis'} flex={1} minW={0}>
          {'By '}
          <Link href="https://github.com/Cesc1986/UltimateTab" isExternal textDecoration="underline">
            Francis
          </Link>
          {' · Based on '}
          <Link href="https://github.com/BenoitBellegarde/" isExternal textDecoration="underline">
            Ultimate Tab
          </Link>
        </Text>

        <Flex direction={'row'} alignItems={'center'} gap={2} flexShrink={0}>
          <Text fontSize="xs" whiteSpace={'nowrap'}>
            ver {version}
          </Text>
          <IconButton
            size={'xs'}
            as={Link}
            isExternal
            href={'https://github.com/Cesc1986/UltimateTab/'}
            aria-label={'Github'}
            bg={'blackAlpha.800'}
            color={'white'}
            icon={<FaGithub />}
            rounded="md"
          />
        </Flex>
      </Flex>
    </footer>
  )
}
