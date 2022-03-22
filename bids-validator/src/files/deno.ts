/**
 * Deno specific implementation for reading files
 */
import { resolve, join, basename } from '../deps/path.ts'
import { FileTree, BIDSFile } from './filetree.ts'

/**
 * Deno implementation of BIDSFile
 */
export class BIDSFileDeno implements BIDSFile {
  name: string
  ignored: boolean
  private _fileInfo: Deno.FileInfo | undefined

  constructor(name: string) {
    this.name = name
    this.ignored = false
  }

  private async _getSize(): Promise<number> {
    if (!this._fileInfo) {
      this._fileInfo = await Deno.stat(this.name)
    }
    return this._fileInfo.size
  }

  get size(): Promise<number> {
    return this._getSize()
  }

  private async _getStream(): Promise<ReadableStream<Uint8Array>> {
    // Avoid asking for write access
    const openOptions = { read: true, write: false }
    return (await Deno.open(this.name, openOptions)).readable
  }

  get stream(): Promise<ReadableStream<Uint8Array>> {
    return this._getStream()
  }
}

/**
 * Read in the target directory structure and return a FileTree
 */
export async function readFileTree(path: string): Promise<FileTree> {
  const absPath = resolve(Deno.cwd(), path)
  const base = basename(path)
  const tree = new FileTree(absPath, base)
  for await (const dirEntry of Deno.readDir(tree.path)) {
    if (dirEntry.isFile) {
      tree.files.push(new BIDSFileDeno(dirEntry.name))
    }
    if (dirEntry.isDirectory) {
      const dirTree = await readFileTree(join(tree.path, dirEntry.name))
      tree.directories.push(dirTree)
    }
  }
  return tree
}
