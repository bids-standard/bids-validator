import { basename } from '@std/path'
import { FileIgnoreRules } from '../files/ignore.ts'

export interface FileOpener {
  size: number
  stream: () => Promise<ReadableStream<Uint8Array<ArrayBuffer>>>
  text: () => Promise<string>
  readBytes: (size: number, offset?: number) => Promise<Uint8Array<ArrayBuffer>>
}

export class BIDSFile {
  name: string
  path: string
  #parent!: WeakRef<FileTree>
  viewed: boolean = false
  #ignore: FileIgnoreRules | boolean
  opener: FileOpener

  constructor(
    path: string,
    opener: FileOpener,
    ignore?: FileIgnoreRules | boolean,
    parent?: FileTree,
  ) {
    this.path = path
    this.name = basename(path)
    if (this.path.endsWith('/')) {
      this.name = `${this.name}/`
    }
    this.#ignore = ignore ?? false
    this.opener = opener
    this.parent = parent ?? new FileTree('', '/', undefined)
  }

  get parent(): FileTree {
    return this.#parent.deref() as FileTree
  }

  set parent(tree: FileTree) {
    this.#parent = new WeakRef(tree)
  }

  get ignored(): boolean {
    if (typeof this.#ignore === 'boolean') return this.#ignore
    return this.#ignore.test(this.path)
  }

  get size(): number {
    return this.opener.size
  }

  async text(): Promise<string> {
    return this.opener.text()
  }

  async readBytes(size: number, offset = 0): Promise<Uint8Array<ArrayBuffer>> {
    return this.opener.readBytes(size, offset)
  }

  async stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    return this.opener.stream()
  }
}

/**
 * Abstract FileTree for all environments (Deno, Browser, Python)
 */
export class FileTree {
  // Relative path to this FileTree location
  path: string
  // Name of this directory level
  name: string
  files: BIDSFile[]
  directories: FileTree[]
  viewed: boolean = false
  #parent?: WeakRef<FileTree>
  #ignore: FileIgnoreRules

  constructor(path: string, name: string, parent?: FileTree, ignore?: FileIgnoreRules) {
    this.path = path
    this.files = []
    this.directories = []
    this.name = name
    this.parent = parent
    this.#ignore = ignore ?? new FileIgnoreRules([])
  }

  get parent(): FileTree | undefined {
    return this.#parent?.deref()
  }

  set parent(tree: FileTree | undefined) {
    this.#parent = tree ? new WeakRef(tree) : undefined
  }

  get ignored(): boolean {
    if (!this.parent) return false
    return this.#ignore.test(this.path)
  }

  _get(parts: string[]): BIDSFile | FileTree | undefined {
    if (parts.length === 0) {
      return undefined
    } else if (parts.length === 1) {
      return this.files.find((x) => x.name === parts[0]) ||
        this.directories.find((x) => x.name === parts[0])
    } else {
      const nextDir = this.directories.find((x) => x.name === parts[0])
      return nextDir?._get(parts.slice(1, parts.length))
    }
  }

  get(path: string): BIDSFile | FileTree | undefined {
    if (path.startsWith('/')) {
      path = path.slice(1)
    }
    return this._get(path.split('/'))
  }

  contains(parts: string[]): boolean {
    const value = this._get(parts)
    return value ? (value.viewed = true) : false
  }
}
