import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Spinner,
  Stack,
  Switch,
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
  const [musicianMarkingEnabled, setMusicianMarkingEnabled] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const formatBerlinTimestamp = (raw: string) => {
    if (!raw) return raw
    const parsed = new Date(raw)
    if (Number.isNaN(parsed.getTime())) return raw
    return new Intl.DateTimeFormat('de-DE', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(parsed)
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      const [a, c, t, s] = await Promise.all([
        fetch('/api/admin/access-log').then((r) => r.json()),
        fetch('/api/admin/change-log').then((r) => r.json()),
        fetch('/api/admin/trash').then((r) => r.json()),
        fetch('/api/admin/settings').then((r) => r.json()),
      ])

      setAccessLogs(a.logs || [])
      setChangeLogs(c.logs || [])
      setTrashItems(t.items || [])
      setMusicianMarkingEnabled(Boolean(s?.musicianMarkingEnabled))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const restoreTrashItem = async (id: string) => {
    const res = await fetch('/api/admin/trash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (res.ok) {
      toast({
        description: 'Element wiederhergestellt',
        status: 'success',
        duration: 1500,
        position: 'top-right',
      })
      loadAll()
      return
    }

    const err = await res.json().catch(() => ({}))
    toast({
      description: err?.message || 'Wiederherstellung fehlgeschlagen',
      status: 'error',
      duration: 2200,
      position: 'top-right',
    })
  }

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

  const updateMusicianMarking = async (nextValue: boolean) => {
    const prev = musicianMarkingEnabled
    setMusicianMarkingEnabled(nextValue)
    setSavingSettings(true)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicianMarkingEnabled: nextValue }),
      })

      if (!res.ok) {
        setMusicianMarkingEnabled(prev)
        toast({
          description: 'Einstellung konnte nicht gespeichert werden',
          status: 'error',
          duration: 1800,
          position: 'top-right',
        })
        return
      }

      toast({
        description: `A/F Marker ${nextValue ? 'aktiviert' : 'deaktiviert'}`,
        status: 'success',
        duration: 1400,
        position: 'top-right',
      })
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <>
      <Head>
        <title>Admin - Song Hub</title>
      </Head>
      <Flex direction="column" px={0} py={4}>
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
              <Tab>Einstellungen</Tab>
              <Tab>{`Access Log (${accessLogs.length})`}</Tab>
              <Tab>{`Change Log (${changeLogs.length})`}</Tab>
              <Tab>{`Papierkorb (${trashItems.length})`}</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <Box borderWidth="1px" borderRadius="md" p={4} maxW="560px">
                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <FormLabel htmlFor="musician-marking-toggle" mb="0">
                      A/F Marker für Musiker anzeigen
                    </FormLabel>
                    <Switch
                      id="musician-marking-toggle"
                      colorScheme="blue"
                      isChecked={musicianMarkingEnabled}
                      onChange={(e) => updateMusicianMarking(e.target.checked)}
                      isDisabled={savingSettings}
                    />
                  </FormControl>
                  <Text mt={2} fontSize="xs" color="gray.500">
                    Deaktiviert blendet die A/F Buttons auf Songseiten und in der Songliste aus.
                  </Text>
                </Box>
              </TabPanel>

              <TabPanel px={0}>
                <Stack spacing={2}>
                  {accessLogs.map((item, idx) => (
                    <Box key={`${item.timestamp}-${idx}`} borderWidth="1px" borderRadius="md" p={3}>
                      <Flex justify="space-between" align="center" gap={2}>
                        <Text fontSize="sm">
                          {formatBerlinTimestamp(item.timestamp)} · {item.username} · {item.ip}
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
                          {formatBerlinTimestamp(item.timestamp)} · {item.username} · {item.action}
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
                            {formatBerlinTimestamp(item.deletedAt)} · {item.type}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {item.originalPath || JSON.stringify(item.payload || {}).slice(0, 180)}
                          </Text>
                        </Box>
                        <Flex gap={2}>
                          <Button
                            size="xs"
                            colorScheme="green"
                            variant="ghost"
                            onClick={() => restoreTrashItem(item.id)}
                          >
                            Wiederherstellen
                          </Button>
                          <Button
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => purgeTrashItem(item.id)}
                          >
                            Endgültig löschen
                          </Button>
                        </Flex>
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
