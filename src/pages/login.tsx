import { Box, Button, Flex, FormControl, FormLabel, Heading, Input, Text, useToast } from '@chakra-ui/react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'

export default function LoginPage(): JSX.Element {
  const router = useRouter()
  const toast = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const nextPath = typeof router.query.next === 'string' ? router.query.next : '/'

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        toast({
          title: 'Login fehlgeschlagen',
          description: 'Bitte Benutzername/Passwort prüfen.',
          status: 'error',
          duration: 2500,
          position: 'top-right',
        })
        return
      }

      await router.replace(nextPath)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>SongHub Login</title>
      </Head>
      <Flex minH="80vh" align="center" justify="center" px={4}>
        <Box as="form" onSubmit={onSubmit} borderWidth="1px" borderRadius="lg" p={6} w="100%" maxW="420px">
          <Heading size="md" mb={2}>SongHub Login</Heading>
          <Text mb={6} color="gray.500">Bitte anmelden, um SongHub zu nutzen.</Text>

          <FormControl mb={4} isRequired>
            <FormLabel>Benutzername</FormLabel>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </FormControl>

          <FormControl mb={6} isRequired>
            <FormLabel>Passwort</FormLabel>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </FormControl>

          <Button type="submit" colorScheme="blue" w="full" isLoading={loading}>
            Einloggen
          </Button>
        </Box>
      </Flex>
    </>
  )
}
