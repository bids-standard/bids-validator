import { assertEquals, assertInstanceOf, assertObjectMatch, assertRejects } from '@std/assert'
import { IssueError } from '../issues/datasetIssues.ts'
import type { BIDSFile } from '../types/filetree.ts'
import { testAsyncFileAccess } from './access.test.ts'

import { pathsToTree } from '../files/filetree.test.ts'
import { loadJSON } from './json.ts'
import { FsFileOpener } from './openers.ts'
import { streamFromUint8Array } from './streams.ts'
import { BIDSFile as File } from '../types/filetree.ts'

function encodeUTF16(text: string) {
  // Adapted from https://developer.chrome.com/blog/how-to-convert-arraybuffer-to-and-from-string

  // Ensure BOM is present
  text = text.charCodeAt(0) === 0xFEFF ? text : '\uFEFF' + text
  const buffer = new ArrayBuffer(text.length * 2)
  const view = new Uint16Array(buffer)
  for (let i = 0, strLen = text.length; i < strLen; i++) {
    view[i] = text.charCodeAt(i)
  }
  return buffer
}

function makeFile(path: string, text: string, encoding: string): BIDSFile {
  const bytes = encoding === 'utf-8' ? new TextEncoder().encode(text) : encodeUTF16(text)
  const file = pathsToTree([path]).get(path) as BIDSFile
  return {
    path: file.path,
    parent: file.parent,
    readBytes: (_size: number) => Promise.resolve(new Uint8Array(bytes)),
    stream: () => Promise.resolve(streamFromUint8Array(new Uint8Array(bytes))),
    size: bytes.byteLength,
  } as unknown as BIDSFile
}

Deno.test('Test JSON error conditions', async (t) => {
  await t.step('Load valid JSON', async () => {
    const JSONfile = makeFile('/valid-contents.json', '{"a": 1}', 'utf-8')
    const result = await loadJSON(JSONfile)
    assertObjectMatch(result, { a: 1 })
  })

  await t.step('Error on BOM', async () => {
    const BOMfile = makeFile('/BOM.json', '\uFEFF{"a": 1}', 'utf-8')
    const e = await assertRejects(() => loadJSON(BOMfile), IssueError)
    assertObjectMatch(e.issue, { code: 'INVALID_JSON_ENCODING' })
  })

  await t.step('Error on UTF-16', async () => {
    const UTF16file = makeFile('/utf16.json', '{"a": 1}', 'utf-16')
    const e = await assertRejects(() => loadJSON(UTF16file), IssueError)
    assertObjectMatch(e.issue, { code: 'INVALID_JSON_ENCODING' })
  })

  await t.step('Error on invalid JSON syntax', async () => {
    const badJSON = makeFile('/bad-syntax.json', '{"a": 1]', 'utf-8')
    const e = await assertRejects(() => loadJSON(badJSON), IssueError)
    assertObjectMatch(e.issue, { code: 'JSON_INVALID' })
    assertInstanceOf(e.cause, SyntaxError)
  })

  await t.step('Error on non-object JSON', async () => {
    const arrayJSON = makeFile('/array.json', '[1, 2, 3]', 'utf-8')
    const e = await assertRejects(() => loadJSON(arrayJSON), IssueError)
    assertObjectMatch(e.issue, { code: 'JSON_NOT_AN_OBJECT', issueMessage: '[1, 2, 3]' })
  })
  loadJSON.cache.clear()
})

Deno.test('loadJSON reads past a stale size', async () => {
  loadJSON.cache.clear()
  const path = await Deno.makeTempFile({ suffix: '.json' })
  try {
    await Deno.writeTextFile(path, '{}')
    const staleInfo = Deno.statSync(path)
    await Deno.writeTextFile(path, '{"Name": "a long enough value"}')
    const file = new File('/x.json', new FsFileOpener(path, staleInfo))
    assertEquals(await loadJSON(file), { Name: 'a long enough value' })
  } finally {
    loadJSON.cache.clear()
    await Deno.remove(path)
  }
})

testAsyncFileAccess('Test file access errors for loadJSON', loadJSON)
