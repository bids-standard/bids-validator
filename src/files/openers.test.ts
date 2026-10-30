/**
 * File openers for use in testing
 */
import {
  assertEquals,
  assertNotStrictEquals,
  assertRejects,
  assertStrictEquals,
} from '@std/assert'
import { resolvesNext, stub } from '@std/testing/mock'
import type { FileOpener } from '../types/filetree.ts'
import { createUTF8Stream, streamFromString, streamFromUint8Array } from './streams.ts'
import { IssueError } from '../issues/datasetIssues.ts'
import { annexIssue } from './annexKey.ts'
import { AnnexPointerOpener, FsFileOpener, HTTPOpener, RejectingFileOpener } from './openers.ts'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export class BytesOpener implements FileOpener {
  contents: Uint8Array<ArrayBuffer>
  size: number

  constructor(contents: Uint8Array<ArrayBuffer>) {
    this.contents = contents
    this.size = contents.length
  }

  text(): Promise<string> {
    return Promise.resolve(textDecoder.decode(this.contents))
  }

  readBytes(size: number, offset = 0): Promise<Uint8Array<ArrayBuffer>> {
    return Promise.resolve(this.contents.slice(offset, offset + size))
  }

  stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    return Promise.resolve(streamFromUint8Array(this.contents))
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

  stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    const tee = this.#stream.tee()
    this.#stream = tee[1]
    return Promise.resolve(tee[0])
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
  await t.step('size', () => {
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

Deno.test('Validate HTTPOpener', async (t) => {
  const url = 'http://example.com'
  await t.step('Use successful fetch stub', async () => {
    using _fetchStub = stub(
      globalThis,
      'fetch',
      resolvesNext([new Response('Hello, world!')]),
    )
    const httpOpener = new HTTPOpener(url, 1)
    assertEquals(await httpOpener.text(), 'Hello, world!')
  })
  await t.step('Use failed fetch stub', async () => {
    using _fetchStub = stub(
      globalThis,
      'fetch',
      resolvesNext([new Response('Not Found', { status: 404, statusText: 'Not Found' })]),
    )
    const httpOpener = new HTTPOpener(url, 1)
    await assertRejects(httpOpener.text.bind(httpOpener))
    await assertRejects(httpOpener.stream.bind(httpOpener))
    await assertRejects(() => httpOpener.readBytes(1, 0))
  })
})

Deno.test('RejectingFileOpener', async () => {
  const issue = annexIssue('UNLOCKED_ANNEX_DATA', 'MD5E-s5--x.nii')
  const opener = new RejectingFileOpener(5, issue)
  assertEquals(opener.size, 5)
  const errors = [
    await assertRejects(() => opener.resolve(), IssueError),
    await assertRejects(() => opener.text(), IssueError),
    await assertRejects(() => opener.stream(), IssueError),
    await assertRejects(() => opener.readBytes(1), IssueError),
  ]
  for (const error of errors) {
    assertEquals(error.issue, issue)
  }
  assertNotStrictEquals(errors[0].issue, errors[1].issue)
  assertNotStrictEquals(errors[0].issue, issue)
})

async function collect(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

Deno.test('AnnexPointerOpener', async (t) => {
  const dir = await Deno.makeTempDir()
  const key = 'MD5E-s16--a35f6370ff3128ab75c29b1754d09bf7.nii.gz'
  const pointer = `/annex/objects/${key}\n`
  const small = JSON.stringify({ a: 'x'.repeat(80) }).padEnd(100, ' ')
  const large = JSON.stringify({ a: 'x'.repeat(2000) }).padEnd(2048, ' ')
  const paths = {
    pointer: `${dir}/pointer.nii.gz`,
    small: `${dir}/small.json`,
    large: `${dir}/large.json`,
  }
  await Deno.writeTextFile(paths.pointer, pointer)
  await Deno.writeTextFile(paths.small, small)
  await Deno.writeTextFile(paths.large, large)

  await t.step('delegates a pointer', async () => {
    const calls: [string, number][] = []
    const opener = new AnnexPointerOpener(new FsFileOpener(paths.pointer), (key, size) => {
      calls.push([key, size])
      return new StringOpener('resolved content')
    })
    assertEquals(opener.size, pointer.length)
    await opener.resolve()
    assertEquals(opener.size, 'resolved content'.length)
    assertEquals(await opener.text(), 'resolved content')
    assertEquals(calls, [[key, 16]])
  })

  await t.step("rejects with the delegate's issue", async () => {
    const opener = new AnnexPointerOpener(
      new FsFileOpener(paths.pointer),
      (key) => new RejectingFileOpener(16, annexIssue('UNLOCKED_ANNEX_DATA', key)),
    )
    const error = await assertRejects(() => opener.resolve(), IssueError)
    assertEquals(error.issue.code, 'UNLOCKED_ANNEX_DATA')
    const textError = await assertRejects(() => opener.text(), IssueError)
    assertEquals(textError.issue.code, 'UNLOCKED_ANNEX_DATA')
  })

  await t.step('reads non-pointers as before', async () => {
    for (const path of [paths.small, paths.large]) {
      let called = false
      const opener = new AnnexPointerOpener(new FsFileOpener(path), () => {
        called = true
        return new StringOpener('unexpected')
      })
      const plain = new FsFileOpener(path)
      assertEquals(opener.size, plain.size)
      assertEquals(await opener.text(), await plain.text())
      assertEquals(await opener.readBytes(10, 5), await plain.readBytes(10, 5))
      assertEquals(await collect(await opener.stream()), await collect(await plain.stream()))
      assertEquals(called, false)
    }
  })

  await t.step('replays small files', async () => {
    const path = `${dir}/replay.json`
    await Deno.writeTextFile(path, small)
    const opener = new AnnexPointerOpener(new FsFileOpener(path), () => new StringOpener(''))
    assertEquals(await opener.text(), small)
    await Deno.remove(path)
    assertEquals(await opener.text(), small)
    assertEquals(textDecoder.decode(await opener.readBytes(10, 5)), small.slice(5, 15))
    assertEquals(textDecoder.decode(await collect(await opener.stream())), small)
  })

  await t.step('replays unmodified after a consumer mutates a chunk', async () => {
    const path = `${dir}/mutate.json`
    await Deno.writeTextFile(path, small)
    const opener = new AnnexPointerOpener(new FsFileOpener(path), () => new StringOpener(''))
    const reader = (await opener.stream()).getReader()
    const { value } = await reader.read()
    value!.fill(0)
    await reader.cancel()
    assertEquals(await opener.text(), small)
  })

  await t.step('rereads larger files', async () => {
    const path = `${dir}/reread.json`
    await Deno.writeTextFile(path, large)
    const opener = new AnnexPointerOpener(new FsFileOpener(path), () => new StringOpener(''))
    assertEquals(await opener.text(), large)
    await Deno.remove(path)
    await assertRejects(() => opener.text())
  })

  await t.step('resolves once', () => {
    const opener = new AnnexPointerOpener(
      new FsFileOpener(paths.small),
      () => new StringOpener(''),
    )
    assertStrictEquals(opener.resolve(), opener.resolve())
  })

  await Deno.remove(dir, { recursive: true })
})
