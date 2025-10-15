/**
 * File openers for use in testing
 */
import { assertEquals } from '@std/assert'
import { type FileOpener } from '../types/filetree.ts'
import { streamFromString } from '../tests/utils.ts'
import { createUTF8Stream } from './streams.ts'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export class BytesOpener implements FileOpener {
  contents: Uint8Array<ArrayBuffer>
  size: number

  constructor(contents: Uint8Array<ArrayBuffer>) {
    this.contents = contents
    this.size = contents.length
  }

  async text(): Promise<string> {
    return textDecoder.decode(this.contents)
  }

  async readBytes(size: number, offset = 0): Promise<Uint8Array<ArrayBuffer>> {
    return this.contents.slice(offset, offset + size)
  }

  async stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    const contents = this.contents
    return new ReadableStream({
      start(controller) {
        controller.enqueue(contents)
        controller.close()
      },
    })
  }
}

export class StringOpener extends BytesOpener {
  constructor(contents: string) {
    super(textEncoder.encode(contents))
  }
}

export class StreamOpener implements FileOpener {
  #stream: ReadableStream<Uint8Array<ArrayBuffer>>
  size: number

  constructor(stream: ReadableStream<Uint8Array<ArrayBuffer>>, size: number) {
    this.#stream = stream
    this.size = size
  }

  async stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    const tee = this.#stream.tee()
    this.#stream = tee[1]
    return tee[0]
  }

  async text(): Promise<string> {
    const stream = await this.stream()
    const reader = stream.pipeThrough(createUTF8Stream()).getReader()
    const chunks: string[] = []
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
      return chunks.join('')
    } finally {
      reader.releaseLock()
    }
  }

  // Not a thoroughly tested implementation
  // Do not move this out of test files without adding more substantial tests
  async readBytes(size: number, offset = 0): Promise<Uint8Array<ArrayBuffer>> {
    const stream = await this.stream()
    const reader = stream.getReader()
    const result = new Uint8Array(size)
    let pos = 0
    try {
      while (pos < offset + size) {
        const { done, value } = await reader.read()
        if (done) break
        if (pos + value.length > offset) {
          result.set(
            value.subarray(Math.max(0, offset - pos), Math.min(value.length, offset + size - pos)),
            Math.max(0, pos - offset),
          )
        }
        pos += value.length
      }
    } finally {
      reader.releaseLock()
    }
    return result.subarray(0, Math.min(size, pos - offset))
  }
}

export class CompressedStringOpener extends StreamOpener {
  constructor(contents: string) {
    // Use uncompressed length as size, for simplicity
    super(streamFromString(contents).pipeThrough(new CompressionStream('gzip')), contents.length)
  }
}

async function testOpener(t: Deno.TestContext, opener: FileOpener) {
  await t.step('size', async () => {
    assertEquals(opener.size, 13)
  })
  await t.step('text()', async () => {
    assertEquals(await opener.text(), 'Hello, world!')
  })
  await t.step('readBytes()', async () => {
    assertEquals(textDecoder.decode(await opener.readBytes(5)), 'Hello')
    assertEquals(textDecoder.decode(await opener.readBytes(7, 5)), ', world')
  })
  await t.step('stream()', async () => {
    const stream = await opener.stream()
    const chunks: string[] = []
    for await (const chunk of stream) {
      chunks.push(textDecoder.decode(chunk))
    }
    assertEquals(chunks.join(''), 'Hello, world!')
  })
}

Deno.test('Validate BytesOpener', async (t) => {
  await testOpener(t, new BytesOpener(textEncoder.encode('Hello, world!')))
})

Deno.test('Validate StringOpener', async (t) => {
  await testOpener(t, new StringOpener('Hello, world!'))
})

Deno.test('Validate StreamOpener', async (t) => {
  await testOpener(t, new StreamOpener(streamFromString('Hello, world!'), 13))
})

Deno.test('Validate CompressedStringOpener', async (t) => {
  const opener = new CompressedStringOpener('Hello, world!')
  await t.step('Decompress', async () => {
    const stream = await opener.stream()
    const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'))
    const chunks: string[] = []
    for await (const chunk of decompressedStream) {
      chunks.push(textDecoder.decode(chunk))
    }
    assertEquals(chunks.join(''), 'Hello, world!')
  })
})
