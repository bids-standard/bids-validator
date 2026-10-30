/**
 * Deno specific implementation for reading files
 */
import { basename, dirname, join, resolve } from '@std/path'
import * as posix from '@std/path/posix'
import { BIDSFile, type FileOpener, FileTree, type SymlinkReason } from '../types/filetree.ts'
import { requestReadPermission } from '../setup/requestPermissions.ts'
import { FileIgnoreRules } from './ignore.ts'
import { loadBidsIgnore } from './filetree.ts'
import { AnnexPointerOpener, FsFileOpener, RejectingFileOpener } from './openers.ts'
import { gitdirFromLink, parseAnnexKey } from './repo.ts'
import { AnnexedGitFileOpener, unlockedFileOpener } from './git.ts'
import { annexIssue, MAX_POINTER_SIZE } from './annexKey.ts'
import fs from 'node:fs'

/**
 * Deno-specific {@link BIDSFile} backed by the local filesystem.
 *
 * Wraps {@link FsFileOpener} so that content is read from disk via
 * `Deno.open`. Use this class (or {@link readFileTree}) when validating
 * datasets on a Deno-accessible filesystem.
 *
 * @param datasetPath - Absolute path to the dataset root on disk.
 * @param path - Dataset-relative POSIX path of the file.
 * @param ignore - Optional ignore rules for this file.
 * @param parent - Parent directory node.
 */
export class BIDSFileDeno extends BIDSFile {
  constructor(datasetPath: string, path: string, ignore?: FileIgnoreRules, parent?: FileTree) {
    super(path, new FsFileOpener(join(datasetPath, path)), ignore, parent)
  }
}

type ReadFileTreeOptions = {
  rootPath: string
  relativePath: string
  ignore: FileIgnoreRules
  prune: FileIgnoreRules
  parent?: FileTree
  preferredRemote?: string
  /** Builds the opener for a file found to hold an annex pointer. */
  onPointer: (key: string, size: number) => FileOpener
  /**
   * Per-dataset isomorphic-git cache, shared across the entire walk so that
   * pack-file inflation is amortised across all annex pointers we encounter.
   * One cache per gitdir.
   */
  gitCaches?: Map<string, object>
}

function getGitCache(caches: Map<string, object>, gitdir: string): object {
  let cache = caches.get(gitdir)
  if (cache === undefined) {
    cache = {}
    caches.set(gitdir, cache)
  }
  return cache
}

/**
 * Find the git directory holding a work tree: the first `.git` directory at or
 * above `rootPath`.
 *
 * A `.git` file (a submodule or linked worktree) is not followed.
 */
async function findGitDir(rootPath: string): Promise<string | undefined> {
  let dir = resolve(rootPath)
  while (true) {
    const gitdir = join(dir, '.git')
    try {
      const info = await Deno.stat(gitdir)
      return info.isDirectory ? gitdir : undefined
    } catch (err) {
      // Any other error (e.g. permissions) means we cannot find the repository: report pointers as unavailable
      if (!(err instanceof Deno.errors.NotFound)) return undefined
    }
    const parent = dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
}

async function _readFileTree({
  rootPath,
  relativePath,
  ignore,
  prune,
  parent,
  preferredRemote,
  onPointer,
  gitCaches,
}: ReadFileTreeOptions): Promise<FileTree> {
  await requestReadPermission()
  const name = basename(relativePath)
  const tree = new FileTree(relativePath, name, parent, ignore)

  gitCaches ??= new Map()

  for await (const dirEntry of Deno.readDir(join(rootPath, relativePath))) {
    const thisPath = posix.join(relativePath, dirEntry.name)
    if (prune.test(thisPath, { log: true, prefix: 'Pruned' })) {
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
        const cache = getGitCache(gitCaches, gitdir)
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
      let opener: FileOpener = new FsFileOpener(join(rootPath, thisPath), fileInfo)
      if (opener.size <= MAX_POINTER_SIZE) {
        opener = new AnnexPointerOpener(opener, onPointer)
      }
      tree.files.push(new BIDSFile(thisPath, opener, ignore, tree))
    } else if (isDirectory) {
      const dirTree = await _readFileTree({
        rootPath,
        relativePath: thisPath,
        ignore,
        prune,
        parent: tree,
        preferredRemote,
        onPointer,
        gitCaches,
      })
      tree.directories.push(dirTree)
    }
  }
  return tree
}

/**
 * Recursively walk a local directory and build a {@link FileTree}.
 *
 * Symlinks to git-annex objects are detected and wrapped with
 * {@link AnnexedGitFileOpener}. Broken or cyclic symlinks are recorded
 * as unresolved links on the tree. Regular files of at most 32 KiB are
 * checked for annex pointers when first read.
 *
 * @param rootPath - Absolute path to the dataset root directory.
 * @param prune - Optional rules for directories to skip entirely.
 * @param preferredRemote - Preferred git-annex remote name for fetching
 *   content that is not locally present.
 * @param allowUnlockedData - Read the content of unlocked annex files (small
 *   files committed as pointers) from the repository's annex. Otherwise they
 *   report `UNLOCKED_ANNEX_DATA` when resolved. Content that cannot be found
 *   reports `UNAVAILABLE_ANNEX_DATA`.
 * @returns The root `FileTree` with `.bidsignore` rules applied.
 */
export async function readFileTree(
  rootPath: string,
  prune?: FileIgnoreRules,
  preferredRemote?: string,
  allowUnlockedData = false,
): Promise<FileTree> {
  prune ??= new FileIgnoreRules([], 'prune')
  const ignore = new FileIgnoreRules([])
  const gitCaches = new Map<string, object>()
  const gitdir = allowUnlockedData ? await findGitDir(rootPath) : undefined
  const onPointer = (key: string, size: number): FileOpener => {
    if (!allowUnlockedData) {
      return new RejectingFileOpener(size, annexIssue('UNLOCKED_ANNEX_DATA', key))
    }
    if (gitdir === undefined) {
      return new RejectingFileOpener(size, annexIssue('UNAVAILABLE_ANNEX_DATA', key))
    }
    return unlockedFileOpener(key, size, {
      gitOptions: { fs, gitdir, cache: getGitCache(gitCaches, gitdir) },
      preferredRemote,
      allowUnlockedData: true,
    })
  }
  const tree = await _readFileTree({
    rootPath,
    relativePath: '/',
    ignore,
    prune,
    preferredRemote,
    onPointer,
    gitCaches,
  })
  return loadBidsIgnore(tree, ignore)
}
