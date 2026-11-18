import type { Tab } from '../types/tabs'

export function hasTabContent(html?: string): boolean {
  return typeof html === 'string' && (
    /<img\s[^>]*\bsrc\s*=/i.test(html) ||
    html.replace(/<[^>]*>|&nbsp;|&#160;|&#x0*a0;/gi, '').trim().length > 0
  )
}

export function chooseTab(url: string, base?: Tab, responsive?: Tab): Tab | undefined {
  const current = base?.url === url ? base : undefined
  if (responsive?.url !== url || !hasTabContent(responsive.htmlTab) || current?.savedAt || current?.savedFilename) return current
  return current ? { ...current, htmlTab: responsive.htmlTab } : responsive
}
