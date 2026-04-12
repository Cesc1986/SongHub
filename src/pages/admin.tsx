import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
} from '@chakra-ui/react'
import Head from 'next/head'
import { useEffect, useState } from 'react'

interface AccessLogItem {
  timestamp: string
  username: string
  role: 'user' | 'admin'
  ip: string
  success: boolean
  event: string
}

interface ChangeLogItem {
  timestamp: string
  username: string
  role: 'user' | 'admin'
  ip: string
  action: string
  details?: Record<string, any>
}

interface TrashItem {
  id: string
  type: string
  deletedAt: string
  deletedBy: string
  deletedByRole: 'user' | 'admin'
  originalPath?: string
  payload?: any
}

export default function AdminPage(): JSX.Element {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [accessLogs, setAccessLogs] = useState<AccessLogItem[]>([])
  const [changeLogs, setChangeLogs] = useState<ChangeLogItem[]>([])
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [a, c, t] = await Promise.all([
        fetch('/api/admin/access-log').then((r) => r.json()),
        fetch('/api/admin/change-log').then((r) => r.json()),
        fetch('/api/admin/trash').then((r) => r.json()),
      ])

      setAccessLogs(a.logs || [])
      setChangeLogs(c.logs || [])
      setTrashItems(t.items || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const purgeTrashItem = async (id: string) => {
    const res = await fetch(`/api/admin/trash?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      toast({
        description: 'Element endgültig gelöscht',
        status: 'success',
        duration: 1500,
        position: 'top-right',
      })
      loadAll()
    }
  }

  const purgeAll = async () => {
    const res = await fetch('/api/admin/trash', { method: 'DELETE' })
    if (res.ok) {
      toast({
        description: 'Papierkorb vollständig geleert',
        status: 'success',
        duration: 1800,
        position: 'top-right',
      })
      loadAll()
    }
  }

  return (
    <>
      <Head>
        <title>Admin - Song Hub</title>
      </Head>
      <Flex direction="column" px={'5px'} py={4}>
        <Flex justify="space-between" align="center" mb={3}>
          <Heading size="md">Admin Center</Heading>
          <Button size="sm" onClick={loadAll} variant="outline">
            Neu laden
          </Button>
        </Flex>

        {loading ? (
          <Flex justify="center" mt={12}>
            <Spinner />
          </Flex>
        ) : (
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>{`Access Log (${accessLogs.length})`}</Tab>
              <Tab>{`Change Log (${changeLogs.length})`}</Tab>
              <Tab>{`Papierkorb (${trashItems.length})`}</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <Stack spacing={2}>
                  {accessLogs.map((item, idx) => (
                    <Box key={`${item.timestamp}-${idx}`} borderWidth="1px" borderRadius="md" p={3}>
                      <Flex justify="space-between" align="center" gap={2}>
                        <Text fontSize="sm">
                          {item.timestamp} · {item.username} · {item.ip}
                        </Text>
                        <Badge colorScheme={item.success ? 'green' : 'red'}>{item.event}</Badge>
                      </Flex>
                    </Box>
                  ))}
                  {accessLogs.length === 0 && <Text color="gray.500">Noch keine Einträge.</Text>}
                </Stack>
              </TabPanel>

              <TabPanel px={0}>
                <Stack spacing={2}>
                  {changeLogs.map((item, idx) => (
                    <Box key={`${item.timestamp}-${idx}`} borderWidth="1px" borderRadius="md" p={3}>
                      <Flex justify="space-between" align="center" gap={2}>
                        <Text fontSize="sm">
                          {item.timestamp} · {item.username} · {item.action}
                        </Text>
                        <Badge colorScheme={item.role === 'admin' ? 'purple' : 'blue'}>{item.role}</Badge>
                      </Flex>
                      {item.details && (
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {JSON.stringify(item.details)}
                        </Text>
                      )}
                    </Box>
                  ))}
                  {changeLogs.length === 0 && <Text color="gray.500">Noch keine Einträge.</Text>}
                </Stack>
              </TabPanel>

              <TabPanel px={0}>
                <Flex justify="flex-end" mb={3}>
                  <Button size="sm" colorScheme="red" variant="outline" onClick={purgeAll}>
                    Alles endgültig löschen
                  </Button>
                </Flex>
                <Stack spacing={2}>
                  {trashItems.map((item) => (
                    <Box key={item.id} borderWidth="1px" borderRadius="md" p={3}>
                      <Flex justify="space-between" align="center" gap={2}>
                        <Box>
                          <Text fontSize="sm">
                            {item.deletedAt} · {item.type}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {item.originalPath || JSON.stringify(item.payload || {}).slice(0, 180)}
                          </Text>
                        </Box>
                        <Button
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => purgeTrashItem(item.id)}
                        >
                          Endgültig löschen
                        </Button>
                      </Flex>
                    </Box>
                  ))}
                  {trashItems.length === 0 && <Text color="gray.500">Papierkorb ist leer.</Text>}
                </Stack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </Flex>
    </>
  )
}
