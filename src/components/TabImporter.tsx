import {
  Button,
  Icon,
  MenuItem,
  useDisclosure,
  useToast,
  Text,
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
import { FiUpload } from 'react-icons/fi'
import { useRef } from 'react'
import { useRouter } from 'next/router'
import { useQueryClient } from 'react-query'
import useAppStateContext from '../hooks/useAppStateContext'
import { Tab } from '../types/tabs'

export default function TabImporter(): JSX.Element {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { setSelectedTab, setImportedTab } = useAppStateContext()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        const tab: Tab = parsed.tab

        if (!tab || !tab.url || !tab.htmlTab) {
          throw new Error('Ungültige Tab-Datei')
        }

        // Upload to server so it shows in the saved list
        await fetch('/api/saved-tabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tab }),
        })

        // Clear old imported tab first to force re-render
        setImportedTab(null)

        // Overwrite React Query cache so stale data never shows
        queryClient.setQueryData(['getTab', tab.url], tab)
        queryClient.setQueryData(['getBackgroundTab', tab.url], tab)

        // Store in context — useTabs returns this, no network call
        setImportedTab(tab)
        setSelectedTab((prev) => ({ ...prev, url: tab.url, slug: tab.slug }))

        onClose()
        toast({
          description: `"${tab.name}" von ${tab.artist} geladen (offline)!`,
          status: 'success',
          position: 'top-right',
          duration: 2500,
        })
        router.push(`/tab/${tab.slug}`)
      } catch {
        toast({
          description: 'Datei konnte nicht geladen werden. Gültige .ultimatetab.json Datei auswählen.',
          status: 'error',
          position: 'top-right',
          duration: 3000,
        })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <>
      <MenuItem onClick={onOpen} key="tab-import">
        <Icon position="relative" top="-0.05rem" mr="5px" as={FiUpload} />
        JSON importieren
      </MenuItem>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Tab importieren (JSON)</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Wähle eine <strong>.ultimatetab.json</strong> Datei aus.
              Der Tab wird auf dem Server gespeichert und auf der Homepage angezeigt.
            </Text>
            <Button
              colorScheme="blue"
              leftIcon={<Icon as={FiUpload} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Datei auswählen
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.ultimatetab.json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>Schließen</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
