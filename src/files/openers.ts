/**
 * BIDS file openers
 *
 * These classes implement stream, text and random bytes access to BIDS resources.
 */
import { retry } from '@std/async'
import { IssueError } from '../issues/datasetIssues.ts'
import type { Issue } from '../types/issues.ts'
import type { FileOpener } from '../types/filetree.ts'
import { parseAnnexPointer } from './annexKey.ts'
import { createUTF8Stream, streamFromUint8Array } from './streams.ts'
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
    using handle = await this.open()
    const buf = new Uint8Array(size)
    await handle.seek(offset, Deno.SeekMode.Start)
    const nbytes = await handle.read(buf) ?? 0
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
 * Used as a placeholder for directory pseudo-files, which have no content.
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

/**
 * {@link FileOpener} whose every access rejects with an {@link IssueError}.
 *
 * Used for files with no readable content, such as an unlocked git-annex
 * pointer file.
 *
 * @param size - Reported file size.
 * @param issue - Issue to report; each rejection carries a fresh copy.
 */
export class RejectingFileOpener implements FileOpener {
  /** Reported file size in bytes. */
  size: number
  #issue: Issue

  constructor(size: number, issue: Issue) {
    this.size = size
    this.#issue = issue
  }

  #reject<T>(): Promise<T> {
    return Promise.reject(new IssueError({ ...this.#issue }))
  }

  /** Reject with an {@link IssueError}. */
  resolve(): Promise<void> {
    return this.#reject()
  }

  /** Reject with an {@link IssueError}. */
  stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    return this.#reject()
  }

  /** Reject with an {@link IssueError}. */
  text(): Promise<string> {
    return this.#reject()
  }

  /** Reject with an {@link IssueError}. */
  readBytes(_size: number, _offset?: number): Promise<Uint8Array<ArrayBuffer>> {
    return this.#reject()
  }
}

/** Largest non-pointer file, in bytes, whose content {@link AnnexPointerOpener} keeps for replay */
const REPLAY_MAX_SIZE = 1024

/**
 * {@link FileOpener} that detects git-annex pointer files.
 *
 * The first access calls {@link AnnexPointerOpener.resolve}, which reads the whole
 * file once. If the content is a pointer, `onPointer` builds the opener that serves
 * the annexed content (or rejects), and all reads go to it. Otherwise reads go to
 * `inner`.
 *
 * Files of at most 1 KiB that are not pointers are kept in memory and every read is
 * served from them, since small files dominate datasets and a replay is cheaper than a
 * second filesystem call. Larger files are read again from `inner`, as keeping up to
 * 32 KiB per file could use too much memory.
 *
 * @param inner - Opener for the file as stored.
 * @param onPointer - Builds the opener that replaces `inner` when its content is a pointer,
 *   given the git-annex key and the size of the annexed content.
 */
export class AnnexPointerOpener implements FileOpener {
  #inner: FileOpener
  #onPointer: (key: string, size: number) => FileOpener
  #delegate: FileOpener
  #bytes?: Uint8Array<ArrayBuffer>
  #resolved?: Promise<void>

  constructor(inner: FileOpener, onPointer: (key: string, size: number) => FileOpener) {
    this.#inner = inner
    this.#onPointer = onPointer
    this.#delegate = inner
  }

  /** File size in bytes: that of the annexed content once resolved to a pointer. */
  get size(): number {
    return this.#delegate.size
  }

  /**
   * Read the file once and decide whether it is a pointer.
   *
   * Rejects with the error of `inner`, or of the pointer's opener.
   */
  resolve(): Promise<void> {
    this.#resolved ??= this.#resolve()
    return this.#resolved
  }

  async #resolve(): Promise<void> {
    const bytes = await this.#inner.readBytes(this.#inner.size)
    const pointer = parseAnnexPointer(bytes)
    if (pointer) {
      this.#delegate = this.#onPointer(pointer.key, pointer.size)
      await this.#delegate.resolve?.()
    } else if (bytes.length <= REPLAY_MAX_SIZE) {
      this.#bytes = bytes
    }
  }

  /** Open the content as a byte stream. */
  async stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    await this.resolve()
    return this.#bytes ? streamFromUint8Array(this.#bytes) : this.#delegate.stream()
  }

  /** Read the entire content decoded as a UTF-8 string. */
  async text(): Promise<string> {
    await this.resolve()
    if (!this.#bytes) return this.#delegate.text()
    const reader = streamFromUint8Array(this.#bytes).pipeThrough(createUTF8Stream()).getReader()
    const chunks: string[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) return chunks.join('')
      chunks.push(value)
    }
  }

  /**
   * Read up to `size` bytes starting at `offset`.
   *
   * @param size - Maximum number of bytes to read.
   * @param offset - Byte offset at which to start reading (default `0`).
   */
  async readBytes(size: number, offset = 0): Promise<Uint8Array<ArrayBuffer>> {
    await this.resolve()
    return this.#bytes
      ? this.#bytes.slice(offset, offset + size)
      : this.#delegate.readBytes(size, offset)
  }
}
