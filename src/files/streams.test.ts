import { assert, assertEquals } from '@std/assert'
import { createUTF8Stream, UnicodeDecodeError } from './streams.ts'
import { streamFromString, streamFromUint8Array } from '../tests/utils.ts'

Deno.test('createUTF8Stream', async (t) => {
  await t.step('should return a TransformStream with UTF8StreamTransformer', () => {
    const stream = createUTF8Stream()
    assertEquals(stream instanceof TransformStream, true)
  })

  await t.step('should correctly transform UTF-8 input', async () => {
    const rawstream = streamFromString('Hello, world!')
    const reader = rawstream.pipeThrough(createUTF8Stream()).getReader()
    const { value } = await reader.read()
    assertEquals(value, 'Hello, world!')

    await reader.cancel()
  })

  await t.step('should throw UnicodeDecodeError for UTF-16 input', async () => {
    const rawStream = streamFromUint8Array(new Uint8Array([0xFF, 0xFE, 0x00, 0x00]))

    let reader
    try {
      // The exception can't be localized to either of the following lines
      // but is raised before the second returns
      reader = rawStream.pipeThrough(createUTF8Stream()).getReader()
      const { value } = await reader.read()
      assert(false, 'Expected UnicodeDecodeError, got ' + value)
    } catch (e: any) {
      assertEquals(e instanceof UnicodeDecodeError, true)
      assertEquals(e?.message, 'This file appears to be UTF-16')
    } finally {
      if (reader) await reader.cancel
    }
  })
})
