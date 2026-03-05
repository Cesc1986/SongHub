import { Button, Icon, Tooltip, useToast } from '@chakra-ui/react'
import { FiSave } from 'react-icons/fi'
import { Tab, UGChordCollection } from '../types/tabs'
import { useState } from 'react'

interface TabSaveButtonProps {
  tab: Tab
  isLoading: boolean
}

export default function TabSaveButton({ tab, isLoading }: TabSaveButtonProps): JSX.Element {
  const toast = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!tab) return
    setIsSaving(true)
    try {
      // Capture current DOM state — includes transposed chord text
      const tabContentEl = document.querySelector('[data-tab-content="true"]') as HTMLElement
      const currentHtml = tabContentEl ? tabContentEl.innerHTML : tab.htmlTab

      // Build transposed chordsDiagrams by reading current chord names from DOM
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

      const tabToSave: Tab = {
        ...tab,
        htmlTab: currentHtml,
        chordsDiagrams: savedChords,
      }

      const res = await fetch('/api/saved-tabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab: tabToSave }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          description: `"${tab.name}" auf dem Server gespeichert!`,
          status: 'success',
          position: 'top-right',
          duration: 2000,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (e) {
      toast({
        description: 'Speichern fehlgeschlagen.',
        status: 'error',
        position: 'top-right',
        duration: 2000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Tooltip label="Tab auf Server speichern" placement="top">
      <Button
        variant="outline"
        size="sm"
        boxShadow="md"
        fontWeight="normal"
        px="3"
        py="4"
        isDisabled={isLoading || !tab}
        isLoading={isSaving}
        onClick={handleSave}
        leftIcon={<Icon as={FiSave} />}
      >
        Speichern
      </Button>
    </Tooltip>
  )
}
