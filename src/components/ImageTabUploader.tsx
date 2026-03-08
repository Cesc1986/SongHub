import {
  Button,
  Icon,
  Input,
  FormControl,
  FormLabel,
  Image,
  Box,
  Text,
  Stack,
  Select,
  useToast,
  useColorModeValue,
  MenuItem,
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
import { FiUpload, FiImage, FiCamera } from 'react-icons/fi'
import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/router'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
  asMenuItem?: boolean
  onMenuItemClick?: () => void
  // camera mode: opens camera directly instead of file picker
  cameraMode?: boolean
  asCameraMenuItem?: boolean
  onCameraMenuItemClick?: () => void
}

export default function ImageTabUploader({
  isOpen,
  onClose,
  onSaved,
  asMenuItem,
  onMenuItemClick,
  cameraMode,
  asCameraMenuItem,
  onCameraMenuItemClick,
}: Props): JSX.Element {
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>('image/jpeg')
  const [preview, setPreview] = useState<string | null>(null)
  const [artist, setArtist] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState('Chords')
  const [isDragging, setIsDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const router = useRouter()
  const dropBg = useColorModeValue('gray.100', 'gray.700')
  const dropBorderColor = useColorModeValue('gray.300', 'gray.500')
  const dragBg = useColorModeValue('blue.50', 'blue.900')

  const resetState = () => {
    setImageBase64(null)
    setPreview(null)
    setArtist('')
    setName('')
    setType('Chords')
    setIsDragging(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ description: 'Nur Bilddateien sind erlaubt (JPG, PNG, WebP)', status: 'error', position: 'top-right', duration: 3000 })
      return
    }
    setMimeType(file.type)
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      const base64 = result.split(',')[1]
      setImageBase64(base64)
      setPreview(result)
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleSave = async () => {
    if (!imageBase64 || !artist.trim() || !name.trim()) {
      toast({ description: 'Bitte Bild, Interpret und Titel ausfüllen', status: 'warning', position: 'top-right', duration: 2500 })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/save-image-tab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist: artist.trim(), name: name.trim(), type, imageBase64, mimeType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern')

      toast({
        description: `"${name}" von ${artist} gespeichert!`,
        status: 'success',
        position: 'top-right',
        duration: 2500,
      })
      handleClose()
      onSaved?.()
    } catch (err: any) {
      toast({ description: err.message || 'Fehler beim Speichern', status: 'error', position: 'top-right', duration: 3000 })
    } finally {
      setSaving(false)
    }
  }

  const modalTitle = cameraMode ? '📷 Foto aufnehmen' : '🖼️ Tab-Foto hochladen'

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{modalTitle}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {/* Drop zone / preview */}
              {cameraMode ? (
                // Camera mode: show preview or camera button
                <Box textAlign="center">
                  {preview ? (
                    <Image src={preview} alt="Vorschau" maxH="220px" mx="auto" borderRadius="md" />
                  ) : (
                    <Button
                      leftIcon={<Icon as={FiCamera} />}
                      colorScheme="blue"
                      size="lg"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      Kamera öffnen
                    </Button>
                  )}
                  {preview && (
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="blue"
                      mt={2}
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      Neues Foto aufnehmen
                    </Button>
                  )}
                </Box>
              ) : (
                // Upload mode: drag & drop zone
                <Box
                  border="2px dashed"
                  borderColor={isDragging ? 'blue.400' : dropBorderColor}
                  borderRadius="md"
                  bg={isDragging ? dragBg : dropBg}
                  p={6}
                  textAlign="center"
                  cursor="pointer"
                  transition="all 0.2s"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {preview ? (
                    <Image src={preview} alt="Vorschau" maxH="220px" mx="auto" borderRadius="md" />
                  ) : (
                    <>
                      <Icon as={FiImage} boxSize={10} color="gray.400" mb={2} />
                      <Text color="gray.500" fontSize="sm">
                        Foto hierher ziehen oder klicken zum Auswählen
                      </Text>
                      <Text color="gray.400" fontSize="xs" mt={1}>JPG, PNG, WebP</Text>
                    </>
                  )}
                </Box>
              )}

              {preview && (
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  alignSelf="flex-start"
                  onClick={() => { setImageBase64(null); setPreview(null) }}
                >
                  Bild entfernen
                </Button>
              )}

              {/* Metadata fields */}
              <FormControl isRequired>
                <FormLabel fontSize="sm">Interpret</FormLabel>
                <Input
                  placeholder="z.B. The Beatles"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Titel</FormLabel>
                <Input
                  placeholder="z.B. Let It Be"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Typ</FormLabel>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="Chords">Chords</option>
                  <option value="Tab">Tab</option>
                  <option value="Bass">Bass</option>
                  <option value="Ukulele">Ukulele</option>
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={handleClose}>Abbrechen</Button>
            <Button
              colorScheme="blue"
              leftIcon={<Icon as={FiUpload} />}
              onClick={handleSave}
              isLoading={saving}
              isDisabled={!imageBase64 || !artist.trim() || !name.trim()}
            >
              Speichern
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {asMenuItem && (
        <MenuItem onClick={onMenuItemClick}>
          <Icon position="relative" top="-0.05rem" mr="5px" as={FiImage} />
          Foto hochladen
        </MenuItem>
      )}
      {asCameraMenuItem && (
        <MenuItem onClick={onCameraMenuItemClick}>
          <Icon position="relative" top="-0.05rem" mr="5px" as={FiCamera} />
          Foto aufnehmen
        </MenuItem>
      )}
    </>
  )
}
