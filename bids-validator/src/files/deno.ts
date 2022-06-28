/**
 * Deno specific implementation for reading files
 */
import { join, basename } from '../deps/path.ts'
import { BIDSFile } from '../types/file.ts'
import { FileTree } from '../types/filetree.ts'
import { requestReadPermission } from '../setup/requestPermissions.ts'
import { readBidsIgnore, FileIgnoreRulesDeno } from './ignore.ts'

/**
 * Deno implementation of BIDSFile
 */
export class BIDSFileDeno implements BIDSFile {
  #ignore: FileIgnoreRulesDeno
  name: string
  path: string
  private _fileInfo: Deno.FileInfo | undefined
  private _datasetAbsPath: string

  constructor(datasetPath: string, path: string, ignore: FileIgnoreRulesDeno) {
    this._datasetAbsPath = datasetPath
    this.path = path
    this.name = basename(path)
    this.#ignore = ignore
  }

  private _getPath(): string {
    return join(this._datasetAbsPath, this.path)
  }

  private async _getSize(): Promise<number> {
    if (!this._fileInfo) {
      this._fileInfo = await Deno.stat(this._getPath())
    }
    return this._fileInfo.size
  }

  get size(): Promise<number> {
    return this._getSize()
  }

  private async _getStream(): Promise<ReadableStream<Uint8Array>> {
    // Avoid asking for write access
    const openOptions = { read: true, write: false }
    return (await Deno.open(this._getPath(), openOptions)).readable
  }

  get stream(): Promise<ReadableStream<Uint8Array>> {
    return this._getStream()
  }

  get ignored(): boolean {
    return this.#ignore.test(this.path)
  }
}

export class FileTreeDeno extends FileTree {
  // System specific dataset path
  private _datasetRootPath?: string
  constructor(
    path: string,
    name: string,
    parent?: FileTree,
    rootPath?: string,
  ) {
    super(path, name, parent)
    this._datasetRootPath = rootPath
  }
}

export async function _readFileTree(
  rootPath: string,
  relativePath: string,
  ignore: FileIgnoreRulesDeno,
  parent?: FileTreeDeno,
): Promise<FileTree> {
  await requestReadPermission()
  const name = basename(relativePath)
  const tree = new FileTreeDeno(relativePath, name, parent, rootPath)

  for await (const dirEntry of Deno.readDir(join(rootPath, relativePath))) {
    if (dirEntry.isFile) {
      const file = new BIDSFileDeno(
        rootPath,
        join(relativePath, dirEntry.name),
        ignore,
      )
      // For .bidsignore, read in immediately and add the rules
      if (dirEntry.name === '.bidsignore') {
        ignore.add(await readBidsIgnore(file))
      }
      tree.files.push(file)
    }
    if (dirEntry.isDirectory) {
      const dirTree = await _readFileTree(
        rootPath,
        join(relativePath, dirEntry.name),
        ignore,
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
export function readFileTree(rootPath: string): Promise<FileTree> {
  const ignore = new FileIgnoreRulesDeno([])
  return _readFileTree(rootPath, '/', ignore)
}
