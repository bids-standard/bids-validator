import { BIDSFile, FileTree } from '../types/filetree.ts'
import { filesToTree } from './filetree.ts'
import { FileIgnoreRules, readBidsIgnore } from './ignore.ts'
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
