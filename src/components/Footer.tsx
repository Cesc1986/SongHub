import { Text, Stack, Divider, Link, IconButton, Flex } from '@chakra-ui/react'
import { FaGithub } from 'react-icons/fa'

export default function Nav({}: {}): JSX.Element {
  const version: string = process.env.NEXT_PUBLIC_UT_VERSION || '0.9'
  return (
    <footer>
      <Divider mt={4} />

      <Flex
        direction={'row'}
        justifyContent="space-between"
        alignItems={'center'}
        p={2}
        flexWrap="wrap"
        gap={1}
      >
        <Text fontSize="sm">
          Built by{' '}
          <Link
            href="https://github.com/Cesc1986/"
            textDecoration="underline"
            _hover={{ textDecoration: 'underline' }}
            isExternal
          >
            Francis
          </Link>
          {' · '}Based on{' '}
          <Link
            href="https://github.com/BenoitBellegarde/UltimateTab"
            textDecoration="underline"
            _hover={{ textDecoration: 'underline' }}
            isExternal
          >
            Benoit Bellegarde
          </Link>
        </Text>

        <Flex direction={'row'} alignItems={'center'}>
          <Text fontSize="sm" mr={2}>
            ver {version}
          </Text>
          <IconButton
            size={'sm'}
            key={'github-icon'}
            as={Link}
            isExternal
            href={'https://github.com/Cesc1986/UltimateTab/'}
            aria-label={'Github page'}
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
