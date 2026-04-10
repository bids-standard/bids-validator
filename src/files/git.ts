/**
 * Git file opener and tree reader
 *
 * Implements FileOpener for files stored in a git repository,
 * using isomorphic-git to lazily load blob content, and provides
 * readGitTree() to walk a ref and build a FileTree.
 */
import { default as git, TREE } from 'isomorphic-git'
import type { WalkerEntry } from 'isomorphic-git'
import fs from 'node:fs'
import * as posix from '@std/path/posix'
import { join } from '@std/path'
import {
  BIDSFile,
  type FileOpener,
  type FileTree,
  type SymlinkReason,
  type UnresolvedLink,
} from '../types/filetree.ts'
import { filesToTree, loadBidsIgnore } from './filetree.ts'
import { FileIgnoreRules } from './ignore.ts'
import { hashDirLower, parseAnnexKey, resolveAnnexedFile } from './repo.ts'
import { FsFileOpener, HTTPOpener, NullFileOpener } from './openers.ts'
import { streamFromUint8Array } from './streams.ts'

export interface GitOptions {
  // deno-lint-ignore no-explicit-any
  fs: any
  gitdir: string
  cache: object
}

export class GitFileOpener implements FileOpener {
  oid: string
  size: number
  gitOptions: GitOptions
  #blob: Uint8Array<ArrayBuffer> | undefined

  constructor(oid: string, size: number, gitOptions: GitOptions) {
    this.oid = oid
    this.size = size
    this.gitOptions = gitOptions
  }

  async #loadBlob(): Promise<Uint8Array<ArrayBuffer>> {
    if (this.#blob === undefined) {
      const { blob } = await git.readBlob({ oid: this.oid, ...this.gitOptions })
      this.#blob = blob as Uint8Array<ArrayBuffer>
    }
    return this.#blob
  }

  async stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    const blob = await this.#loadBlob()
    return streamFromUint8Array(blob)
  }

  async text(): Promise<string> {
    const blob = await this.#loadBlob()
    return new TextDecoder().decode(blob)
  }

  async readBytes(size: number, offset = 0): Promise<Uint8Array<ArrayBuffer>> {
    const blob = await this.#loadBlob()
    return blob.slice(offset, offset + size) as Uint8Array<ArrayBuffer>
  }
}

/**
 * FileOpener for git-annex managed files.
 *
 * On first content access, resolves a delegate opener by:
 *   1. Checking for a locally present annex object at
 *      {gitdir}/annex/objects/{hashDirLower}/{key}/{key}
 *   2. Falling back to resolveAnnexedFile() to obtain an HTTP URL
 *   3. Using NullFileOpener if neither is available
 *
 * Size is set from the annex key's embedded `s` field.
 */
export class AnnexedGitFileOpener implements FileOpener {
  size: number
  #key: string
  #gitOptions: GitOptions
  #preferredRemote: string | undefined
  #delegate: FileOpener | undefined

  constructor(
    key: string,
    size: number,
    gitOptions: GitOptions,
    preferredRemote?: string,
  ) {
    this.#key = key
    this.size = size
    this.#gitOptions = gitOptions
    this.#preferredRemote = preferredRemote
  }

  async #resolve(): Promise<FileOpener> {
    if (this.#delegate !== undefined) {
      return this.#delegate
    }

    // 1. Try local annex object store
    const [h0, h1] = await hashDirLower(this.#key)
    const localPath = join(
      this.#gitOptions.gitdir,
      'annex',
      'objects',
      h0,
      h1,
      this.#key,
      this.#key,
    )
    try {
      await Deno.stat(localPath)
      this.#delegate = new FsFileOpener('', localPath)
      return this.#delegate
    } catch {
      // Local object not present; fall through to remote resolution
    }

    // 2. Try remote resolution via git-annex metadata
    try {
      const { url } = await resolveAnnexedFile(this.#key, this.#preferredRemote, this.#gitOptions)
      this.#delegate = new HTTPOpener(url, this.size)
      return this.#delegate
    } catch {
      // No accessible remote; fall through to null opener
    }

    // 3. Content unavailable
    this.#delegate = new NullFileOpener(this.size)
    return this.#delegate
  }

  async stream(): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    return (await this.#resolve()).stream()
  }

  async text(): Promise<string> {
    return (await this.#resolve()).text()
  }

  async readBytes(size: number, offset = 0): Promise<Uint8Array<ArrayBuffer>> {
    return (await this.#resolve()).readBytes(size, offset)
  }
}

const MAX_SYMLINK_DEPTH = 10

type SymlinkResolution =
  | { kind: 'file'; opener: GitFileOpener | AnnexedGitFileOpener }
  | { kind: 'unresolved'; reason: SymlinkReason }

/**
 * Resolve a target path relative to a directory inside a git tree.
 *
 * Walks segments explicitly so we can distinguish paths that would escape
 * the repository root from paths that stay inside. Returns null for
 * absolute targets or any relative target that pops above index 0.
 */
function resolveInTree(dir: string, target: string): string | null {
  if (target.startsWith('/')) return null
  const joined = (dir ? dir.split('/') : []).concat(target.split('/'))
  const out: string[] = []
  for (const seg of joined) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') {
      if (out.length === 0) return null
      out.pop()
    } else {
      out.push(seg)
    }
  }
  return out.join('/')
}

/**
 * Walk prefixes of a resolved path looking for a gitlink entry (submodule).
 * Returns true as soon as any prefix tree contains an entry matching the
 * next segment with type 'commit'. Returns false if the walk completes
 * without seeing a gitlink, or if any prefix lookup itself throws.
 */
async function ancestorIsSubmodule(
  resolvedPath: string,
  commitOid: string,
  gitOptions: GitOptions,
): Promise<boolean> {
  const segments = resolvedPath.split('/').filter((s) => s !== '')
  let prefix = ''
  for (const segment of segments) {
    try {
      const parentObj = await git.readObject({
        oid: commitOid,
        filepath: prefix,
        ...gitOptions,
      })
      if (parentObj.type !== 'tree') return false
      // The tree type exposes `entries` as an array of { mode, path, oid, type }.
      // deno-lint-ignore no-explicit-any
      const entries = (parentObj as unknown as { object: { entries: any[] } }).object.entries
      const match = entries.find((e: { path: string }) => e.path === segment)
      if (!match) return false
      if (match.type === 'commit') return true
      if (match.type !== 'tree') return false
      prefix = prefix === '' ? segment : `${prefix}/${segment}`
    } catch {
      return false
    }
  }
  return false
}

/**
 * Resolve a non-annex symlink within the git tree.
 *
 * Returns a file opener for in-tree blob targets, an annex opener when the
 * chain terminates in an annex key, or an unresolved verdict with a reason
 * code for broken, cyclic, out-of-tree, submodule-traversing, or
 * directory-target symlinks.
 */
async function resolveSymlinkInTree(
  filepath: string,
  target: string,
  commitOid: string,
  gitOptions: GitOptions,
  symlinkMap: Map<string, string>,
  preferredRemote?: string,
): Promise<SymlinkResolution> {
  let currentTarget = target
  let currentDir = posix.dirname(filepath)

  for (let depth = 0; depth < MAX_SYMLINK_DEPTH; depth++) {
    const resolvedPath = resolveInTree(currentDir, currentTarget)
    if (resolvedPath === null) {
      return { kind: 'unresolved', reason: 'out-of-tree' }
    }

    const nextTarget = symlinkMap.get(resolvedPath)
    if (nextTarget !== undefined) {
      const annexParsed = parseAnnexKey(nextTarget)
      if (annexParsed !== null) {
        return {
          kind: 'file',
          opener: new AnnexedGitFileOpener(
            annexParsed.key,
            annexParsed.size,
            gitOptions,
            preferredRemote,
          ),
        }
      }
      currentDir = posix.dirname(resolvedPath)
      currentTarget = nextTarget
      continue
    }

    let obj: Awaited<ReturnType<typeof git.readObject>>
    try {
      obj = await git.readObject({
        oid: commitOid,
        filepath: resolvedPath,
        ...gitOptions,
      })
    } catch {
      if (await ancestorIsSubmodule(resolvedPath, commitOid, gitOptions)) {
        return { kind: 'unresolved', reason: 'submodule' }
      }
      return { kind: 'unresolved', reason: 'broken' }
    }

    if (obj.type === 'tree') {
      return { kind: 'unresolved', reason: 'directory-unsupported' }
    }
    if (obj.type === 'blob') {
      const { blob } = await git.readBlob({ oid: obj.oid, ...gitOptions })
      return {
        kind: 'file',
        opener: new GitFileOpener(obj.oid, blob.length, gitOptions),
      }
    }
    return { kind: 'unresolved', reason: 'broken' }
  }

  return { kind: 'unresolved', reason: 'cycle' }
}

/**
 * Walk a git ref and build a FileTree from all blobs found.
 *
 * Uses isomorphic-git walk() with TREE to enumerate files at the given ref,
 * creates BIDSFile objects backed by GitFileOpener, and assembles via filesToTree().
 */
export async function readGitTree(
  repoPath: string,
  ref: string = 'HEAD',
  prune?: FileIgnoreRules,
  preferredRemote?: string,
): Promise<FileTree> {
  const cache = {}
  const ignore = new FileIgnoreRules([])

  // Detect gitdir: if repoPath contains .git, use it; otherwise treat as bare
  const dotGitPath = join(repoPath, '.git')
  let gitdir: string
  try {
    const stat = Deno.statSync(dotGitPath)
    gitdir = stat.isDirectory ? dotGitPath : repoPath
  } catch {
    gitdir = repoPath
  }

  const gitOptions: GitOptions = { fs, gitdir, cache }

  // Validate the repo and resolve the requested ref, with clear error messages.
  // We always resolve HEAD first so we can distinguish three cases:
  //   1. Path is not a git repo at all (NotGitRepository)
  //   2. Repo exists but has no commits (HEAD → NotFoundError)
  //   3. Repo has commits but the requested ref doesn't exist
  let resolvedOid: string
  try {
    await git.resolveRef({ ref: 'HEAD', ...gitOptions })
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === 'NotGitRepository') {
      throw new Error(`${repoPath} is not a git repository`)
    }
    throw new Error(`Repository ${repoPath} has no commits`)
  }
  try {
    resolvedOid = await git.resolveRef({ ref, ...gitOptions })
  } catch {
    // resolveRef doesn't handle abbreviated SHAs; try expandOid
    try {
      resolvedOid = await git.expandOid({ oid: ref, ...gitOptions })
    } catch {
      throw new Error(`Could not resolve ref '${ref}' in ${repoPath}`)
    }
  }

  const files: BIDSFile[] = []

  // Map of all symlinks found during the walk (filepath → target)
  // Used to follow chains of symlinks during deferred resolution
  const symlinkMap = new Map<string, string>()
  // Deferred symlink entries that need resolution after the walk completes
  const deferredSymlinks: { filepath: string; target: string }[] = []

  try {
    await git.walk({
      ...gitOptions,
      trees: [TREE({ ref: resolvedOid })],
      map: async (filepath: string, [entry]: Array<WalkerEntry | null>) => {
        if (!entry) return null

        const entryType = await entry.type()

        // TODO: Handle submodules (entryType === 'commit')
        if (entryType === 'commit') return null

        // Directories
        if (entryType === 'tree') {
          // The root entry '.' must always be walked
          if (filepath === '.') return undefined
          // Null prevents walk from descending
          if (prune && prune.test('/' + filepath)) return null
          return undefined
        }

        // Only process blobs
        if (entryType !== 'blob') return null

        // Prune check for files
        if (prune && prune.test('/' + filepath)) return null

        const oid = await entry.oid()
        const mode = await entry.mode()
        // TODO: Patch isomorphic-git to retrieve size from index
        const content = await entry.content()
        const size = content ? content.length : 0

        const bidsPath = '/' + filepath
        let opener: GitFileOpener | AnnexedGitFileOpener
        if (mode === 0o120000 && content) {
          // Symlink: blob content is the symlink target path
          const target = new TextDecoder().decode(content)
          // Record all symlinks so chain resolution can follow through them
          symlinkMap.set(filepath, target)
          const annexParsed = parseAnnexKey(target)
          if (annexParsed !== null) {
            opener = new AnnexedGitFileOpener(
              annexParsed.key,
              annexParsed.size,
              gitOptions,
              preferredRemote,
            )
          } else {
            // Non-annex symlink — defer resolution until walk completes
            deferredSymlinks.push({ filepath, target })
            return filepath
          }
        } else {
          opener = new GitFileOpener(oid, size, gitOptions)
        }
        const file = new BIDSFile(bidsPath, opener, ignore)
        files.push(file)

        return filepath
      },
    })
  } catch (err: unknown) {
    throw new Error(
      `Ref '${ref}' does not resolve to a commit or tree in ${repoPath}`,
      { cause: err },
    )
  }

  const unresolvedLinks: UnresolvedLink[] = []

  for (const { filepath, target } of deferredSymlinks) {
    const result = await resolveSymlinkInTree(
      filepath,
      target,
      resolvedOid,
      gitOptions,
      symlinkMap,
      preferredRemote,
    )
    if (result.kind === 'file') {
      files.push(new BIDSFile('/' + filepath, result.opener, ignore))
    } else {
      unresolvedLinks.push({
        path: '/' + filepath,
        target,
        reason: result.reason,
      })
    }
  }

  return loadBidsIgnore(filesToTree(files, ignore, unresolvedLinks), ignore)
}
