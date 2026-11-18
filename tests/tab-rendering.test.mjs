import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

// Use the project's TypeScript compiler so this also runs on Node 20.
const source = readFileSync(new URL('../src/lib/tab-rendering.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
})
const { chooseTab, hasTabContent } = await import(`data:text/javascript,${encodeURIComponent(outputText)}`)

const song = (url, htmlTab, extra = {}) => ({ url, htmlTab, ...extra })
const base = song('current', '<pre>Saved chords</pre>', { savedFilename: 'current.json', marks: { A: false } })

test('late empty responses cannot erase visible tabs during repeated song switches', () => {
  for (let i = 0; i < 8; i++) {
    const tab = song(`song-${i}`, '<pre>Original</pre>')
    assert.equal(chooseTab(tab.url, tab, song(tab.url, '<pre>  </pre>')), tab)
    assert.equal(chooseTab(tab.url, tab, song(tab.url, undefined)), tab)
  }
})

test('keeps saved content and metadata and ignores responses for other songs', () => {
  assert.equal(chooseTab('current', base, song('previous', '<pre>Other song</pre>')), base)
  assert.equal(chooseTab('current', undefined, song('previous', '<pre>Other song</pre>')), undefined)
  const reflowed = song('current', '<pre>Reflowed chords</pre>')
  assert.equal(chooseTab('current', base, reflowed), base)
  const unsaved = song('current', '<pre>Original</pre>', { name: 'Current song' })
  assert.deepEqual(chooseTab('current', unsaved, reflowed), { ...unsaved, htmlTab: reflowed.htmlTab })
})

test('recognizes text and image tabs, not empty markup', () => {
  assert.equal(hasTabContent('<pre><span>&nbsp; </span></pre>'), false)
  assert.equal(hasTabContent('<pre><span>Am</span></pre>'), true)
  assert.equal(hasTabContent('<div><img src="fixture.png" /></div>'), true)
})
