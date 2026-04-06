import { IconButton, Tooltip, useDisclosure, useToast } from '@chakra-ui/react'
import { FiPlus } from 'react-icons/fi'
import { Tab, UGChordCollection } from '../types/tabs'
import DatePickerModal, { getLastSelectedDate, setLastSelectedDate } from './DatePickerModal'
import { useState, useEffect } from 'react'

interface Props {
  tab: Tab
  isLoading: boolean
}

export default function SetlistAddButton({ tab, isLoading }: Props): JSX.Element {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const [lastDate, setLastDate] = useState<string | null>(null)

  useEffect(() => {
    setLastDate(getLastSelectedDate())
  }, [isOpen])

  const handleDateSelect = async (date: string) => {
    if (!tab) return
    setLastSelectedDate(date)
    setLastDate(date)

    // First, save the tab locally if it's from Ultimate Guitar (not already saved)
    if (tab.url && !tab.url.startsWith('local://')) {
      try {
        // Read chord names from DOM to capture transposition state
        let savedChords = tab.chordsDiagrams
        if (tab.chordsDiagrams) {
          const chordSpans = document.querySelectorAll('span.js-chord-chord')
          const domChordNames = Array.from(new Set(
            Array.from(chordSpans).map(el => el.textContent?.trim()).filter(Boolean) as string[]
          ))
          const originalKeys = Object.keys(tab.chordsDiagrams)
          if (domChordNames.length > 0 && domChordNames.length === originalKeys.length) {
            const newChords: Record<string, unknown> = {}
            domChordNames.forEach((newKey, i) => {
              newChords[newKey] = (tab.chordsDiagrams as unknown as Record<string, unknown>)[originalKeys[i]]
            })
            savedChords = newChords as unknown as UGChordCollection[]
          }
        }

        // Build transposed htmlTab
        let htmlTabToSave = tab.htmlTab
        if (tab.chordsDiagrams && savedChords) {
          const originalKeys = Object.keys(tab.chordsDiagrams)
          const transposedKeys = Object.keys(savedChords as unknown as Record<string, unknown>)
          if (originalKeys.length === transposedKeys.length) {
            let html = tab.htmlTab
            originalKeys.forEach((orig, i) => {
              const transposed = transposedKeys[i]
              if (orig !== transposed) {
                html = html.replace(
                  new RegExp(`(<span[^>]*js-chord-chord[^>]*>)${orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(<\/span>)`, 'g'),
                  `$1${transposed}$2`
                )
              }
            })
            htmlTabToSave = html
          }
        }

        const tabToSave: Tab = {
          ...tab,
          htmlTab: htmlTabToSave,
          chordsDiagrams: savedChords,
        }

        await fetch('/api/saved-tabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tab: tabToSave }),
        })
      } catch (e) {
        console.error('Failed to save tab:', e)
      }
    }

    // Construct filename from tab info
    const filename = `${tab.artist} - ${tab.name} (${tab.type || 'Chords'}).ultimatetab.json`

    await fetch('/api/setlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        filename,
        artist: tab.artist,
        name: tab.name,
        type: tab.type || 'Chords',
      }),
    })
    
    toast({
      description: `"${tab.name}" zur Setlist hinzugefügt`,
      status: 'success',
      position: 'top-right',
      duration: 2000,
    })
    
    // Notify setlist view to refresh
    window.dispatchEvent(new Event('setlist-updated'))
  }

  return (
    <>
      <Tooltip label="Zur Setlist hinzufügen" placement="top">
        <IconButton
          aria-label="Zur Setlist hinzufügen"
          icon={<FiPlus />}
          variant="outline"
          size="sm"
          boxShadow="md"
          colorScheme="green"
          isDisabled={isLoading || !tab}
          onClick={onOpen}
        />
      </Tooltip>
      <DatePickerModal
        isOpen={isOpen}
        onClose={onClose}
        onDateSelect={handleDateSelect}
        selectedDate={lastDate}
      />
    </>
  )
}
