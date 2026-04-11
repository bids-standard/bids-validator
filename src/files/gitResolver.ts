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

export const MAX_SYMLINK_FOLLOWS = 10

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
