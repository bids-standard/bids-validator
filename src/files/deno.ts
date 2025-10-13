/**
 * Deno specific implementation for reading files
 */
import { basename, join } from '@std/path'
import * as posix from '@std/path/posix'
import { BIDSFile, type FileOpener, FileTree } from '../types/filetree.ts'
import { requestReadPermission } from '../setup/requestPermissions.ts'
import { FileIgnoreRules, readBidsIgnore } from './ignore.ts'
import { FsFileOpener, HTTPOpener } from './openers.ts'
import { resolveAnnexedFile } from './repo.ts'
import fs from 'node:fs'

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

  // Opaque cache for passing to git operations
  const cache = {}

  for await (const dirEntry of Deno.readDir(join(rootPath, relativePath))) {
    const thisPath = posix.join(relativePath, dirEntry.name)
    if (prune.test(thisPath)) {
      continue
    }
    if (dirEntry.isFile || dirEntry.isSymlink) {
      let opener: FileOpener
      const fullPath = join(rootPath, thisPath)
      try {
        const fileInfo = await Deno.stat(fullPath)
        opener = new FsFileOpener(rootPath, thisPath, fileInfo)
      } catch (error) {
        try {
          const { url, size } = await resolveAnnexedFile(fullPath, undefined, { cache, fs })
          opener = new HTTPOpener(url, size)
        } catch (_) {
          throw error
        }
      }
      tree.files.push(new BIDSFile(thisPath, opener, ignore, tree))
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
