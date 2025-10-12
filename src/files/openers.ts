/**
 * BIDS file openers
 *
 * These classes implement stream, text and random bytes access to BIDS resources.
 */
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

export class HTTPOpener implements FileOpener {
  url: string
  size: number

  constructor(url: string, size: number = -1) {
    this.url = url
    this.size = size
  }

  async stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    const response = await fetch(this.url)
    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch ${this.url}: ${response.status} ${response.statusText}`)
    }
    return response.body
  }

  async text(): Promise<string> {
    const response = await fetch(this.url)
    return response.text()
  }

  async readBytes(size: number, offset = 0): Promise<Uint8Array<ArrayBuffer>> {
    const headers = new Headers()
    headers.append('Range', `bytes=${offset}-${offset + size - 1}`)
    const response = await fetch(this.url, { headers })
    return new Uint8Array(await response.arrayBuffer())
  }
}
