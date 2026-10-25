import {
  Button,
  Icon,
  Input,
  FormControl,
  FormLabel,
  Select,
  Stack,
  Textarea,
  useDisclosure,
  useToast,
  MenuItem,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'
import { FiFileText, FiUpload, FiLink } from 'react-icons/fi'
import { useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useQueryClient } from 'react-query'
import useAppStateContext from '../hooks/useAppStateContext'
import { TAB_TYPES } from '../constants'

export default function TextTabImporter(): JSX.Element {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { setSelectedTab, setImportedTab } = useAppStateContext()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [artist, setArtist] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState('Tab')
  const [tabText, setTabText] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)

  const resetState = () => {
    setArtist('')
    setName('')
    setType('Tab')
    setTabText('')
    setSourceUrl('')
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setTabText((event.target?.result as string) || '')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleFetchUrl = async () => {
    if (!sourceUrl.trim()) return
    setFetching(true)
    try {
      const res = await fetch('/api/fetch-tab-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Abrufen')

      setTabText(data.text || '')
      if (!name.trim() && data.title) setName(data.title)

      toast({
        description: 'Inhalt abgerufen - bitte prüfen und ggf. anpassen',
        status: 'info',
        position: 'top-right',
        duration: 3000,
      })
    } catch (err: any) {
      toast({
        description: err.message || 'URL konnte nicht abgerufen werden',
        status: 'error',
        position: 'top-right',
        duration: 3000,
      })
    } finally {
      setFetching(false)
    }
  }

  const handleSave = async () => {
    if (!artist.trim() || !name.trim() || !tabText.trim()) {
      toast({
        description: 'Bitte Interpret, Titel und Tab-Inhalt ausfüllen',
        status: 'warning',
        position: 'top-right',
        duration: 2500,
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/save-text-tab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist: artist.trim(),
          name: name.trim(),
          type,
          tabText,
          sourceUrl: sourceUrl.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern')

      const { tab } = data

      setImportedTab(null)
      queryClient.setQueryData(['getTab', tab.url], tab)
      queryClient.setQueryData(['getBackgroundTab', tab.url], tab)
      setImportedTab(tab)
      setSelectedTab((prev) => ({ ...prev, url: tab.url, slug: tab.slug }))

      handleClose()
      toast({
        description: `"${tab.name}" von ${tab.artist} gespeichert!`,
        status: 'success',
        position: 'top-right',
        duration: 2500,
      })
      router.push(`/tab/${tab.slug}`)
    } catch (err: any) {
      toast({
        description: err.message || 'Fehler beim Speichern',
        status: 'error',
        position: 'top-right',
        duration: 3000,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <MenuItem onClick={onOpen} key="text-tab-import">
        <Icon position="relative" top="-0.05rem" mr="5px" as={FiFileText} />
        Tab-Text importieren
      </MenuItem>

      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Tab-Text importieren</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Von einer URL abrufen (optional)</FormLabel>
                <InputGroup>
                  <Input
                    placeholder="https://..."
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                  <InputRightElement w="auto" pr={1}>
                    <Button
                      size="sm"
                      leftIcon={<Icon as={FiLink} />}
                      onClick={handleFetchUrl}
                      isLoading={fetching}
                      isDisabled={!sourceUrl.trim()}
                    >
                      Abrufen
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Interpret</FormLabel>
                <Input
                  placeholder="z.B. Nick Drake"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Titel</FormLabel>
                <Input
                  placeholder="z.B. River Man"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Typ</FormLabel>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  {Object.values(TAB_TYPES)
                    .filter((t) => t !== 'All')
                    .map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Tab-Inhalt</FormLabel>
                <Textarea
                  placeholder="Tab-Text hier einfügen..."
                  value={tabText}
                  onChange={(e) => setTabText(e.target.value)}
                  fontFamily="monospace"
                  fontSize="sm"
                  rows={12}
                />
              </FormControl>

              <Button
                variant="outline"
                leftIcon={<Icon as={FiUpload} />}
                onClick={() => fileInputRef.current?.click()}
                alignSelf="flex-start"
              >
                .txt-Datei auswählen
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,text/plain"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </Stack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={handleClose}>Abbrechen</Button>
            <Button
              colorScheme="blue"
              onClick={handleSave}
              isLoading={saving}
              isDisabled={!artist.trim() || !name.trim() || !tabText.trim()}
            >
              Speichern
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
