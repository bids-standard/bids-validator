import { type BIDSFile, FileTree } from '../types/filetree.ts'
import { filesToTree } from './filetree.ts'
import { FileIgnoreRules, readBidsIgnore } from './ignore.ts'
import { parse, SEPARATOR_PATTERN } from '@std/path'
import * as posix from '@std/path/posix'

/**
 * Browser implement of BIDSFile wrapping native File/FileList types
 */
export class BIDSFileBrowser implements BIDSFile {
  #ignore: FileIgnoreRules
  #file: File
  name: string
  path: string
  parent: FileTree
  viewed: boolean = false

  constructor(file: File, ignore: FileIgnoreRules, parent?: FileTree) {
    this.#file = file
    this.#ignore = ignore
    this.name = file.name
    const relativePath = this.#file.webkitRelativePath
    const prefixLength = relativePath.indexOf('/')
    this.path = relativePath.substring(prefixLength)
    this.parent = parent ?? new FileTree('', '/', undefined)
  }

  get size(): number {
    return this.#file.size
  }

  get stream(): ReadableStream<Uint8Array> {
    return this.#file.stream()
  }

  get ignored(): boolean {
    return this.#ignore.test(this.path)
  }

  text(): Promise<string> {
    return this.#file.text()
  }

  async readBytes(size: number, offset = 0): Promise<Uint8Array<ArrayBuffer>> {
    return new Uint8Array(await this.#file.slice(offset, size).arrayBuffer())
  }
}

/**
 * Convert from FileList (created with webkitDirectory: true) to FileTree for validator use
 */
export async function fileListToTree(files: File[]): Promise<FileTree> {
  const ignore = new FileIgnoreRules([])
  const root = new FileTree('/', '/', undefined)
  const tree = filesToTree(files.map((f) => new BIDSFileBrowser(f, ignore, root)), ignore)
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
