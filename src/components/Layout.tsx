import { Container, Flex } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { ReactNode, useRef } from 'react'
import Backdrop from './Backdrop'
import Footer from './Footer'
import Nav from './Nav'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps): JSX.Element {
  const { pathname } = useRouter()
  const refBackdrop = useRef<HTMLDivElement>(null)
  const flexDirectionContent = pathname === '/' ? 'row' : 'column'

  // Login soll komplett ohne Header/Search/Menu gerendert werden
  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <>
      <Backdrop refBackdrop={refBackdrop} />
      <Container
        maxW={{ base: '100%', md: '1024px', xl: '1280px' }}
        px={{ base: '5px', md: '30px', xl: '50px' }}
      >
        <Flex minH={'100vh'} direction={'column'}>
          <Nav refBackdrop={refBackdrop} />
          <Flex grow={1} direction={flexDirectionContent}>
            {children}
          </Flex>
          <Footer></Footer>
        </Flex>
      </Container>
    </>
  )
}
