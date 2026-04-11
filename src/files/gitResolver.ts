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
import { default as git } from 'isomorphic-git'
import type { ParsedTreeObject, ReadObjectResult } from 'isomorphic-git'
import type { BIDSFile, SymlinkReason, UnresolvedLink } from '../types/filetree.ts'
import type { GitOptions } from './git.ts'
import type { FileIgnoreRules } from './ignore.ts'

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

// Segment-aware resolver. Filled in by Task 3.
export function resolveSymlink(
  _originalPath: string,
  _target: string,
  _source: TreeSource,
  _budget: FollowBudget,
  _prune?: FileIgnoreRules,
): Promise<ResolveVerdict> {
  return Promise.reject(new Error('resolveSymlink: not implemented yet'))
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
