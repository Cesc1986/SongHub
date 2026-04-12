import type { AppProps } from 'next/app'
import { GoogleAnalytics } from 'nextjs-google-analytics'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { useState } from 'react'
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
