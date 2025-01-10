import { type assert, assertObjectMatch } from '@std/assert'
import type { BIDSFile } from '../types/filetree.ts'
import type { FileIgnoreRules } from './ignore.ts'

import { loadJSON } from './json.ts'

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

function makeFile(text: string, encoding: string): BIDSFile {
  const bytes = encoding === 'utf-8' ? new TextEncoder().encode(text) : encodeUTF16(text)
  return {
    readBytes: async (size: number) => {
      return new Uint8Array(bytes)
    },
    size: bytes.byteLength,
  } as unknown as BIDSFile
}

Deno.test('Test JSON error conditions', async (t) => {
  await t.step('Load valid JSON', async () => {
    const JSONfile = makeFile('{"a": 1}', 'utf-8')
    const result = await loadJSON(JSONfile)
    assertObjectMatch(result, { a: 1 })
  })

  await t.step('Error on BOM', async () => {
    const BOMfile = makeFile('\uFEFF{"a": 1}', 'utf-8')
    let error: any = undefined
    await loadJSON(BOMfile).catch((e) => {
      error = e
    })
    assertObjectMatch(error, { key: 'INVALID_JSON_ENCODING' })
  })

  await t.step('Error on UTF-16', async () => {
    const UTF16file = makeFile('{"a": 1}', 'utf-16')
    let error: any = undefined
    await loadJSON(UTF16file).catch((e) => {
      error = e
    })
    assertObjectMatch(error, { key: 'INVALID_JSON_ENCODING' })
  })

  await t.step('Error on invalid JSON syntax', async () => {
    const badJSON = makeFile('{"a": 1]', 'utf-8')
    let error: any = undefined
    await loadJSON(badJSON).catch((e) => {
      error = e
    })
    assertObjectMatch(error, { key: 'JSON_INVALID' })
  })
})
