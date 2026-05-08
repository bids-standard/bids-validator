import { basename } from '@std/path'
import { FileIgnoreRules } from '../files/ignore.ts'

/**
 * Contract that a custom file source must implement to integrate with
 * the BIDS validator.
 *
 * Implement this interface to add support for a new storage backend
 * (e.g. a cloud object store). Pass an instance to the {@link BIDSFile}
 * constructor as the `opener` argument.
 */
export interface FileOpener {
  /** File size in bytes. */
  size: number
  /** Open the file and return its content as a byte stream. */
  stream: () => Promise<ReadableStream<Uint8Array<ArrayBuffer>>>
  /** Read the entire file and return it decoded as a UTF-8 string. */
  text: () => Promise<string>
  /**
   * Read up to `size` bytes starting at `offset`.
   *
   * @param size - Maximum number of bytes to read.
   * @param offset - Byte offset at which to start reading (default `0`).
   */
  readBytes: (size: number, offset?: number) => Promise<Uint8Array<ArrayBuffer>>
}

/**
 * Reason a symlink could not be resolved during tree construction.
 *
 * - `'broken'` — the symlink target does not exist.
 * - `'cycle'` — following the symlink would produce a cycle (`ELOOP`).
 * - `'submodule'` — the symlink points into a git submodule boundary.
 * - `'out-of-tree'` — the symlink target resolves outside the dataset root.
 */
export type SymlinkReason =
  | 'broken'
  | 'cycle'
  | 'submodule'
  | 'out-of-tree'

/** A symlink that could not be followed, with the reason it was skipped. */
export interface UnresolvedLink {
  /** Dataset-relative POSIX path of the symlink itself. */
  path: string
  /** Raw symlink target as stored on disk or in the git object. */
  target: string
  /** Why the symlink could not be resolved. */
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
  /** Filename component of {@link path} (final path segment). */
  name: string
  /** Dataset-relative POSIX path, e.g. `"/sub-01/anat/sub-01_T1w.nii.gz"`. */
  path: string
  #parent!: WeakRef<FileTree>
  /** `true` after a validator has accessed this file, used to detect unreferenced files. */
  viewed: boolean = false
  #ignore: FileIgnoreRules | boolean
  /** The underlying {@link FileOpener} used to access file content. */
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

  /** The containing directory node; settable to re-parent this file. */
  get parent(): FileTree {
    return this.#parent.deref() as FileTree
  }

  set parent(tree: FileTree) {
    this.#parent = new WeakRef(tree)
  }

  /** `true` when the file's path matches the active ignore rules. */
  get ignored(): boolean {
    if (typeof this.#ignore === 'boolean') return this.#ignore
    return this.#ignore.test(this.path)
  }

  /** File size in bytes, delegated to the underlying {@link FileOpener}. */
  get size(): number {
    return this.opener.size
  }

  /** Read the entire file and return it decoded as a UTF-8 string. */
  text(): Promise<string> {
    return this.opener.text()
  }

  /**
   * Read up to `size` bytes starting at `offset`.
   *
   * @param size - Maximum number of bytes to read.
   * @param offset - Byte offset at which to start reading (default `0`).
   */
  readBytes(size: number, offset = 0): Promise<Uint8Array<ArrayBuffer>> {
    return this.opener.readBytes(size, offset)
  }

  /** Open the file and return its content as a byte stream. */
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
  /** Dataset-relative POSIX path of this directory node. */
  path: string
  // Name of this directory level
  /** Name of this directory (final path component). */
  name: string
  /** Direct file children of this directory node. */
  files: BIDSFile[]
  /** Direct subdirectory children of this directory node. */
  directories: FileTree[]
  /** Symlinks within this directory that could not be resolved. */
  links: UnresolvedLink[]
  /** `true` after a validator has accessed this node, used to detect unreferenced directories. */
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

  /** The parent directory node, or `undefined` for the dataset root. */
  get parent(): FileTree | undefined {
    return this.#parent?.deref()
  }

  set parent(tree: FileTree | undefined) {
    this.#parent = tree ? new WeakRef(tree) : undefined
  }

  /** `true` when this directory's path matches the active ignore rules. */
  get ignored(): boolean {
    if (!this.parent) return false
    return this.#ignore.test(this.path)
  }

  /**
   * Test whether a given path is matched by the ignore rules in effect for
   * this tree.
   *
   * @param path - Dataset-relative path to test.
   * @returns `true` if the path should be ignored.
   */
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

  /**
   * Look up a file or directory by its dataset-relative path.
   *
   * @param path - Dataset-relative path, with or without a leading `/`.
   * @returns The matching {@link BIDSFile} or {@link FileTree}, or `undefined`
   *   if no node with that path exists under this tree.
   */
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
