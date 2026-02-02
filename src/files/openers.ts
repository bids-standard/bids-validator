/**
 * BIDS file openers
 *
 * These classes implement stream, text and random bytes access to BIDS resources.
 */
import { retry } from '@std/async'
import { join } from '@std/path'
import { type FileOpener } from '../types/filetree.ts'
import { createUTF8Stream } from './streams.ts'

export class FsFileOpener implements FileOpener {
  path: string
  fileInfo!: Deno.FileInfo

  constructor(datasetPath: string, path: string, fileInfo?: Deno.FileInfo) {
    this.path = join(datasetPath, path)
    if (fileInfo) {
      this.fileInfo = fileInfo
    } else {
      try {
        this.fileInfo = Deno.statSync(this.path)
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
          this.fileInfo = Deno.lstatSync(this.path)
        }
      }
    }
  }

  get size(): number {
    return this.fileInfo.size
  }

  async stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    const handle = await this.open()
    return handle.readable
  }

  /**
   * Read the entire file and decode as utf-8 text
   */
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

  /**
   * Read bytes in a range efficiently from a given file
   *
   * Reads up to size bytes, starting at offset.
   * If EOF is encountered, the resulting array may be smaller.
   */
  async readBytes(size: number, offset = 0): Promise<Uint8Array<ArrayBuffer>> {
    const handle = await this.open()
    const buf = new Uint8Array(size)
    await handle.seek(offset, Deno.SeekMode.Start)
    const nbytes = await handle.read(buf) ?? 0
    await handle.close()
    return buf.subarray(0, nbytes)
  }

  async open(): Promise<Deno.FsFile> {
    return Deno.open(this.path, { read: true, write: false })
  }
}

export class BrowserFileOpener implements FileOpener {
  file: File
  constructor(file: File) {
    this.file = file
  }

  get size(): number {
    return this.file.size
  }

  async stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    return Promise.resolve(this.file.stream() as ReadableStream<Uint8Array<ArrayBuffer>>)
  }

  async text(): Promise<string> {
    return this.file.text()
  }

  async readBytes(size: number, offset = 0): Promise<Uint8Array<ArrayBuffer>> {
    return new Uint8Array(await this.file.slice(offset, size).arrayBuffer())
  }
}

class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(`HTTP Error ${status}: ${message}`)
    this.status = status
  }
}

export class HTTPOpener implements FileOpener {
  url: string
  size: number

  constructor(url: string, size: number = -1) {
    this.url = url
    this.size = size
  }

  async _fetch(options: RequestInit = {}): Promise<Response> {
    // Fetch with retries, for transient errors
    return retry(async () => {
      const response = await fetch(this.url, options)
      if (!response.ok || !response.body) {
        throw new HttpError(response.status, response.statusText)
      }
      return response
    }, {
      isRetriable: (error) => {
        return (
          error instanceof TypeError ||
          error instanceof HttpError && (error.status == 429 || error.status >= 500)
        )
      },
    })
  }

  async stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    // Streams should not timeout
    return this._fetch().then((response) => response.body!)
  }

  async text(): Promise<string> {
    // Timeout after 5 seconds and retry; many connections can result in timeouts
    return await retry(
      () => this._fetch({ signal: AbortSignal.timeout(5000) }).then((response) => response.text()),
      {
        isRetriable: (error) => error instanceof DOMException && error.name === 'TimeoutError',
      },
    )
  }

  async readBytes(size: number, offset = 0): Promise<Uint8Array<ArrayBuffer>> {
    const headers = new Headers()
    headers.append('Range', `bytes=${offset}-${offset + size - 1}`)
    // Timeout after 5 seconds and retry; many connections can result in timeouts
    return await retry(
      () =>
        this._fetch({ headers, signal: AbortSignal.timeout(5000) }).then((response) =>
          response.bytes()
        ),
      {
        isRetriable: (error) => error instanceof DOMException && error.name === 'TimeoutError',
      },
    )
  }
}

export class NullFileOpener implements FileOpener {
  size: number
  constructor(size = 0) {
    this.size = size
  }
  stream = async () =>
    new ReadableStream({
      start(controller) {
        controller.close()
      },
    })
  text = async () => ''
  readBytes = async (size: number, offset?: number) => new Uint8Array()
}
