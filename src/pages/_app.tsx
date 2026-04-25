import type { AppProps } from 'next/app'
import { GoogleAnalytics } from 'nextjs-google-analytics'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { useEffect, useRef, useState } from 'react'
import Layout from '../components/Layout'
import { AppStateProvider } from '../contexts/AppContext'
import { extendedTheme } from '../theme'
import '@fontsource/poppins/400.css'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  const router = useRouter()
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      }),
  )

  const isLoginPage = router.pathname === '/login'
  const lastTrackedPathRef = useRef<string | null>(null)

  useEffect(() => {
    const trackPageView = (url: string) => {
      if (lastTrackedPathRef.current === url) return
      lastTrackedPathRef.current = url

      fetch('/api/access-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: url,
          method: 'GET',
          query: typeof window !== 'undefined' ? window.location.search : '',
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        }),
      }).catch(() => {
        // Access-Logging ist best-effort und darf UI nicht stören
      })
    }

    // Initiale Seite einmalig loggen
    trackPageView(router.asPath)

    // Danach nur echte Navigationen loggen
    const handleRouteChangeComplete = (url: string) => trackPageView(url)
    router.events.on('routeChangeComplete', handleRouteChangeComplete)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete)
    }
  }, [router.asPath, router.events])

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={extendedTheme}>
        <AppStateProvider>
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
            />
          </Head>
          <GoogleAnalytics trackPageViews strategy="lazyOnload" />

          {isLoginPage ? (
            <Component {...pageProps} />
          ) : (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          )}
        </AppStateProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </ChakraProvider>
    </QueryClientProvider>
  )
}
