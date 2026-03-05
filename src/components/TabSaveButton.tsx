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
      // Always save the original htmlTab (viewport-independent)
      // Only read chord names from DOM to capture transposition state
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

      // Build transposed htmlTab: replace chord spans in original HTML with transposed names
      let htmlTabToSave = tab.htmlTab
      if (tab.chordsDiagrams && savedChords) {
        const originalKeys = Object.keys(tab.chordsDiagrams)
        const transposedKeys = Object.keys(savedChords as unknown as Record<string, unknown>)
        if (originalKeys.length === transposedKeys.length) {
          let html = tab.htmlTab
          originalKeys.forEach((orig, i) => {
            const transposed = transposedKeys[i]
            if (orig !== transposed) {
              // Replace chord name inside js-chord-chord spans
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
