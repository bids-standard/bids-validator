/**
 * Cross-backend equivalence tests for symlink handling.
 *
 * Each test builds a real git repository in a temporary directory,
 * commits its contents, then runs BOTH readGitTree() and readFileTree()
 * over the same worktree. assertTreeEquivalent compares the two trees,
 * asserting the same set of file paths, the same per-file content, the
 * same unresolved links (modulo reasons the work tree cannot detect),
 * and the same directory structure.
 *
 * These tests exercise the full path from the segment-aware resolver
 * through graftTree and into the FileTree assembly in git.ts and
 * deno.ts. They are the primary oracle for the grafting work.
 */
import { join } from '@std/path'
import { assertEquals } from '@std/assert'
import { readGitTree } from './git.ts'
import { readFileTree } from './deno.ts'
import { FileIgnoreRules } from './ignore.ts'
import type { BIDSFile, FileTree, SymlinkReason } from '../types/filetree.ts'
import { hasGit, isWindows, run, withRepo } from './utils.test.ts'

/**
 * Shared prune rule for cross-backend tests: excludes the `.git/`
 * metadata directory from the work-tree walk. readGitTree only sees
 * committed blobs and never surfaces `.git/` contents, so readFileTree
 * must be given this prune to produce a comparable tree.
 */
const gitPrune = new FileIgnoreRules(['.git', '.git/**'], false)

function collectFiles(
  tree: FileTree,
  out: Map<string, BIDSFile> = new Map(),
): Map<string, BIDSFile> {
  for (const f of tree.files) out.set(f.path, f)
  for (const d of tree.directories) collectFiles(d, out)
  return out
}

function collectDirPaths(tree: FileTree, out: Set<string> = new Set()): Set<string> {
  out.add(tree.path)
  for (const d of tree.directories) collectDirPaths(d, out)
  return out
}

function collectLinks(
  tree: FileTree,
  out: Array<{ path: string; reason: SymlinkReason }> = [],
): Array<{ path: string; reason: SymlinkReason }> {
  for (const l of tree.links) out.push({ path: l.path, reason: l.reason })
  for (const d of tree.directories) collectLinks(d, out)
  return out
}

interface EquivalenceOptions {
  /** Reasons the work tree legitimately cannot produce; exclude from compare. */
  linkReasonsIgnoredOnFs?: SymlinkReason[]
}

async function assertTreeEquivalent(
  gitTree: FileTree,
  fsTree: FileTree,
  options: EquivalenceOptions = {},
): Promise<void> {
  const gitFiles = collectFiles(gitTree)
  const fsFiles = collectFiles(fsTree)

  const gitPaths = [...gitFiles.keys()].sort()
  const fsPaths = [...fsFiles.keys()].sort()
  assertEquals(gitPaths, fsPaths, 'file paths differ between git and fs trees')

  for (const path of gitPaths) {
    const gitContent = await (gitFiles.get(path) as BIDSFile).text()
    const fsContent = await (fsFiles.get(path) as BIDSFile).text()
    assertEquals(gitContent, fsContent, `content differs for ${path}`)
  }

  const gitDirs = [...collectDirPaths(gitTree)].sort()
  const fsDirs = [...collectDirPaths(fsTree)].sort()
  assertEquals(gitDirs, fsDirs, 'directory structure differs between git and fs trees')

  const ignored = new Set(options.linkReasonsIgnoredOnFs ?? [])
  const gitLinks = collectLinks(gitTree)
    .filter((l) => !ignored.has(l.reason))
    .map((l) => `${l.path}:${l.reason}`)
    .sort()
  const fsLinks = collectLinks(fsTree)
    .filter((l) => !ignored.has(l.reason))
    .map((l) => `${l.path}:${l.reason}`)
    .sort()
  assertEquals(gitLinks, fsLinks, 'unresolved links differ between git and fs trees')
}

Deno.test(
  {
    name: 'cross-backend: basic directory symlink graft',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        await Deno.mkdir(join(repo, 'target'))
        await Deno.writeTextFile(join(repo, 'target', 'a.txt'), 'alpha')
        await Deno.writeTextFile(join(repo, 'target', 'b.txt'), 'bravo')
        await run(['ln', '-s', 'target', join(repo, 'view')])
      },
      async (repo) => {
        const gitTree = await readGitTree(repo, 'HEAD', gitPrune)
        const fsTree = await readFileTree(repo, gitPrune)
        await assertTreeEquivalent(gitTree, fsTree)

        // Sanity: both paths exist and resolve to the same content.
        const viewA = gitTree.get('view/a.txt') as BIDSFile
        const targetA = gitTree.get('target/a.txt') as BIDSFile
        assertEquals(await viewA.text(), 'alpha')
        assertEquals(await targetA.text(), 'alpha')
      },
    )
  },
)

Deno.test(
  {
    name: 'cross-backend: grafted subtree contains nested file symlink with ..',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        // foo.txt lives at the root
        await Deno.writeTextFile(join(repo, 'foo.txt'), 'the-content')
        // target/link.txt is a symlink to "../foo.txt"
        await Deno.mkdir(join(repo, 'target'))
        await run(['ln', '-s', '../foo.txt', join(repo, 'target', 'link.txt')])
        // view -> target/
        await run(['ln', '-s', 'target', join(repo, 'view')])
      },
      async (repo) => {
        const gitTree = await readGitTree(repo, 'HEAD', gitPrune)
        const fsTree = await readFileTree(repo, gitPrune)
        await assertTreeEquivalent(gitTree, fsTree)

        const viewLink = gitTree.get('view/link.txt') as BIDSFile
        assertEquals(await viewLink.text(), 'the-content')
      },
    )
  },
)

Deno.test(
  {
    name: 'cross-backend: grafted subtree contains nested directory symlink',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        await Deno.mkdir(join(repo, 'sibling'))
        await Deno.writeTextFile(join(repo, 'sibling', 'payload.txt'), 'sibling-payload')
        await Deno.mkdir(join(repo, 'target'))
        // target/inner -> ../sibling/ (nested directory symlink inside the graft source)
        await run(['ln', '-s', '../sibling', join(repo, 'target', 'inner')])
        // view -> target/
        await run(['ln', '-s', 'target', join(repo, 'view')])
      },
      async (repo) => {
        const gitTree = await readGitTree(repo, 'HEAD', gitPrune)
        const fsTree = await readFileTree(repo, gitPrune)
        await assertTreeEquivalent(gitTree, fsTree)

        const viewInner = gitTree.get('view/inner/payload.txt') as BIDSFile
        assertEquals(await viewInner.text(), 'sibling-payload')
      },
    )
  },
)

Deno.test(
  {
    name: 'cross-backend: nested broken symlink reports at both original and grafted paths',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        await Deno.mkdir(join(repo, 'target'))
        await Deno.writeTextFile(join(repo, 'target', 'ok.txt'), 'fine')
        // target/orphan -> nonexistent (relative target inside target/)
        await run(['ln', '-s', 'missing.txt', join(repo, 'target', 'orphan')])
        await run(['ln', '-s', 'target', join(repo, 'view')])
      },
      async (repo) => {
        const gitTree = await readGitTree(repo, 'HEAD', gitPrune)
        const fsTree = await readFileTree(repo, gitPrune)
        await assertTreeEquivalent(gitTree, fsTree)

        const allLinks = collectLinks(gitTree).filter((l) => l.reason === 'broken')
        const paths = allLinks.map((l) => l.path).sort()
        assertEquals(paths, ['/target/orphan', '/view/orphan'])
      },
    )
  },
)

export {
  assertTreeEquivalent,
  collectDirPaths,
  collectFiles,
  collectLinks,
  gitPrune,
  hasGit,
  isWindows,
  run,
  withRepo,
}
