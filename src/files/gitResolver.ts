/**
 * Symlink resolver and directory graft walker for the git-tree backend.
 *
 * This module walks symlink targets segment-by-segment using Unix
 * physical-path semantics and produces verdicts that src/files/git.ts
 * dispatches on. Directory-valued verdicts feed the graft walker, which
 * recursively mounts target subtrees at symlink paths.
 *
 * Cycle detection uses two complementary guards:
 *   - a shared per-resolution follow budget (chain cycles)
 *   - a per-top-level-graft visited set of directory-symlink paths
 *     currently on the recursion stack (structural graft cycles)
 *
 * See docs/dev/discussion/2026-04-git_directory_symlink_grafting.md for
 * the full design.
 */
import * as posix from '@std/path/posix'
import { default as git } from 'isomorphic-git'
import type { FsClient, ParsedTreeObject, ReadObjectResult } from 'isomorphic-git'
import type { BIDSFile, SymlinkReason, UnresolvedLink } from '../types/filetree.ts'
import type { FileIgnoreRules } from './ignore.ts'
import { parseAnnexKey } from './repo.ts'

export interface GitOptions {
  fs: FsClient
  gitdir: string
  cache: object
}

export interface TreeSource {
  readonly commitOid: string
  readonly gitOptions: GitOptions
  readonly symlinkMap: ReadonlyMap<string, string>
  readonly preferredRemote?: string
  /** Forward-compatibility for submodule descent. Unused today. */
  readonly parent?: TreeSource
  /** Forward-compatibility for submodule descent. Unused today. */
  readonly children?: ReadonlyMap<string, TreeSource>
}

export interface FollowBudget {
  remaining: number
}

export type ResolveVerdict =
  | { kind: 'file-blob'; oid: string; size: number; source: TreeSource }
  | { kind: 'annex'; key: string; size: number; source: TreeSource }
  | { kind: 'tree'; treePath: string; originalDir: string; source: TreeSource }
  | {
    kind: 'submodule-boundary'
    mountPath: string
    remainder: string
    source: TreeSource
  }
  | { kind: 'unresolved'; reason: SymlinkReason }

export interface GraftResult {
  files: BIDSFile[]
  links: UnresolvedLink[]
}

// The effective type of `readObject` if filename is passed
export type ParsedObject = Extract<ReadObjectResult, { format: 'parsed'; type: 'tree' | 'blob' }>

export const MAX_SYMLINK_FOLLOWS = 10

/**
 * Read a git object by filepath relative to the TreeSource commit.
 *
 * Production path delegates to isomorphic-git's `readObject`. Tests may
 * inject a `__fake` map on gitOptions.cache: when present, it short-circuits
 * the real git call and returns a shaped object from the map.
 */
async function readObjectAt(
  source: TreeSource,
  filepath: string,
): Promise<ParsedObject | null> {
  // deno-lint-ignore no-explicit-any
  const fakeMap = (source.gitOptions.cache as any)?.__fake as Map<string, ParsedObject>
  if (fakeMap) {
    return fakeMap.get(filepath) ?? null
  }
  try {
    return await git.readObject({
      oid: source.commitOid,
      filepath,
      ...source.gitOptions,
    }) as ParsedObject
  } catch {
    return null
  }
}

/**
 * Walk prefixes of a resolved path looking for a gitlink entry (submodule).
 *
 * Returns `{ mountPath, remainder }` on the first prefix whose parent tree
 * contains an entry matching the next segment with type 'commit'. Returns
 * null if the walk completes without seeing a gitlink, if a prefix lookup
 * fails, or if an intermediate segment is not a tree.
 *
 * The remainder is the slash-joined remainder of the path after the mount
 * point (possibly empty if the path itself is the mount).
 */
export async function findSubmoduleAncestor(
  resolvedPath: string,
  source: TreeSource,
): Promise<{ mountPath: string; remainder: string } | null> {
  const segments = resolvedPath.split('/').filter((s) => s !== '')
  let prefix = ''
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const parentObj = await readObjectAt(source, prefix)
    if (!parentObj || parentObj.type !== 'tree') return null
    const match = (parentObj as ParsedTreeObject).object.find((e) => e.path === segment)
    if (!match) return null
    if (match.type === 'commit') {
      const mountPath = prefix === '' ? segment : `${prefix}/${segment}`
      const remainder = segments.slice(i + 1).join('/')
      return { mountPath, remainder }
    }
    if (match.type !== 'tree') return null
    prefix = prefix === '' ? segment : `${prefix}/${segment}`
  }
  return null
}

/**
 * Resolve a symlink target against a TreeSource using Unix physical-path
 * semantics: relative path components are anchored at the directory where
 * the current symlink blob physically lives in the git tree.
 *
 * The resolver walks one segment at a time. On each symlink follow
 * (intermediate or terminal), it decrements the shared `budget`; when the
 * budget hits zero it returns `{ kind: 'unresolved', reason: 'cycle' }`.
 *
 * Note on `prune`: accepted but currently unused in the resolver itself.
 * `prune` is applied by the graft walker at grafted paths. A future
 * optimization may short-circuit resolution for targets that land under a
 * pruned prefix.
 */
export async function resolveSymlink(
  originalPath: string,
  target: string,
  source: TreeSource,
  budget: FollowBudget,
  _prune?: FileIgnoreRules,
): Promise<ResolveVerdict> {
  // Reject absolute targets immediately; the git tree has no OS filesystem root.
  if (target.startsWith('/')) {
    return { kind: 'unresolved', reason: 'out-of-tree' }
  }

  // `accumulated` is the resolved path walked so far (relative to source root).
  // Starts at the dirname of the original symlink: Unix physical-path rule.
  let accumulated = posix.dirname(originalPath)
  if (accumulated === '.') accumulated = ''

  // `segments` is the queue of remaining components from the target string,
  // plus any components pushed onto the front when we follow a chain.
  let segments = target.split('/')

  while (segments.length > 0) {
    const seg = segments.shift() as string
    if (seg === '' || seg === '.') continue
    if (seg === '..') {
      if (accumulated === '') {
        return { kind: 'unresolved', reason: 'out-of-tree' }
      }
      accumulated = posix.dirname(accumulated)
      if (accumulated === '.') accumulated = ''
      continue
    }
    const candidate = accumulated === '' ? seg : `${accumulated}/${seg}`

    // Intermediate or terminal symlink? Consult symlinkMap first.
    const nextTarget = source.symlinkMap.get(candidate)
    if (nextTarget !== undefined) {
      if (budget.remaining <= 0) {
        return { kind: 'unresolved', reason: 'cycle' }
      }
      budget.remaining--

      // Annex keys may only terminate a resolution — annex blobs are opaque
      // content, not directories. If the chain is about to continue into an
      // annex key, treat that as a not-a-directory broken link.
      const annex = parseAnnexKey(nextTarget)
      if (annex !== null) {
        if (segments.length === 0) {
          return { kind: 'annex', source, ...annex }
        }
        return { kind: 'unresolved', reason: 'broken' }
      }

      // Follow: reset accumulated to the dirname of the followed symlink,
      // prepend the new target's segments to whatever remained.
      accumulated = posix.dirname(candidate)
      if (accumulated === '.') accumulated = ''
      segments = [...nextTarget.split('/'), ...segments]
      continue
    }

    // Not a symlink; consult the tree object model.
    const obj = await readObjectAt(source, candidate)
    if (obj === null) {
      const boundary = await findSubmoduleAncestor(posix.join(candidate, ...segments), source)
      if (boundary !== null) {
        return { kind: 'submodule-boundary', source, ...boundary }
      }
      return { kind: 'unresolved', reason: 'broken' }
    }
    if (obj.type === 'blob') {
      if (segments.length > 0) {
        // Blob with more segments to resolve — "not a directory".
        return { kind: 'unresolved', reason: 'broken' }
      }
      return { kind: 'file-blob', oid: obj.oid, size: obj.object.length, source }
    }
    // deno-coverage-ignore-start
    if (obj.type !== 'tree') {
      throw new Error(`Unhandled object type: ${(obj as { type: string }).type}`)
      // deno-coverage-ignore-stop
    }
    accumulated = candidate
  }

  // We've exited the loop without finding a blob, link or missing target
  return {
    kind: 'tree',
    treePath: accumulated,
    originalDir: posix.dirname(originalPath) === '.' ? '' : posix.dirname(originalPath),
    source,
  }
}

// Directory graft walker. Filled in by Task 5.
export function graftTree(
  _graftPath: string,
  _verdict: Extract<ResolveVerdict, { kind: 'tree' }>,
  _budget: FollowBudget,
  _visited: Set<string>,
  _prune?: FileIgnoreRules,
): Promise<GraftResult> {
  return Promise.reject(new Error('graftTree: not implemented yet'))
}
