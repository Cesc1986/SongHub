// Matches the reMarkable-sync sidecar's own STRING_LINE_RE (a short string
// label like "e", "B", "D#" followed by "|"), so blocks wrapped here get its
// smart bar-aligned reflow instead of falling back to plain wrapping.
const STRING_LINE_RE = /^([A-Za-z0-9#]{1,3})\|/

/**
 * Wraps contiguous runs of six-line ASCII tab notation in [tab]...[/tab]
 * markers, the same BBCode-style convention Ultimate Guitar's raw_tabs
 * already uses. Only marks block boundaries - the matched lines themselves
 * are left byte-for-byte untouched, and everything else in the text passes
 * through unchanged.
 */
export function wrapTabBlocks(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    if (STRING_LINE_RE.test(lines[i])) {
      const start = i
      while (i < lines.length && STRING_LINE_RE.test(lines[i])) i++
      out.push('[tab]', ...lines.slice(start, i), '[/tab]')
    } else {
      out.push(lines[i])
      i++
    }
  }
  return out.join('\n')
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
