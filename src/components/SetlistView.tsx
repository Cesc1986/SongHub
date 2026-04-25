import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box,
  Flex,
  Text,
  IconButton,
  Badge,
  useToast,
  useColorModeValue,
  Select,
  Spinner,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react'
import { DeleteIcon, DragHandleIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, WarningIcon } from '@chakra-ui/icons'
import SetlistDatePicker from './SetlistDatePicker'

interface SetlistEntry {
  filename: string
  artist: string
  name: string
  type: string
  order: number
}

interface Props {
  onOpenTab: (filename: string) => void
}

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

export default function SetlistView({ onOpenTab }: Props): JSX.Element {
  const [allSetlists, setAllSetlists] = useState<{ [date: string]: SetlistEntry[] }>({})
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [entries, setEntries] = useState<SetlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [entriesLoading, setEntriesLoading] = useState(false)
  const toast = useToast()
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const dragBg = useColorModeValue('blue.50', 'blue.900')

  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const touchDragData = useRef<{ startIndex: number; startY: number } | null>(null)
  
  // Calendar picker
  const { isOpen: isCalendarOpen, onOpen: openCalendar, onClose: closeCalendar } = useDisclosure()
  
  // Delete dialog
  const { isOpen: isDeleteDialogOpen, onOpen: openDeleteDialog, onClose: closeDeleteDialog } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const fetchSetlists = useCallback(async (keepDate?: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/setlist')
      const data = await res.json()
      const setlists = data.setlists || {}
      setAllSetlists(setlists)
      
      const dates = Object.keys(setlists).sort()
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      
      // Try to restore from sessionStorage first
      let dateToSelect = keepDate
      if (!dateToSelect) {
        try {
          const saved = sessionStorage.getItem('setlistSelectedDate')
          if (saved && setlists[saved]) {
            dateToSelect = saved
          }
        } catch {}
      }
      
      // Fallback to upcoming or most recent
      if (!dateToSelect || !setlists[dateToSelect]) {
        dateToSelect = dates.find(d => d >= todayStr) || dates[dates.length - 1] || ''
      }
      
      setSelectedDate(dateToSelect)
      setEntries(dateToSelect ? (setlists[dateToSelect] || []) : [])
      
      // Persist selection
      if (dateToSelect) {
        try { sessionStorage.setItem('setlistSelectedDate', dateToSelect) } catch {}
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchSetlists() }, [fetchSetlists])

  // Listen for setlist updates from other components
  useEffect(() => {
    const handler = () => fetchSetlists()
    window.addEventListener('setlist-updated', handler)
    return () => window.removeEventListener('setlist-updated', handler)
  }, [fetchSetlists])

  // Fetch entries from server when date changes
  const fetchEntriesForDate = useCallback(async (date: string) => {
    if (!date) return
    setEntriesLoading(true)
    try {
      const res = await fetch(`/api/setlist?date=${encodeURIComponent(date)}`)
      const data = await res.json()
      setEntries(data.entries || [])
      // Also update local cache
      setAllSetlists(prev => ({ ...prev, [date]: data.entries || [] }))
    } catch {}
    setEntriesLoading(false)
  }, [])

  const handleDateChange = async (date: string) => {
    setSelectedDate(date)
    try { sessionStorage.setItem('setlistSelectedDate', date) } catch {}
    await fetchEntriesForDate(date)
  }

  const navigateDate = async (direction: -1 | 1) => {
    const dates = Object.keys(allSetlists).sort()
    const currentIndex = dates.indexOf(selectedDate)
    const newIndex = currentIndex + direction
    if (newIndex >= 0 && newIndex < dates.length) {
      const newDate = dates[newIndex]
      setSelectedDate(newDate)
      try { sessionStorage.setItem('setlistSelectedDate', newDate) } catch {}
      await fetchEntriesForDate(newDate)
    }
  }

  const handleDelete = async (filename: string) => {
    const currentDate = selectedDate
    await fetch(`/api/setlist?date=${currentDate}&filename=${encodeURIComponent(filename)}`, { method: 'DELETE' })
    toast({ description: 'Aus Setlist entfernt', status: 'info', position: 'top-right', duration: 1500 })
    
    // Check if this was the last entry
    const remainingEntries = entries.filter(e => e.filename !== filename)
    if (remainingEntries.length === 0) {
      // Date will be deleted, find the newest remaining date
      const remainingDates = Object.keys(allSetlists).filter(d => d !== currentDate).sort()
      const newestDate = remainingDates[remainingDates.length - 1] || ''
      if (newestDate) {
        try { sessionStorage.setItem('setlistSelectedDate', newestDate) } catch {}
      }
      await fetchSetlists(newestDate)
    } else {
      await fetchSetlists(currentDate)
    }
  }

  const saveOrder = async (newEntries: SetlistEntry[]) => {
    await fetch('/api/setlist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate, entries: newEntries }),
    })
  }

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return entries
    const newEntries = [...entries]
    const [movedItem] = newEntries.splice(fromIndex, 1)
    newEntries.splice(toIndex, 0, movedItem)
    return newEntries
  }

  // Desktop drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    const fromIndex = draggedIndex
    if (fromIndex !== null && fromIndex !== toIndex) {
      const newEntries = moveItem(fromIndex, toIndex)
      setEntries(newEntries)
      await saveOrder(newEntries)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    touchDragData.current = {
      startIndex: index,
      startY: e.touches[0].clientY,
    }
    setDraggedIndex(index)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragData.current) return
    
    const touchY = e.touches[0].clientY
    
    // Find which item we're currently over
    for (let i = 0; i < itemRefs.current.length; i++) {
      const ref = itemRefs.current[i]
      if (ref) {
        const rect = ref.getBoundingClientRect()
        if (touchY >= rect.top && touchY <= rect.bottom) {
          setDragOverIndex(i)
          break
        }
      }
    }
  }

  const handleTouchEnd = async () => {
    if (!touchDragData.current) return
    
    const fromIndex = touchDragData.current.startIndex
    const toIndex = dragOverIndex
    
    if (toIndex !== null && fromIndex !== toIndex) {
      const newEntries = moveItem(fromIndex, toIndex)
      setEntries(newEntries)
      await saveOrder(newEntries)
    }
    
    touchDragData.current = null
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleCalendarSelect = async (date: string) => {
    setSelectedDate(date)
    try { sessionStorage.setItem('setlistSelectedDate', date) } catch {}
    await fetchEntriesForDate(date)
    closeCalendar()
  }

  const handleDeleteEntireSetlist = async () => {
    if (!selectedDate) return
    closeDeleteDialog()
    
    try {
      const entriesToDelete = [...entries]
      for (const entry of entriesToDelete) {
        await fetch(`/api/setlist?date=${selectedDate}&filename=${encodeURIComponent(entry.filename)}`, { method: 'DELETE' })
      }
      
      toast({
        title: 'Setlist gelöscht',
        description: `Alle Songs vom ${formatDate(selectedDate)} wurden entfernt`,
        status: 'success',
        position: 'top',
        duration: 2000,
      })
      
      // Find the newest remaining date
      const remainingDates = Object.keys(allSetlists).filter(d => d !== selectedDate).sort()
      const newestDate = remainingDates[remainingDates.length - 1] || ''
      if (newestDate) {
        try { sessionStorage.setItem('setlistSelectedDate', newestDate) } catch {}
      }
      await fetchSetlists(newestDate)
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Setlist konnte nicht gelöscht werden',
        status: 'error',
        position: 'top',
        duration: 2000,
      })
    }
  }

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-')
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  }

  const dates = Object.keys(allSetlists).sort()
  const currentIndex = dates.indexOf(selectedDate)
  
  // Filter dropdown to show max 7 dates: current ± 3
  const getVisibleDates = () => {
    if (dates.length <= 7) return dates
    
    const idx = currentIndex >= 0 ? currentIndex : 0
    let start = Math.max(0, idx - 3)
    let end = Math.min(dates.length, idx + 4)
    
    // Adjust if we're near the edges
    if (end - start < 7) {
      if (start === 0) {
        end = Math.min(7, dates.length)
      } else if (end === dates.length) {
        start = Math.max(0, dates.length - 7)
      }
    }
    
    return dates.slice(start, end)
  }
  const visibleDates = getVisibleDates()

  if (loading || entriesLoading) {
    return <Flex justify="center" py={10}><Spinner /></Flex>
  }

  if (dates.length === 0) {
    return (
      <Box textAlign="center" py={10} color="gray.400">
        <Text fontSize="lg" mb={2}>Keine Setlists vorhanden</Text>
        <Text fontSize="sm">Füge Songs über den + Button hinzu</Text>
      </Box>
    )
  }

  return (
    <Box>
      {/* Date selector */}
      <Flex align="center" justify="center" mb={4} gap={2}>
        <IconButton
          aria-label="Vorheriges Datum"
          icon={<ChevronLeftIcon />}
          size="sm"
          variant="ghost"
          isDisabled={currentIndex <= 0}
          onClick={() => navigateDate(-1)}
        />
        <Select
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          maxW="180px"
          size="sm"
          textAlign="center"
        >
          {visibleDates.map(d => (
            <option key={d} value={d}>{formatDate(d)}</option>
          ))}
          {dates.length > 7 && !visibleDates.includes(selectedDate) && (
            <option value={selectedDate}>{formatDate(selectedDate)}</option>
          )}
        </Select>
        <IconButton
          aria-label="Nächstes Datum"
          icon={<ChevronRightIcon />}
          size="sm"
          variant="ghost"
          isDisabled={currentIndex >= dates.length - 1}
          onClick={() => navigateDate(1)}
        />
        <IconButton
          aria-label="Kalender öffnen"
          icon={<CalendarIcon />}
          size="sm"
          variant="outline"
          colorScheme="blue"
          onClick={openCalendar}
        />
        <IconButton
          aria-label="Gesamte Setlist löschen"
          icon={<DeleteIcon />}
          size="sm"
          variant="outline"
          colorScheme="red"
          onClick={openDeleteDialog}
          isDisabled={entries.length === 0}
        />
      </Flex>

      <SetlistDatePicker
        isOpen={isCalendarOpen}
        onClose={closeCalendar}
        onDateSelect={handleCalendarSelect}
        selectedDate={selectedDate}
        existingDates={dates}
      />

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeDeleteDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Setlist löschen?
            </AlertDialogHeader>

            <AlertDialogBody>
              Möchtest du wirklich die gesamte Setlist vom <strong>{formatDate(selectedDate)}</strong> löschen? ({entries.length} {entries.length === 1 ? 'Song' : 'Songs'})
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={closeDeleteDialog}>
                Abbrechen
              </Button>
              <Button colorScheme="red" onClick={handleDeleteEntireSetlist} ml={3}>
                Ja, löschen
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Entries */}
      {entries.length === 0 ? (
        <Text textAlign="center" color="gray.400" py={4}>Keine Songs für dieses Datum</Text>
      ) : (
        <Box ref={containerRef}>
          {entries.map((entry, index) => {
            const isDragged = draggedIndex === index
            const isDragOver = dragOverIndex === index && draggedIndex !== index
            
            return (
              <Flex
                key={`${entry.filename}-${index}`}
                ref={(el) => { itemRefs.current[index] = el }}
                align="center"
                px={3}
                py={2}
                mb={2}
                borderWidth="2px"
                borderColor={isDragOver ? 'blue.400' : isDragged ? 'blue.300' : borderColor}
                borderRadius="md"
                bg={isDragged ? dragBg : isDragOver ? 'blue.50' : undefined}
                _hover={{ bg: hoverBg }}
                opacity={isDragged ? 0.7 : 1}
                transition="all 0.15s"
                transform={isDragOver ? 'scale(1.02)' : undefined}
                // Nur Drop-Ziele auf der Zeile erlauben.
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
              >
                <Box
                  mr={2}
                  cursor="grab"
                  p={2}
                  _active={{ cursor: 'grabbing', bg: 'gray.200' }}
                  borderRadius="md"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  onTouchMove={(e) => handleTouchMove(e)}
                  onTouchEnd={handleTouchEnd}
                  style={{ touchAction: 'none' }}
                >
                  <DragHandleIcon color="gray.400" boxSize={5} />
                </Box>
                <Badge mr={2} colorScheme="purple" fontSize="xs">{index + 1}</Badge>
                <Box
                  flex={1}
                  onClick={() => onOpenTab(entry.filename)}
                  cursor="pointer"
                >
                  <Text fontSize="md" fontWeight="bold" noOfLines={1}>
                    {entry.name}
                  </Text>
                  <Text fontSize="xs" color="gray.500" noOfLines={1}>
                    {entry.artist}
                  </Text>
                </Box>
                <IconButton
                  aria-label="Entfernen"
                  icon={<DeleteIcon />}
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  onClick={(e) => { e.stopPropagation(); handleDelete(entry.filename) }}
                />
              </Flex>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
