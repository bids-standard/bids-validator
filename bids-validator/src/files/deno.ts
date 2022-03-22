/**
 * Deno specific implementation for reading files
 */
import { resolve, join, basename } from '../deps/path.ts'
import { FileTree, BIDSFile } from './filetree.ts'

/**
 * Deno implementation of BIDSFile
 *
 * TODO - Make a stream of file content available
 */
class BIDSFileDeno implements BIDSFile {
  name: string
  private _fileInfo: Deno.FileInfo | undefined

  constructor(name: string) {
    this.name = name
  }

  private async getSize(): Promise<number> {
    if (!this._fileInfo) {
      this._fileInfo = await Deno.stat(this.name)
    }
    return this._fileInfo.size
  }

  get size(): Promise<number> {
    return this.getSize()
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
