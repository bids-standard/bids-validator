/**
 * Deno specific implementation for reading files
 */
import { basename, join } from '@std/path'
import * as posix from '@std/path/posix'
import { type BIDSFile, FileTree } from '../types/filetree.ts'
import { requestReadPermission } from '../setup/requestPermissions.ts'
import { FileIgnoreRules, readBidsIgnore } from './ignore.ts'
import { logger } from '../utils/logger.ts'
import { createUTF8Stream } from './streams.ts'
export { type BIDSFile, FileTree }

/**
 * Deno implementation of BIDSFile
 */
export class BIDSFileDeno implements BIDSFile {
  #ignore: FileIgnoreRules
  name: string
  path: string
  parent: FileTree
  #fileInfo?: Deno.FileInfo
  #datasetAbsPath: string
  viewed: boolean = false

  constructor(datasetPath: string, path: string, ignore?: FileIgnoreRules, parent?: FileTree) {
    this.#datasetAbsPath = datasetPath
    this.path = path
    this.name = basename(path)
    this.#ignore = ignore ?? new FileIgnoreRules([])
    try {
      this.#fileInfo = Deno.statSync(this._getPath())
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        this.#fileInfo = Deno.lstatSync(this._getPath())
      }
    }
    this.parent = parent ?? new FileTree('', '/', undefined)
  }

  private _getPath(): string {
    return join(this.#datasetAbsPath, this.path)
  }

  get size(): number {
    return this.#fileInfo ? this.#fileInfo.size : -1
  }

  get stream(): ReadableStream<Uint8Array> {
    const handle = this.#openHandle()
    return handle.readable
  }

  get ignored(): boolean {
    return this.#ignore.test(this.path)
  }

  /**
   * Read the entire file and decode as utf-8 text
   */
  async text(): Promise<string> {
    const reader = this.stream.pipeThrough(createUTF8Stream()).getReader()
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
    const handle = this.#openHandle()
    const buf = new Uint8Array(size)
    await handle.seek(offset, Deno.SeekMode.Start)
    const nbytes = await handle.read(buf) ?? 0
    handle.close()
    return buf.subarray(0, nbytes)
  }

  /**
   * Return a Deno file handle
   */
  #openHandle(): Deno.FsFile {
    // Avoid asking for write access
    const openOptions = { read: true, write: false }
    return Deno.openSync(this._getPath(), openOptions)
  }
}

async function _readFileTree(
  rootPath: string,
  relativePath: string,
  ignore: FileIgnoreRules,
  prune: FileIgnoreRules,
  parent?: FileTree,
): Promise<FileTree> {
  await requestReadPermission()
  const name = basename(relativePath)
  const tree = new FileTree(relativePath, name, parent, ignore)

  for await (const dirEntry of Deno.readDir(join(rootPath, relativePath))) {
    const thisPath = posix.join(relativePath, dirEntry.name)
    if (prune.test(thisPath)) {
      continue
    }
    if (dirEntry.isFile || dirEntry.isSymlink) {
      const file = new BIDSFileDeno(
        rootPath,
        thisPath,
        ignore,
      )
      file.parent = tree
      tree.files.push(file)
    }
    if (dirEntry.isDirectory) {
      const dirTree = await _readFileTree(
        rootPath,
        thisPath,
        ignore,
        prune,
        tree,
      )
      tree.directories.push(dirTree)
    }
  }
  return tree
}

/**
 * Read in the target directory structure and return a FileTree
 */
export async function readFileTree(
  rootPath: string,
  prune?: FileIgnoreRules,
): Promise<FileTree> {
  prune ??= new FileIgnoreRules([], false)
  const ignore = new FileIgnoreRules([])
  const tree = await _readFileTree(rootPath, '/', ignore, prune)
  const bidsignore = tree.get('.bidsignore')
  if (bidsignore) {
    try {
      ignore.add(await readBidsIgnore(bidsignore as BIDSFile))
    } catch (err) {
      console.log(`Failed to read '.bidsignore' file with the following error:\n${err}`)
    }
  }
  return tree
}
