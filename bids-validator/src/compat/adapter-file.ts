import { relative, resolve } from '../deps/path.ts'
import { BIDSFile } from '../types/file.ts'

/**
 * File class modeled off browser File for validator
 * implementing only what the validator currently uses.
 */
export class AdapterFile {
  #file: BIDSFile
  #stream: ReadableStream // File contents stream
  name: string // Filename
  path: string // Absolute path
  relativePath: string // Dataset relative path (prefixed /)
  webkitRelativePath: string // Duplicate name for relativePath

  constructor(rootPath: string, file: BIDSFile, stream: ReadableStream) {
    this.#file = file
    this.#stream = stream
    this.name = file.name
    // JS validator expects dataset-dir/contents filenames
    const relativePath = relative(rootPath, file.path)
    this.relativePath = `/${relativePath}`
    this.webkitRelativePath = this.relativePath
    this.path = resolve(rootPath, file.path)
  }

  stream(): ReadableStream {
    return this.#stream
  }

  slice(start: number, end = 0): Blob {
    const size = end - start
    return new Blob([this.#file.readBytes(size, start).buffer])
  }
}
