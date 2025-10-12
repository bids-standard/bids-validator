/**
 * Deno specific implementation for reading files
 */
import { basename, join } from '@std/path'
import * as posix from '@std/path/posix'
import { BIDSFile, FileTree } from '../types/filetree.ts'
import { requestReadPermission } from '../setup/requestPermissions.ts'
import { FileIgnoreRules, readBidsIgnore } from './ignore.ts'
import { FsFileOpener } from './openers.ts'

export class BIDSFileDeno extends BIDSFile {
  constructor(datasetPath: string, path: string, ignore?: FileIgnoreRules, parent?: FileTree) {
    super(path, new FsFileOpener(datasetPath, path), ignore, parent)
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
      const file = new BIDSFile(
        thisPath,
        new FsFileOpener(rootPath, thisPath),
        ignore,
        tree,
      )
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
