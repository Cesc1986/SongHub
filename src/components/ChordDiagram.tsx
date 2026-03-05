import {
  Box,
  IconButton,
  useColorModeValue,
  Text,
  Flex,
} from '@chakra-ui/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from '@chakra-ui/react'
import useAppStateContext from '../hooks/useAppStateContext'
import ChordBox from '../../node_modules/vexchords/chordbox'
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { UGChordCollection, VexchordsOptions } from '../types/tabs'
import { getLocalChord, LocalChordVariant } from '../data/chords'

interface ChordDiagramState {
  [key: string]: number
}

function getVariants(chordName: string, chordsDiagrams: UGChordCollection[]): LocalChordVariant[] | null {
  // Try UG data first — exact key match
  const ugData = chordsDiagrams[chordName]
  if (ugData && ugData.length > 0) {
    // Convert UG format to LocalChordVariant format
    return ugData.map((ugChord) => {
      const fretValues = ugChord.frets || []
      const fingers = ugChord.fingers || []
      const position = ugChord.fret ?? 0
      const positionOffset = position > 1 ? position - 1 : 0
      // UG: index 0 = low E (string 6), reverse for vexchords (string 1 = high e)
      const reversed = [...fretValues].reverse()
      const reversedFingers = [...fingers].reverse()
      const frets: (number | 'x')[][] = reversed.map((val, i) => {
        const fretVal = val === -1 ? 'x' : Math.max(0, val - positionOffset)
        const finger = reversedFingers[i] ?? 0
        return finger > 0 ? [i + 1, fretVal, finger] : [i + 1, fretVal]
      })
      const barChord = ugChord.listCapos?.[0]
      const numStrings = fretValues.length
      return {
        frets,
        position: position > 1 ? position : 0,
        barres: barChord ? [{
          fromString: numStrings - barChord.startString,
          toString: numStrings - barChord.lastString,
          fret: position > 1 ? barChord.fret - position + 1 : barChord.fret,
        }] : [],
      }
    })
  }
  // Fallback: local chord database
  return getLocalChord(chordName)
}

export default function ChordDiagram({
  chords,
}: {
  chords: UGChordCollection[]
}): JSX.Element {
  const borderLightColor = useColorModeValue('gray.200', 'gray.700')
  const bgColor = useColorModeValue('#ffffff', '#1a202c')
  const strokeColor = useColorModeValue('#444444', '#e2e8f0')
  const chordDiagramRef = useRef<HTMLDivElement>(null)
  const toast = useToast()
  const { selectedTabContent } = useAppStateContext()
  const [chordDiagramIndex, setChordDiagramIndex] = useState<ChordDiagramState>({})
  const [chordSelected, setChordSelected] = useState<string>('')
  const chordsDiagrams = useMemo(() => chords || [], [chords])

  useEffect(() => {
    document.querySelectorAll('span.js-chord-chord')?.forEach(
      (el: HTMLSpanElement) =>
        (el.onclick = () => {
          setChordSelected(el.innerText.trim())
        }),
    )
  }, [selectedTabContent?.htmlTab, chords])

  useEffect(() => setChordSelected(''), [selectedTabContent?.url, chords])

  useEffect(() => {
    if (!chordSelected) return

    const variants = getVariants(chordSelected, chordsDiagrams)
    if (!variants || variants.length === 0) return

    if (chordDiagramIndex[chordSelected] === undefined) {
      setChordDiagramIndex((prev) => ({ ...prev, [chordSelected]: 0 }))
      return
    }

    const idx = chordDiagramIndex[chordSelected]
    const variant = variants[idx]
    if (!variant) return

    const formattedVexchord: VexchordsOptions = {
      name: chordSelected,
      chord: variant.frets as any,
      position: variant.position || 0,
      barres: variant.barres || [],
    }

    setTimeout(() => {
      if (!chordDiagramRef.current) return
      chordDiagramRef.current.innerHTML = ''
      const hasPosition = (variant.position || 0) > 1
      const chordBox = new ChordBox(chordDiagramRef.current, {
        width: 110,
        height: 130,
        bgColor,
        defaultColor: strokeColor,
        labelColor: bgColor,
        showTuning: !hasPosition,  // hide string names when position number is shown
      })
      chordBox.draw(formattedVexchord)
    }, 0)
  }, [chordDiagramIndex, chordsDiagrams, chordSelected, bgColor, strokeColor])

  const variants = chordSelected ? getVariants(chordSelected, chordsDiagrams) : null
  const totalVariants = variants?.length ?? 0
  const currentIndex = chordDiagramIndex[chordSelected] ?? 0

  return (
    <Flex
      position={'fixed'}
      right={'17px'}
      bottom="17px"
      borderRadius={'lg'}
      bg={borderLightColor}
      textAlign="center"
      className="chord--diagram"
      display={!chordSelected ? 'none' : 'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      onClick={() => setChordSelected('')}
      zIndex={1}
    >
      <Flex
        p={2}
        pb={0}
        display={!chordSelected ? 'none' : 'inline-flex'}
        alignItems={'center'}
      >
        <IconButton
          icon={<ChevronLeftIcon />}
          size={'xs'}
          mr={1}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setChordDiagramIndex((prev) => ({
              ...prev,
              [chordSelected]: currentIndex === 0 ? totalVariants - 1 : currentIndex - 1,
            }))
          }}
          aria-label={'Previous diagram'}
        />
        <Text fontSize={'xs'}>{currentIndex + 1} of {totalVariants}</Text>
        <IconButton
          icon={<ChevronRightIcon />}
          ml={1}
          size={'xs'}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setChordDiagramIndex((prev) => ({
              ...prev,
              [chordSelected]: currentIndex === totalVariants - 1 ? 0 : currentIndex + 1,
            }))
          }}
          aria-label={'Next diagram'}
        />
      </Flex>
      <Box ref={chordDiagramRef} minW="110px" minH="130px" />
      <Text py={1} as={'b'}>{chordSelected}</Text>
    </Flex>
  )
}
