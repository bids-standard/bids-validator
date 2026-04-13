/**
 * Deno specific implementation for reading files
 */
import { basename, join } from '@std/path'
import * as posix from '@std/path/posix'
import { BIDSFile, FileTree, type SymlinkReason } from '../types/filetree.ts'
import { requestReadPermission } from '../setup/requestPermissions.ts'
import { FileIgnoreRules } from './ignore.ts'
import { loadBidsIgnore } from './filetree.ts'
import { FsFileOpener } from './openers.ts'
import { gitdirFromLink, parseAnnexKey } from './repo.ts'
import { AnnexedGitFileOpener } from './git.ts'
import fs from 'node:fs'

export class BIDSFileDeno extends BIDSFile {
  constructor(datasetPath: string, path: string, ignore?: FileIgnoreRules, parent?: FileTree) {
    super(path, new FsFileOpener(datasetPath, path), ignore, parent)
  }
}

type ReadFileTreeOptions = {
  rootPath: string
  relativePath: string
  ignore: FileIgnoreRules
  prune: FileIgnoreRules
  parent?: FileTree
  preferredRemote?: string
}

async function _readFileTree({
  rootPath,
  relativePath,
  ignore,
  prune,
  parent,
  preferredRemote,
}: ReadFileTreeOptions): Promise<FileTree> {
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

    // Symlinks are classified here and then fall through to the file or
    // directory branches below via the effective flags computed from stat().
    let { isFile, isDirectory } = dirEntry
    let fileInfo: Deno.FileInfo | undefined

    if (dirEntry.isSymlink) {
      const fullPath = join(rootPath, thisPath)
      const target = await Deno.readLink(fullPath)

      // Annex pointers are identified from the raw target string; no stat needed.
      const annexParsed = parseAnnexKey(target)
      if (annexParsed !== null) {
        const gitdir = gitdirFromLink(fullPath, target)
        const opener = new AnnexedGitFileOpener(
          annexParsed.key,
          annexParsed.size,
          { cache, fs, gitdir },
          preferredRemote,
        )
        tree.files.push(new BIDSFile(thisPath, opener, ignore, tree))
        continue
      }

      try {
        fileInfo = await Deno.stat(fullPath)
      } catch (err) {
        const code = (err as { code?: string }).code
        let reason: SymlinkReason
        if (code === 'ELOOP') {
          reason = 'cycle'
        } else if (code === 'ENOENT') {
          reason = 'broken'
        } else {
          throw err
        }
        tree.links.push({ path: '/' + thisPath.replace(/^\/+/, ''), target, reason })
        continue
      }

      ;({ isFile, isDirectory } = fileInfo)
    }

    if (isFile) {
      const opener = new FsFileOpener(rootPath, thisPath, fileInfo)
      tree.files.push(new BIDSFile(thisPath, opener, ignore, tree))
    } else if (isDirectory) {
      const dirTree = await _readFileTree({
        rootPath,
        relativePath: thisPath,
        ignore,
        prune,
        parent: tree,
        preferredRemote,
      })
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
  preferredRemote?: string,
): Promise<FileTree> {
  prune ??= new FileIgnoreRules([], false)
  const ignore = new FileIgnoreRules([])
  const tree = await _readFileTree({ rootPath, relativePath: '/', ignore, prune, preferredRemote })
  return loadBidsIgnore(tree, ignore)
}
