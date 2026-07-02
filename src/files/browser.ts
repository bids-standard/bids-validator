import { BIDSFile, FileTree } from '../types/filetree.ts'
import { filesToTree, loadBidsIgnore } from './filetree.ts'
import { FileIgnoreRules } from './ignore.ts'
import { BrowserFileOpener } from './openers.ts'

/**
 * Browser-specific {@link BIDSFile} wrapping the native `File` API.
 *
 * Backed by {@link BrowserFileOpener}. Use {@link fileListToTree} to
 * convert a full `File[]` from `<input webkitdirectory>` into a
 * {@link FileTree} ready for validation; this class is rarely constructed
 * directly.
 *
 * @param file - A `File` obtained from an `<input webkitdirectory>` element.
 * @param ignore - Ignore rules for this file.
 * @param parent - Parent directory node.
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
 * Convert a browser `File[]` (from `<input webkitdirectory>`) into a
 * {@link FileTree} suitable for validation.
 *
 * @param files - Files selected via the browser file picker.
 * @returns The root `FileTree` with `.bidsignore` rules applied.
 */
export function fileListToTree(
  files: File[],
  prune?: FileIgnoreRules,
): Promise<FileTree> {
  prune ??= new FileIgnoreRules([], 'prune')
  const ignore = new FileIgnoreRules([])
  const root = new FileTree('/', '/', undefined)
  return loadBidsIgnore(
    filesToTree(
      files.map((f) => new BIDSFileBrowser(f, ignore, root))
        .filter((f) => !prune.test(f.path)),
      ignore,
    ),
    ignore,
  )
}
