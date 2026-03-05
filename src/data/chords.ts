// Local chord database in vexchords format
// chord array: [stringNumber, fretNumber, fingerLabel?]
// stringNumber: 1=high e, 6=low E
// fretNumber: 0=open, 'x'=muted
// position: starting fret (0/1 = open position)

export interface LocalChordVariant {
  frets: (number | 'x')[][]  // [stringNum, fret, finger?]
  position?: number
  barres?: { fromString: number; toString: number; fret: number }[]
}

export type LocalChordDB = Record<string, LocalChordVariant[]>

const chords: LocalChordDB = {
  // ── A ──
  'A': [
    { frets: [[1,0],[2,2,3],[3,2,2],[4,2,1],[5,0],[6,'x']] },
    { frets: [[1,0],[2,2,3],[3,2,2],[4,2,1],[5,0],[6,'x']] },
  ],
  'Am': [
    { frets: [[1,0],[2,1,1],[3,2,3],[4,2,2],[5,0],[6,'x']] },
  ],
  'A7': [
    { frets: [[1,0],[2,2,2],[3,0],[4,2,1],[5,0],[6,'x']] },
  ],
  'Am7': [
    { frets: [[1,0],[2,1,1],[3,0],[4,2,2],[5,0],[6,'x']] },
  ],
  'Asus2': [
    { frets: [[1,0],[2,0],[3,2,2],[4,2,1],[5,0],[6,'x']] },
  ],
  'Asus4': [
    { frets: [[1,0],[2,3,4],[3,2,3],[4,2,2],[5,0],[6,'x']] },
  ],
  'Amaj7': [
    { frets: [[1,0],[2,2,3],[3,1,1],[4,2,2],[5,0],[6,'x']] },
  ],
  // ── A# / Bb ──
  'A#': [
    { frets: [[1,1,1],[2,3,4],[3,3,3],[4,3,2],[5,1,1],[6,1,1]], position: 1,
      barres: [{ fromString: 6, toString: 1, fret: 1 }] },
  ],
  'Bb': [
    { frets: [[1,1,1],[2,3,4],[3,3,3],[4,3,2],[5,1,1],[6,1,1]], position: 1,
      barres: [{ fromString: 6, toString: 1, fret: 1 }] },
  ],
  'Bbm': [
    { frets: [[1,1,1],[2,2,4],[3,3,3],[4,3,2],[5,1,1],[6,1,1]], position: 1,
      barres: [{ fromString: 6, toString: 1, fret: 1 }] },
  ],
  // ── B ──
  'B': [
    { frets: [[1,2,1],[2,4,4],[3,4,3],[4,4,2],[5,2,1],[6,'x']],
      barres: [{ fromString: 5, toString: 1, fret: 2 }] },
  ],
  'Bm': [
    { frets: [[1,2,1],[2,3,3],[3,4,4],[4,4,3],[5,2,1],[6,'x']],
      barres: [{ fromString: 5, toString: 1, fret: 2 }] },
  ],
  'B7': [
    { frets: [[1,2,2],[2,0],[3,2,3],[4,1,1],[5,2,4],[6,'x']] },
  ],
  'Bm7': [
    { frets: [[1,2,1],[2,3,3],[3,2,1],[4,4,4],[5,2,1],[6,'x']],
      barres: [{ fromString: 5, toString: 1, fret: 2 }] },
  ],
  // ── C ──
  'C': [
    { frets: [[1,0],[2,1,1],[3,0],[4,2,2],[5,3,3],[6,'x']] },
  ],
  'Cm': [
    { frets: [[1,3,1],[2,4,3],[3,5,4],[4,5,4],[5,3,1],[6,3,1]], position: 3,
      barres: [{ fromString: 6, toString: 1, fret: 3 }] },
  ],
  'C7': [
    { frets: [[1,0],[2,1,1],[3,3,3],[4,2,2],[5,3,4],[6,'x']] },
  ],
  'Cmaj7': [
    { frets: [[1,0],[2,0],[3,0],[4,2,2],[5,3,3],[6,'x']] },
  ],
  'Cadd9': [
    { frets: [[1,3,4],[2,3,3],[3,0],[4,2,2],[5,3,1],[6,'x']] },
  ],
  'Csus2': [
    { frets: [[1,3,4],[2,1,1],[3,0],[4,2,2],[5,3,3],[6,'x']] },
  ],
  'Csus4': [
    // x33011 — fingers 3+4 on fret 3 (A+D), barre fret 1 (B+e)
    { frets: [[1,1,1],[2,1,1],[3,0],[4,3,4],[5,3,3],[6,'x']],
      barres: [{ fromString: 2, toString: 1, fret: 1 }] },
  ],
  // ── C# / Db ──
  'C#': [
    { frets: [[1,4,1],[2,6,4],[3,6,3],[4,6,2],[5,4,1],[6,4,1]], position: 4,
      barres: [{ fromString: 6, toString: 1, fret: 4 }] },
  ],
  'C#m': [
    { frets: [[1,4,1],[2,5,3],[3,6,4],[4,6,4],[5,4,1],[6,4,1]], position: 4,
      barres: [{ fromString: 6, toString: 1, fret: 4 }] },
  ],
  'Db': [
    { frets: [[1,4,1],[2,6,4],[3,6,3],[4,6,2],[5,4,1],[6,4,1]], position: 4,
      barres: [{ fromString: 6, toString: 1, fret: 4 }] },
  ],
  // ── D ──
  'D': [
    { frets: [[1,2,2],[2,3,3],[3,2,1],[4,0],[5,'x'],[6,'x']] },
  ],
  'Dm': [
    { frets: [[1,1,1],[2,3,3],[3,2,2],[4,0],[5,'x'],[6,'x']] },
  ],
  'D7': [
    { frets: [[1,2,2],[2,1,1],[3,2,3],[4,0],[5,'x'],[6,'x']] },
  ],
  'Dmaj7': [
    { frets: [[1,2,2],[2,2,1],[3,2,3],[4,0],[5,'x'],[6,'x']] },
  ],
  'Dm7': [
    { frets: [[1,1,1],[2,1,1],[3,2,2],[4,0],[5,'x'],[6,'x']] },
  ],
  'Dsus2': [
    { frets: [[1,0],[2,3,3],[3,2,2],[4,0],[5,'x'],[6,'x']] },
  ],
  'Dsus4': [
    { frets: [[1,3,3],[2,3,4],[3,2,2],[4,0],[5,'x'],[6,'x']] },
  ],
  'Dadd9': [
    { frets: [[1,0],[2,3,3],[3,2,2],[4,0],[5,'x'],[6,'x']] },
  ],
  // ── D# / Eb ──
  'D#': [
    { frets: [[1,3,1],[2,4,2],[3,5,3],[4,5,3],[5,3,1],[6,'x']],
      barres: [{ fromString: 4, toString: 1, fret: 3 }] },
  ],
  'Eb': [
    { frets: [[1,3,1],[2,4,2],[3,5,3],[4,5,3],[5,3,1],[6,'x']],
      barres: [{ fromString: 4, toString: 1, fret: 3 }] },
  ],
  // ── E ──
  'E': [
    { frets: [[1,0],[2,0],[3,1,1],[4,2,3],[5,2,2],[6,0]] },
  ],
  'Em': [
    { frets: [[1,0],[2,0],[3,0],[4,2,3],[5,2,2],[6,0]] },
  ],
  'E7': [
    { frets: [[1,0],[2,3,4],[3,1,1],[4,2,2],[5,2,3],[6,0]] },
  ],
  'Em7': [
    { frets: [[1,0],[2,3,4],[3,0],[4,2,2],[5,2,3],[6,0]] },
  ],
  'Emaj7': [
    { frets: [[1,0],[2,0],[3,1,1],[4,1,2],[5,2,3],[6,0]] },
  ],
  'Esus4': [
    { frets: [[1,0],[2,0],[3,2,3],[4,2,2],[5,2,1],[6,0]] },
  ],
  // ── F ──
  'F': [
    { frets: [[1,1,1],[2,1,1],[3,2,2],[4,3,4],[5,3,3],[6,1,1]], position: 1,
      barres: [{ fromString: 6, toString: 1, fret: 1 }] },
  ],
  'Fm': [
    { frets: [[1,1,1],[2,1,1],[3,1,1],[4,3,3],[5,3,4],[6,1,1]], position: 1,
      barres: [{ fromString: 6, toString: 1, fret: 1 }] },
  ],
  'F7': [
    { frets: [[1,1,1],[2,1,1],[3,2,2],[4,1,1],[5,3,3],[6,1,1]], position: 1,
      barres: [{ fromString: 6, toString: 1, fret: 1 }] },
  ],
  'Fmaj7': [
    { frets: [[1,0],[2,1,1],[3,2,2],[4,3,4],[5,3,3],[6,'x']] },
  ],
  'Fadd9': [
    { frets: [[1,1,1],[2,1,1],[3,3,3],[4,3,2],[5,3,4],[6,1,1]], position: 1,
      barres: [{ fromString: 6, toString: 1, fret: 1 }] },
  ],
  // ── F# / Gb ──
  'F#': [
    { frets: [[1,2,1],[2,2,1],[3,3,2],[4,4,4],[5,4,3],[6,2,1]], position: 2,
      barres: [{ fromString: 6, toString: 1, fret: 2 }] },
  ],
  'F#m': [
    { frets: [[1,2,1],[2,2,1],[3,2,1],[4,4,3],[5,4,4],[6,2,1]], position: 2,
      barres: [{ fromString: 6, toString: 1, fret: 2 }] },
  ],
  'Gb': [
    { frets: [[1,2,1],[2,2,1],[3,3,2],[4,4,4],[5,4,3],[6,2,1]], position: 2,
      barres: [{ fromString: 6, toString: 1, fret: 2 }] },
  ],
  // ── G ──
  'G': [
    { frets: [[1,3,4],[2,0],[3,0],[4,0],[5,2,1],[6,3,2]] },
    { frets: [[1,3,4],[2,3,3],[3,0],[4,0],[5,2,1],[6,3,2]] },
  ],
  'Gm': [
    { frets: [[1,3,1],[2,3,1],[3,3,1],[4,5,3],[5,5,4],[6,3,1]], position: 3,
      barres: [{ fromString: 6, toString: 1, fret: 3 }] },
  ],
  'G7': [
    { frets: [[1,1,1],[2,0],[3,0],[4,0],[5,2,2],[6,3,3]] },
  ],
  'Gmaj7': [
    { frets: [[1,2,1],[2,0],[3,0],[4,0],[5,2,3],[6,3,4]] },
  ],
  'Gsus4': [
    { frets: [[1,3,4],[2,1,1],[3,0],[4,0],[5,3,2],[6,3,3]] },
  ],
  'Gadd9': [
    { frets: [[1,3,4],[2,0],[3,2,2],[4,0],[5,0],[6,3,1]] },
  ],
  // ── G# / Ab ──
  'G#': [
    { frets: [[1,4,1],[2,4,1],[3,5,2],[4,6,4],[5,6,3],[6,4,1]], position: 4,
      barres: [{ fromString: 6, toString: 1, fret: 4 }] },
  ],
  'Ab': [
    { frets: [[1,4,1],[2,4,1],[3,5,2],[4,6,4],[5,6,3],[6,4,1]], position: 4,
      barres: [{ fromString: 6, toString: 1, fret: 4 }] },
  ],
  'G#m': [
    { frets: [[1,4,1],[2,4,1],[3,4,1],[4,6,3],[5,6,4],[6,4,1]], position: 4,
      barres: [{ fromString: 6, toString: 1, fret: 4 }] },
  ],
  // ── H / B (German notation) ──
  'H': [
    { frets: [[1,2,1],[2,4,4],[3,4,3],[4,4,2],[5,2,1],[6,'x']],
      barres: [{ fromString: 5, toString: 1, fret: 2 }] },
  ],
  'Hm': [
    { frets: [[1,2,1],[2,3,3],[3,4,4],[4,4,3],[5,2,1],[6,'x']],
      barres: [{ fromString: 5, toString: 1, fret: 2 }] },
  ],
  'H7': [
    { frets: [[1,2,2],[2,0],[3,2,3],[4,1,1],[5,2,4],[6,'x']] },
  ],
  // ── Slash chords (common bass note variants) ──
  'G/B': [
    { frets: [[1,3,4],[2,0],[3,0],[4,0],[5,2,2],[6,'x']] },
  ],
  'G/F#': [
    { frets: [[1,3,4],[2,0],[3,0],[4,0],[5,'x'],[6,2,1]] },
  ],
  'D/F#': [
    { frets: [[1,2,3],[2,3,4],[3,2,2],[4,0],[5,'x'],[6,2,1]] },
  ],
  'C/G': [
    { frets: [[1,0],[2,1,1],[3,0],[4,2,2],[5,3,3],[6,3,4]] },
  ],
  'C/E': [
    { frets: [[1,0],[2,1,1],[3,0],[4,2,2],[5,'x'],[6,0]] },
  ],
  'Am/E': [
    { frets: [[1,0],[2,1,1],[3,2,3],[4,2,2],[5,0],[6,0]] },
  ],
  'F/C': [
    { frets: [[1,1,1],[2,1,1],[3,2,2],[4,3,4],[5,3,3],[6,3,3]],
      barres: [{ fromString: 5, toString: 1, fret: 1 }] },
  ],
  'F/A': [
    // x03211 — A open, D fret 3 finger 3, G fret 2 finger 2, barre fret 1 on B+e
    { frets: [[1,1],[2,1],[3,2,2],[4,3,3],[5,0],[6,'x']],
      barres: [{ fromString: 2, toString: 1, fret: 1 }] },
  ],
  'E/G#': [
    { frets: [[1,0],[2,0],[3,1,1],[4,2,3],[5,2,2],[6,4,4]] },
  ],
  // ── Extra common chords ──
  'Dm/F': [
    { frets: [[1,1,1],[2,3,3],[3,2,2],[4,0],[5,'x'],[6,1,1]] },
  ],
  'Em/B': [
    { frets: [[1,0],[2,0],[3,0],[4,2,3],[5,2,2],[6,2,1]] },
  ],
  'Fmaj7/C': [
    { frets: [[1,0],[2,1,1],[3,2,2],[4,3,4],[5,3,3],[6,3,3]] },
  ],
}

export function getLocalChord(name: string): LocalChordVariant[] | null {
  if (!name) return null

  // Direct match
  if (chords[name]) return chords[name]

  // Normalize: uppercase first letter
  const normalized = name.charAt(0).toUpperCase() + name.slice(1)
  if (chords[normalized]) return chords[normalized]

  // Slash chord: F/C → look up F (bass note is just for context)
  if (normalized.includes('/')) {
    const base = normalized.split('/')[0].trim()
    if (chords[base]) return chords[base]
  }

  // Number shorthands: C4 → Csus4, C2 → Csus2, C9 → Cadd9, Cmaj → Cmaj7
  const numberMap: Record<string, string> = {
    '4': 'sus4',
    '2': 'sus2',
    '9': 'add9',
    'maj': 'maj7',
  }
  for (const [suffix, expansion] of Object.entries(numberMap)) {
    if (normalized.endsWith(suffix)) {
      const expanded = normalized.slice(0, -suffix.length) + expansion
      if (chords[expanded]) return chords[expanded]
    }
  }

  // Strip trailing modifiers and try base chord (e.g. Cmaj9 → C)
  const baseMatch = normalized.match(/^([A-H][#b]?)(m?)/)
  if (baseMatch) {
    const base = baseMatch[1] + baseMatch[2]
    if (chords[base]) return chords[base]
  }

  return null
}

export default chords
