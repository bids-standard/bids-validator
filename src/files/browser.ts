import { BIDSFile, FileTree } from '../types/filetree.ts'
import { filesToTree, loadBidsIgnore } from './filetree.ts'
import { FileIgnoreRules } from './ignore.ts'
import { BrowserFileOpener } from './openers.ts'

/**
 * Browser implement of BIDSFile wrapping native File/FileList types
 */
export class BIDSFileBrowser extends BIDSFile {
  constructor(file: File, ignore: FileIgnoreRules, parent?: FileTree) {
    const relativePath = file.webkitRelativePath
    const prefixLength = relativePath.indexOf('/')
    const opener = new BrowserFileOpener(file)
    super(relativePath.substring(prefixLength), opener, ignore, parent)
  }
}

/**
 * Convert from FileList (created with webkitDirectory: true) to FileTree for validator use
 */
export function fileListToTree(files: File[]): Promise<FileTree> {
  const ignore = new FileIgnoreRules([])
  const root = new FileTree('/', '/', undefined)
  return loadBidsIgnore(
    filesToTree(files.map((f) => new BIDSFileBrowser(f, ignore, root)), ignore),
    ignore,
  )
}
