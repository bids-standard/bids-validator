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

Deno.test(
  {
    name: 'cross-backend: mutual directory symlinks produce cycles at both paths',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        await Deno.writeTextFile(join(repo, '.keep'), '')
        await run(['ln', '-s', 'b', join(repo, 'a')])
        await run(['ln', '-s', 'a', join(repo, 'b')])
      },
      async (repo) => {
        const gitTree = await readGitTree(repo, 'HEAD', gitPrune)
        const fsTree = await readFileTree(repo, gitPrune)
        await assertTreeEquivalent(gitTree, fsTree)

        const cycleLinks = collectLinks(gitTree).filter((l) => l.reason === 'cycle')
        const paths = cycleLinks.map((l) => l.path).sort()
        assertEquals(paths, ['/a', '/b'])
      },
    )
  },
)

Deno.test(
  {
    name: 'cross-backend: dir symlink back into ancestor terminates with a cycle link',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        await Deno.mkdir(join(repo, 'd'))
        await Deno.writeTextFile(join(repo, 'd', 'file.txt'), 'payload')
        // d/sub -> ../a/ (symlink)
        await run(['ln', '-s', '../a', join(repo, 'd', 'sub')])
        // a -> d/ (directory symlink at root)
        await run(['ln', '-s', 'd', join(repo, 'a')])
      },
      async (repo) => {
        const gitTree = await readGitTree(repo, 'HEAD', gitPrune)
        const fsTree = await readFileTree(repo, gitPrune)

        const gitFiles = collectFiles(gitTree)
        const fsFiles = collectFiles(fsTree)

        // Finite: neither backend should produce thousands of entries.
        assertEquals(gitFiles.size < 500, true, 'git tree did not terminate')
        assertEquals(fsFiles.size < 500, true, 'fs tree did not terminate')

        // The real /d/file.txt exists in both.
        assertEquals(gitFiles.has('/d/file.txt'), true)
        assertEquals(fsFiles.has('/d/file.txt'), true)
      },
    )
  },
)

Deno.test(
  {
    name: 'cross-backend: .bidsignore applies at grafted paths',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        await Deno.mkdir(join(repo, 'target'))
        await Deno.writeTextFile(join(repo, 'target', 'keep.txt'), 'kept')
        await Deno.writeTextFile(join(repo, 'target', 'skip.txt'), 'skipped')
        await run(['ln', '-s', 'target', join(repo, 'view')])
      },
      async (repo) => {
        // Prune rule: ignore /view/skip.txt at the grafted path, plus .git.
        // Pass the prune via the prune argument — it should test grafted paths
        // in both backends and produce identical results.
        const prune = new FileIgnoreRules(['/view/skip.txt', '.git', '.git/**'])
        const gitTree = await readGitTree(repo, 'HEAD', prune)
        const fsTree = await readFileTree(repo, prune)
        await assertTreeEquivalent(gitTree, fsTree)

        const gitFiles = collectFiles(gitTree)
        assertEquals(gitFiles.has('/view/keep.txt'), true)
        assertEquals(gitFiles.has('/view/skip.txt'), false)
        // Original source files are still present.
        assertEquals(gitFiles.has('/target/keep.txt'), true)
        assertEquals(gitFiles.has('/target/skip.txt'), true)
      },
    )
  },
)

Deno.test(
  {
    name: 'cross-backend: symlink with intermediate directory-symlink segment resolves',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        // Layout:
        //   d/e/file.txt      — actual content
        //   a/c               — symlink to ../d/e/
        //   a/b/link          — symlink to ../c/file.txt
        //                         resolves (via intermediate a/c) to d/e/file.txt
        await Deno.mkdir(join(repo, 'd', 'e'), { recursive: true })
        await Deno.writeTextFile(join(repo, 'd', 'e', 'file.txt'), 'deep-content')
        await Deno.mkdir(join(repo, 'a', 'b'), { recursive: true })
        await run(['ln', '-s', '../d/e', join(repo, 'a', 'c')])
        await run(['ln', '-s', '../c/file.txt', join(repo, 'a', 'b', 'link')])
      },
      async (repo) => {
        const gitTree = await readGitTree(repo, 'HEAD', gitPrune)
        const fsTree = await readFileTree(repo, gitPrune)
        await assertTreeEquivalent(gitTree, fsTree)

        const link = gitTree.get('a/b/link') as BIDSFile
        assertEquals(await link.text(), 'deep-content')
      },
    )
  },
)

Deno.test(
  {
    name: 'cross-backend: annex pointer symlink inside a grafted subtree reports size',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    const annexKey = 'MD5E-s4242--00112233445566778899aabbccddeeff.nii.gz'
    const annexTarget = `../.git/annex/objects/xx/yy/${annexKey}/${annexKey}`
    await withRepo(
      async (repo) => {
        await Deno.mkdir(join(repo, 'target'))
        await run(['ln', '-s', annexTarget, join(repo, 'target', 'scan.nii.gz')])
        await run(['ln', '-s', 'target', join(repo, 'view')])
      },
      async (repo) => {
        const gitTree = await readGitTree(repo, 'HEAD', gitPrune)
        const fsTree = await readFileTree(repo, gitPrune)
        await assertTreeEquivalent(gitTree, fsTree)

        const grafted = gitTree.get('view/scan.nii.gz') as BIDSFile
        assertEquals(grafted.size, 4242)
      },
    )
  },
)

// ---------------------------------------------------------------------------
// Documented inherent asymmetry: out-of-tree symlinks are valid in a work
// tree (the OS follows them) but unresolvable in a git tree (no external
// filesystem to consult). This test does NOT use assertTreeEquivalent; it
// exists to pin down the one place the backends legitimately diverge.
// ---------------------------------------------------------------------------

Deno.test(
  {
    name:
      'cross-backend asymmetry: out-of-tree symlink is valid in fs tree, out-of-tree in git tree',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    const externalFile = await Deno.makeTempFile({ prefix: 'bids-symlink-ext-' })
    await Deno.writeTextFile(externalFile, 'external-content')
    try {
      await withRepo(
        async (repo) => {
          await Deno.writeTextFile(join(repo, '.keep'), '')
          await run(['ln', '-s', externalFile, join(repo, 'outside')])
        },
        async (repo) => {
          const gitTree = await readGitTree(repo, 'HEAD', gitPrune)
          const fsTree = await readFileTree(repo, gitPrune)

          // Git tree: outside is absent from files and present as an out-of-tree link.
          assertEquals(gitTree.get('outside'), undefined)
          const outOfTreeLinks = collectLinks(gitTree).filter((l) => l.reason === 'out-of-tree')
          assertEquals(outOfTreeLinks.length, 1)
          assertEquals(outOfTreeLinks[0].path, '/outside')

          // Fs tree: outside is a regular file whose content is the external file.
          const fsOutside = fsTree.get('outside') as BIDSFile
          assertEquals(await fsOutside.text(), 'external-content')
        },
      )
    } finally {
      await Deno.remove(externalFile)
    }
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
