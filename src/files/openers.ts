/**
 * BIDS file openers
 *
 * These classes implement stream, text and random bytes access to BIDS resources.
 */
import { retry } from '@std/async'
import type { FileOpener } from '../types/filetree.ts'
import { createUTF8Stream } from './streams.ts'
import { logger } from '../utils/logger.ts'

/**
 * {@link FileOpener} backed by the local Deno filesystem.
 *
 * Uses `Deno.open` for streaming and seeks for random-access reads.
 * Prefer this opener when validating datasets on disk with Deno.
 *
 * @param datasetPath - Absolute path to the dataset root.
 * @param path - Dataset-relative POSIX path of the file.
 * @param fileInfo - Optional pre-fetched `Deno.FileInfo`; if omitted, `stat`
 *   is called synchronously during construction.
 */
export class FsFileOpener implements FileOpener {
  /** Absolute filesystem path to the file (`datasetPath + path`). */
  path: string
  /** Cached `Deno.FileInfo` object. */
  fileInfo!: Deno.FileInfo

  constructor(path: string, fileInfo?: Deno.FileInfo) {
    this.path = path
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

  /** File size in bytes. */
  get size(): number {
    return this.fileInfo.size
  }

  /** Open the file and return its content as a byte stream. */
  async stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    const handle = await this.open()
    return handle.readable
  }

  /** Read the entire file and return it decoded as a UTF-8 string. */
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
   * Read up to `size` bytes starting at `offset`.
   *
   * @param size - Maximum number of bytes to read.
   * @param offset - Byte offset at which to start reading (default `0`).
   */
  async readBytes(size: number, offset = 0): Promise<Uint8Array<ArrayBuffer>> {
    const handle = await this.open()
    const buf = new Uint8Array(size)
    await handle.seek(offset, Deno.SeekMode.Start)
    const nbytes = await handle.read(buf) ?? 0
    await handle.close()
    return buf.subarray(0, nbytes)
  }

  /** Open the underlying file for reading and return the `Deno.FsFile` handle. */
  open(): Promise<Deno.FsFile> {
    return Deno.open(this.path, { read: true, write: false })
  }
}

/**
 * {@link FileOpener} backed by the browser `File` API.
 *
 * Wrap a `File` object obtained from an `<input webkitdirectory>` element
 * or a drag-and-drop event to integrate it with the BIDS validator.
 *
 * @param file - A `File` from the browser File API.
 */
export class BrowserFileOpener implements FileOpener {
  /** The underlying browser `File` object. */
  file: File

  constructor(file: File) {
    this.file = file
  }

  /** File size in bytes. */
  get size(): number {
    return this.file.size
  }

  /** Open the file and return its content as a byte stream. */
  stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    return Promise.resolve(this.file.stream() as ReadableStream<Uint8Array<ArrayBuffer>>)
  }

  /** Read the entire file and return it decoded as a UTF-8 string. */
  text(): Promise<string> {
    return this.file.text()
  }

  /**
   * Read up to `size` bytes starting at `offset`.
   *
   * @param size - Maximum number of bytes to read.
   * @param offset - Byte offset at which to start reading (default `0`).
   */
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

/**
 * {@link FileOpener} that fetches content over HTTP with automatic retries.
 *
 * @param url - The URL to fetch content from.
 * @param size - Known file size in bytes, or `-1` if unknown.
 */
export class HTTPOpener implements FileOpener {
  /** The URL from which content is fetched. */
  url: string
  /** Declared file size in bytes; `-1` when the size is not known in advance. */
  size: number

  constructor(url: string, size: number = -1) {
    this.url = url
    this.size = size
  }

  _fetch(options: RequestInit = {}): Promise<Response> {
    // Fetch with retries, for transient errors
    return retry(async () => {
      const response = await fetch(this.url, options)
      if (!response.ok || !response.body) {
        throw new HttpError(response.status, response.statusText)
      }
      return response
    }, {
      isRetriable: (error) => {
        logger.info(`Failed to fetch ${this.url}: ${error}, retrying`)
        return (
          error instanceof TypeError ||
          error instanceof HttpError && (error.status == 429 || error.status >= 500)
        )
      },
    })
  }

  /** Open the file and return its content as a byte stream. */
  stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    // Streams should not timeout
    return this._fetch().then((response) => response.body!)
  }

  /**
   * Read the entire file and return it decoded as a UTF-8 string.
   *
   * Applies a 5-second timeout per attempt and retries on `TimeoutError`.
   */
  async text(): Promise<string> {
    // Timeout after 5 seconds and retry; many connections can result in timeouts
    return await retry(
      () => this._fetch({ signal: AbortSignal.timeout(5000) }).then((response) => response.text()),
      {
        isRetriable: (error) => error instanceof DOMException && error.name === 'TimeoutError',
      },
    )
  }

  /**
   * Read up to `size` bytes starting at `offset`.
   *
   * Applies a 5-second timeout per attempt and retries on `TimeoutError`.
   *
   * @param size - Maximum number of bytes to read.
   * @param offset - Byte offset at which to start reading (default `0`).
   */
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

/**
 * No-op {@link FileOpener} that returns empty content.
 *
 * Used as a placeholder when file content is unavailable (e.g. an
 * unresolvable git-annex object).
 *
 * @param size - Reported file size; defaults to `0`.
 */
export class NullFileOpener implements FileOpener {
  /** Declared file size reported to callers; content returned is always empty. */
  size: number
  constructor(size = 0) {
    this.size = size
  }
  stream = (): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> =>
    Promise.resolve(
      new ReadableStream({
        start(controller) {
          controller.close()
        },
      }),
    )
  text = (): Promise<string> => Promise.resolve('')
  readBytes = (_size: number, _offset?: number): Promise<Uint8Array<ArrayBuffer>> =>
    Promise.resolve(new Uint8Array())
}
