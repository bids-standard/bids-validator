import { basename } from '@std/path'
import { FileIgnoreRules } from '../files/ignore.ts'

/** Contract for reading file content as a stream, text, or byte slice. */
export interface FileOpener {
  size: number
  stream: () => Promise<ReadableStream<Uint8Array<ArrayBuffer>>>
  text: () => Promise<string>
  readBytes: (size: number, offset?: number) => Promise<Uint8Array<ArrayBuffer>>
}

/** Reason a symlink could not be resolved during tree construction. */
export type SymlinkReason =
  | 'broken'
  | 'cycle'
  | 'submodule'
  | 'out-of-tree'

/** A symlink that could not be followed, with the reason it was skipped. */
export interface UnresolvedLink {
  path: string
  target: string
  reason: SymlinkReason
}

/**
 * A single file in a BIDS dataset.
 *
 * Wraps a {@link FileOpener} that provides lazy access to the file's
 * content. The `parent` property is held via `WeakRef` so that a file
 * does not prevent its containing {@link FileTree} from being collected.
 *
 * @param path - Dataset-relative POSIX path (e.g. `"/sub-01/anat/sub-01_T1w.nii.gz"`).
 * @param opener - Provides `stream`, `text`, and `readBytes` access.
 * @param ignore - Ignore rules or a boolean override for this file.
 * @param parent - The directory node that contains this file.
 */
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

  text(): Promise<string> {
    return this.opener.text()
  }

  readBytes(size: number, offset = 0): Promise<Uint8Array<ArrayBuffer>> {
    return this.opener.readBytes(size, offset)
  }

  stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    return this.opener.stream()
  }
}

/**
 * Directory node in a BIDS dataset tree.
 *
 * Works across all environments (Deno, browser, git). The `parent`
 * property is held via `WeakRef` to avoid preventing garbage collection of
 * ancestor nodes.
 *
 * @param path - Dataset-relative POSIX path of this directory.
 * @param name - The directory's own name (final path component).
 * @param parent - Parent directory node, if any.
 * @param ignore - Ignore rules applied when testing paths under this tree.
 */
export class FileTree {
  // Relative path to this FileTree location
  path: string
  // Name of this directory level
  name: string
  files: BIDSFile[]
  directories: FileTree[]
  links: UnresolvedLink[]
  viewed: boolean = false
  #parent?: WeakRef<FileTree>
  #ignore: FileIgnoreRules

  constructor(path: string, name: string, parent?: FileTree, ignore?: FileIgnoreRules) {
    this.path = path
    this.files = []
    this.directories = []
    this.links = []
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

  isPathIgnored(path: string): boolean {
    return this.#ignore.test(path)
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

  /**
   * Test whether a path exists in this tree.
   *
   * Side-effect: sets `viewed = true` on the matched node so that
   * validators can later detect unreferenced files.
   *
   * @param parts - Path segments to look up (e.g. `['sub-01', 'anat', 'sub-01_T1w.nii.gz']`).
   * @returns `true` if the path resolves to a file or directory.
   */
  contains(parts: string[]): boolean {
    const value = this._get(parts)
    return value ? (value.viewed = true) : false
  }
}
