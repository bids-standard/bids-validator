/**
 * Integration test for readGitTree() with a bare git-annex repository.
 *
 * Clones ds000001 as a bare repo, initialises git-annex, fetches one local
 * annex object, then validates at tag 1.0.0 and asserts exact output.
 */
import { join } from '@std/path'
import { assertEquals, assertExists, assertRejects } from '@std/assert'
import { readGitTree } from './git.ts'
import { readFileTree } from './deno.ts'
import { validate } from '../validators/bids.ts'
import type { BIDSFile, FileTree } from '../types/filetree.ts'
import { FileIgnoreRules } from './ignore.ts'

const REPO_URL = 'https://github.com/openneurodatasets/ds000001.git'
const REF = '1.0.0'

async function commandExists(cmd: string): Promise<boolean> {
  try {
    const proc = new Deno.Command(cmd, { args: ['--help'], stdout: 'null', stderr: 'null' })
    const { success } = await proc.output()
    return success
  } catch {
    return false
  }
}

const hasGit = await commandExists('git')
const isWindows = Deno.build.os === 'windows'
const hasGitAnnex = await commandExists('git-annex')

async function run(cmd: string[]): Promise<void> {
  const proc = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: 'piped',
    stderr: 'piped',
  })
  const status = await proc.output()
  if (!status.success) {
    const stdout = new TextDecoder().decode(status.stdout).trim()
    const stderr = new TextDecoder().decode(status.stderr).trim()
    console.error(`Command failed: ${cmd.join(' ')}\n\tstdout: ${stdout}\n\tstderr: ${stderr}`)
    throw new Error(`Command failed: ${cmd.join(' ')}`)
  }
}

async function capture(cmd: string[]): Promise<string> {
  const proc = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: 'piped',
    stderr: 'inherit',
  })
  const output = await proc.output()
  if (!output.success) {
    throw new Error(`Command failed: ${cmd.join(' ')}`)
  }
  return new TextDecoder().decode(output.stdout).trim()
}

async function setupRepo({ repoPath, bare }: { repoPath: string; bare: boolean }): Promise<void> {
  await run(['git', 'clone', '-b', REF, REPO_URL, repoPath, ...(bare ? ['--bare'] : [])])
  await run(['git', '-C', repoPath, 'annex', 'init'])

  // Obtain the annex key for one file so we have a locally present object
  const symlink = await capture([
    'git',
    '-C',
    repoPath,
    'show',
    `${REF}:sub-01/anat/sub-01_T1w.nii.gz`,
  ])
  // The symlink target ends with the key name after the last '/'
  const key = symlink.split('/').pop() as string

  await run(['git', '-C', repoPath, 'annex', 'copy', '--key', key, '--to', 'here'])
}

async function validate_ds001_v1(tree: FileTree): Promise<void> {
  const result = await validate(tree, {
    datasetPath: tree.path,
    debug: 'ERROR',
    ignoreWarnings: true,
    ignoreNiftiHeaders: true,
    blacklistModalities: [],
    datasetTypes: [],
  })

  // --- Issue assertions ---
  const issues = result.issues.issues
  assertEquals(
    issues.length,
    1,
    `Expected 1 issue, got ${issues.length}: ${JSON.stringify(issues)}`,
  )

  const issue = issues[0]
  assertEquals(issue.code, 'TSV_VALUE_INCORRECT_TYPE')
  assertEquals(issue.subCode, 'sex')
  assertEquals(issue.location, '/participants.tsv')
  assertEquals(issue.line, 6)

  // --- Summary assertions ---
  const summary = result.summary
  assertEquals(summary.subjects.length, 16)
  assertEquals(summary.totalFiles, 133)
  assertEquals(summary.tasks, ['balloon analog risk task'])
  assertEquals(summary.dataTypes.toSorted(), ['anat', 'func'])
}

Deno.test(
  {
    name: 'Integration: validate ds000001 @ 1.0.0',
    ignore: !hasGit || !hasGitAnnex,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async (t) => {
    const tmpDir = await Deno.makeTempDir()
    const barePath = join(tmpDir, 'ds000001.git')
    const fullPath = join(tmpDir, 'ds000001')

    try {
      await setupRepo({ repoPath: barePath, bare: true })
      await setupRepo({ repoPath: fullPath, bare: false })

      await t.step('Validate bare repository', async () => {
        const tree = await readGitTree(barePath, REF)
        await validate_ds001_v1(tree)
      })
      await t.step('Validate full repository (git tree)', async () => {
        const tree = await readGitTree(fullPath, REF)
        await validate_ds001_v1(tree)
      })
      await t.step('Validate full repository (work tree)', async () => {
        const tree = await readFileTree(fullPath)
        await validate_ds001_v1(tree)
      })
    } finally {
      // git/git-annex sets some objects read-only; chmod +w before removal
      await new Deno.Command('chmod', {
        args: ['-R', '+w', tmpDir],
      }).output()
      await Deno.remove(tmpDir, { recursive: true })
    }
  },
)

// ---------------------------------------------------------------------------
// Lightweight symlink resolution tests
// ---------------------------------------------------------------------------

/**
 * Create a temporary git repo, run a setup callback to populate it,
 * commit everything, then run a test callback with the repo path.
 * Cleans up the temp directory in `finally`.
 */
async function withRepo(
  setup: (repoPath: string) => Promise<void>,
  test: (repoPath: string) => Promise<void>,
): Promise<void> {
  const tmpDir = await Deno.makeTempDir()
  try {
    await run(['git', 'init', tmpDir])
    await run(['git', '-C', tmpDir, 'config', 'user.email', 'test@test.com'])
    await run(['git', '-C', tmpDir, 'config', 'user.name', 'Test'])
    await setup(tmpDir)
    await run(['git', '-C', tmpDir, 'add', '-A'])
    await run(['git', '-C', tmpDir, 'commit', '-m', 'init'])
    await test(tmpDir)
  } finally {
    await new Deno.Command('chmod', { args: ['-R', '+w', tmpDir] }).output()
    await Deno.remove(tmpDir, { recursive: true })
  }
}

Deno.test(
  {
    name: 'readGitTree: symlink to file in same directory',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        await Deno.writeTextFile(join(repo, 'real.txt'), 'hello')
        await run(['ln', '-s', 'real.txt', join(repo, 'link.txt')])
      },
      async (repo) => {
        const tree = await readGitTree(repo)
        const real = tree.get('real.txt')
        const link = tree.get('link.txt')
        assertExists(real, 'real.txt should be in tree')
        assertExists(link, 'link.txt should be in tree')
        assertEquals(await (link as BIDSFile).text(), 'hello')
      },
    )
  },
)

Deno.test(
  {
    name: 'readGitTree: symlink targeting file in parent directory',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        await Deno.writeTextFile(join(repo, 'root.txt'), 'from root')
        await Deno.mkdir(join(repo, 'sub'))
        await run(['ln', '-s', '../root.txt', join(repo, 'sub', 'link.txt')])
      },
      async (repo) => {
        const tree = await readGitTree(repo)
        const link = tree.get('sub/link.txt')
        assertExists(link, 'sub/link.txt should be in tree')
        assertEquals(await (link as BIDSFile).text(), 'from root')
      },
    )
  },
)

Deno.test(
  {
    name: 'readGitTree: symlink chain A -> B -> file',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        await Deno.writeTextFile(join(repo, 'real.txt'), 'chained')
        await run(['ln', '-s', 'real.txt', join(repo, 'link_b.txt')])
        await run(['ln', '-s', 'link_b.txt', join(repo, 'link_a.txt')])
      },
      async (repo) => {
        const tree = await readGitTree(repo)
        const linkA = tree.get('link_a.txt')
        assertExists(linkA, 'link_a.txt should be in tree')
        assertEquals(await (linkA as BIDSFile).text(), 'chained')
      },
    )
  },
)

Deno.test(
  {
    name: 'readGitTree: symlink chain to annex key',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    const annexTarget =
      '.git/annex/objects/xx/yy/MD5E-s1234--d41d8cd98f00b204e9800998ecf8427e.nii.gz/MD5E-s1234--d41d8cd98f00b204e9800998ecf8427e.nii.gz'
    await withRepo(
      async (repo) => {
        await run(['ln', '-s', annexTarget, join(repo, 'annex_link.nii.gz')])
        await run(['ln', '-s', 'annex_link.nii.gz', join(repo, 'alias.nii.gz')])
      },
      async (repo) => {
        const tree = await readGitTree(repo)
        const annex = tree.get('annex_link.nii.gz')
        const alias = tree.get('alias.nii.gz')
        assertExists(annex, 'annex_link.nii.gz should be in tree')
        assertExists(alias, 'alias.nii.gz should be in tree')
        assertEquals((annex as BIDSFile).size, 1234)
        assertEquals((alias as BIDSFile).size, 1234)
      },
    )
  },
)

Deno.test(
  {
    name: 'readGitTree: symlink cycle is silently dropped',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        await Deno.writeTextFile(join(repo, 'safe.txt'), 'ok')
        await run(['ln', '-s', 'cycle_b', join(repo, 'cycle_a')])
        await run(['ln', '-s', 'cycle_a', join(repo, 'cycle_b')])
      },
      async (repo) => {
        const tree = await readGitTree(repo)
        const safe = tree.get('safe.txt')
        assertExists(safe, 'safe.txt should be in tree')
        const cycleA = tree.get('cycle_a')
        const cycleB = tree.get('cycle_b')
        assertEquals(cycleA, undefined, 'cycle_a should be dropped')
        assertEquals(cycleB, undefined, 'cycle_b should be dropped')
      },
    )
  },
)

Deno.test(
  {
    name: 'readGitTree: broken symlink is silently dropped',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        await Deno.writeTextFile(join(repo, 'exists.txt'), 'here')
        await run(['ln', '-s', 'nonexistent.txt', join(repo, 'broken.txt')])
      },
      async (repo) => {
        const tree = await readGitTree(repo)
        const exists = tree.get('exists.txt')
        assertExists(exists, 'exists.txt should be in tree')
        const broken = tree.get('broken.txt')
        assertEquals(broken, undefined, 'broken.txt should be dropped')
      },
    )
  },
)

// ---------------------------------------------------------------------------
// Error paths
// ---------------------------------------------------------------------------

Deno.test(
  {
    name: 'readGitTree: error on non-git directory',
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    const tmpDir = await Deno.makeTempDir()
    try {
      // An empty directory with no .git is treated as a bare repo path,
      // so isomorphic-git fails to find HEAD → "has no commits" rather
      // than "not a git repository".
      await assertRejects(
        () => readGitTree(tmpDir, 'HEAD'),
        Error,
        'has no commits',
      )
    } finally {
      await Deno.remove(tmpDir, { recursive: true })
    }
  },
)

Deno.test(
  {
    name: 'readGitTree: error on repo with no commits',
    ignore: !hasGit,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    const tmpDir = await Deno.makeTempDir()
    try {
      await run(['git', 'init', tmpDir])
      await assertRejects(
        () => readGitTree(tmpDir, 'HEAD'),
        Error,
        'has no commits',
      )
    } finally {
      await Deno.remove(tmpDir, { recursive: true })
    }
  },
)

Deno.test(
  {
    name: 'readGitTree: error on nonexistent ref',
    ignore: !hasGit,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        await Deno.writeTextFile(join(repo, 'f.txt'), 'content')
      },
      async (repo) => {
        await assertRejects(
          () => readGitTree(repo, 'nonexistent-ref'),
          Error,
          "Could not resolve ref 'nonexistent-ref'",
        )
      },
    )
  },
)

// ---------------------------------------------------------------------------
// Abbreviated SHA resolution
// ---------------------------------------------------------------------------

Deno.test(
  {
    name: 'readGitTree: abbreviated SHA resolution',
    ignore: !hasGit,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        await Deno.writeTextFile(join(repo, 'f.txt'), 'sha test')
      },
      async (repo) => {
        const fullSha = await capture(['git', '-C', repo, 'rev-parse', 'HEAD'])
        const abbrev = fullSha.slice(0, 7)
        const tree = await readGitTree(repo, abbrev)
        const f = tree.get('f.txt')
        assertExists(f, 'f.txt should be in tree')
        assertEquals(await (f as BIDSFile).text(), 'sha test')
      },
    )
  },
)

// ---------------------------------------------------------------------------
// Pruning
// ---------------------------------------------------------------------------

Deno.test(
  {
    name: 'readGitTree: pruning directories',
    ignore: !hasGit,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        await Deno.writeTextFile(join(repo, 'keep.txt'), 'kept')
        await Deno.mkdir(join(repo, 'derivatives'))
        await Deno.writeTextFile(join(repo, 'derivatives', 'pruned.txt'), 'pruned')
      },
      async (repo) => {
        const prune = new FileIgnoreRules(['derivatives'], false)
        const tree = await readGitTree(repo, 'HEAD', prune)
        const keep = tree.get('keep.txt')
        assertExists(keep, 'keep.txt should be in tree')
        assertEquals(tree.get('derivatives'), undefined, 'derivatives should be pruned')
      },
    )
  },
)

// ---------------------------------------------------------------------------
// Bare repository
// ---------------------------------------------------------------------------

Deno.test(
  {
    name: 'readGitTree: bare repository',
    ignore: !hasGit,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    const tmpDir = await Deno.makeTempDir()
    const srcPath = join(tmpDir, 'src')
    const barePath = join(tmpDir, 'bare.git')
    try {
      await run(['git', 'init', srcPath])
      await run(['git', '-C', srcPath, 'config', 'user.email', 'test@test.com'])
      await run(['git', '-C', srcPath, 'config', 'user.name', 'Test'])
      await Deno.writeTextFile(join(srcPath, 'data.txt'), 'bare test')
      await run(['git', '-C', srcPath, 'add', '-A'])
      await run(['git', '-C', srcPath, 'commit', '-m', 'init'])
      await run(['git', 'clone', '--bare', srcPath, barePath])
      const tree = await readGitTree(barePath, 'HEAD')
      const data = tree.get('data.txt')
      assertExists(data, 'data.txt should be in tree')
      assertEquals(await (data as BIDSFile).text(), 'bare test')
    } finally {
      await new Deno.Command('chmod', { args: ['-R', '+w', tmpDir] }).output()
      await Deno.remove(tmpDir, { recursive: true })
    }
  },
)
