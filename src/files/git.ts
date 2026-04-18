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
import { graftTree, MAX_SYMLINK_FOLLOWS, resolveSymlink } from './gitResolver.ts'
import type { FollowBudget, GitOptions, TreeSource } from './gitResolver.ts'

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
      const fileInfo = await Deno.stat(localPath)
      this.#delegate = new FsFileOpener('', localPath, fileInfo)
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

/**
 * Find the gitdir for a repository path, and resolve the requested ref to a commit OID.
 */
async function resolveRef(
  repoPath: string,
  ref: string,
): Promise<{ commit: string; gitOptions: GitOptions }> {
  const dotGitPath = join(repoPath, '.git')
  let gitdir: string
  try {
    const stat = await Deno.stat(dotGitPath)
    gitdir = stat.isDirectory ? dotGitPath : repoPath
  } catch {
    gitdir = repoPath
  }

  const gitOptions: GitOptions = { fs, gitdir, cache: {} }

  // Resolve HEAD to verify this is a git repository and it has commits.
  try {
    const head = await git.resolveRef({ ref: 'HEAD', ...gitOptions })
    if (ref === 'HEAD') {
      return { commit: head, gitOptions }
    }
  } catch {
    throw new Error(`Repository ${repoPath} is not a git repository or has no commits`)
  }

  // Now resolve the requested ref, which may be a branch, tag, or commit SHA
  try {
    return { commit: await git.resolveRef({ ref, ...gitOptions }), gitOptions }
  } catch {
    // resolveRef doesn't handle abbreviated SHAs; try expandOid
    try {
      return { commit: await git.expandOid({ oid: ref, ...gitOptions }), gitOptions }
    } catch {
      throw new Error(`Could not resolve ref '${ref}' in ${repoPath}`)
    }
  }
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
  const { commit, gitOptions } = await resolveRef(repoPath, ref)

  const ignore = new FileIgnoreRules([])
  const files: BIDSFile[] = []
  const symlinkMap = new Map<string, string>()
  const deferredSymlinks: { filepath: string; target: string }[] = []

  try {
    await git.walk({
      ...gitOptions,
      trees: [TREE({ ref: commit })],
      map: async (filepath: string, [entry]: Array<WalkerEntry | null>) => {
        if (!entry) return null

        const entryType = await entry.type()

        // TODO: Handle submodules
        // if (entryType === 'commit') {}

        // Directories
        if (entryType === 'tree') {
          // Null prevents walk from descending, anything but root may be pruned
          return filepath !== '.' && prune?.test('/' + filepath) ? null : undefined
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
          const { key, size } = parseAnnexKey(target) ?? {} as { key?: string; size: number }
          if (key) {
            opener = new AnnexedGitFileOpener(key, size, gitOptions, preferredRemote)
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

  const source: TreeSource = { commitOid: commit, gitOptions, symlinkMap, preferredRemote }
  const unresolvedLinks: UnresolvedLink[] = []

  for (const { filepath, target } of deferredSymlinks) {
    const budget: FollowBudget = { remaining: MAX_SYMLINK_FOLLOWS }
    const verdict = await resolveSymlink(filepath, target, source, budget)

    if (verdict.kind === 'tree') {
      const graft = await graftTree('/' + filepath, verdict, budget, new Set(), prune)
      files.push(...graft.files)
      unresolvedLinks.push(...graft.links)
      continue
    }
    // Identify files and failures
    const outcome = ((): FileOpener | SymlinkReason => {
      switch (verdict.kind) {
        case 'file-blob':
          return new GitFileOpener(verdict.oid, verdict.size, verdict.source.gitOptions)
        case 'annex': {
          const { key, size, source: { gitOptions, preferredRemote } } = verdict
          return new AnnexedGitFileOpener(key, size, gitOptions, preferredRemote)
        }
        case 'submodule-boundary':
          return 'submodule'
        case 'unresolved':
          return verdict.reason
        // deno-coverage-ignore-start
        default: {
          const _exhaustive: never = verdict
          throw new Error(`Unhandled ResolveVerdict kind: ${(verdict as { kind: string }).kind}`)
          // deno-coverage-ignore-stop
        }
      }
    })()
    // Record files and failures
    if (typeof outcome !== 'string') {
      files.push(new BIDSFile('/' + filepath, outcome, ignore))
    } else {
      unresolvedLinks.push({ path: '/' + filepath, target, reason: outcome })
    }
  }

  return loadBidsIgnore(filesToTree(files, ignore, unresolvedLinks), ignore)
}
