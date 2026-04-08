/**
 * Integration test for readGitTree() with a bare git-annex repository.
 *
 * Clones ds000001 as a bare repo, initialises git-annex, fetches one local
 * annex object, then validates at tag 1.0.0 and asserts exact output.
 */
import { join } from '@std/path'
import { assertEquals, assertExists } from '@std/assert'
import { readGitTree } from './git.ts'
import { validate } from '../validators/bids.ts'
import type { BIDSFile } from '../types/filetree.ts'

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

async function setupRepo(repoPath: string): Promise<void> {
  await run(['git', 'clone', '--bare', REPO_URL, repoPath])
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

Deno.test(
  {
    name: 'Integration: validate bare git-annex repo (ds000001 @ 1.0.0)',
    ignore: !hasGit || !hasGitAnnex,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    const tmpDir = Deno.makeTempDirSync()
    const repoPath = join(tmpDir, 'ds000001.git')
    await setupRepo(repoPath)

    try {
      const tree = await readGitTree(repoPath, REF)
      const result = await validate(tree, {
        datasetPath: repoPath,
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
      assertEquals(summary.size, 2416199965)
      assertEquals(summary.tasks, ['balloon analog risk task'])
      assertEquals(summary.dataTypes.toSorted(), ['anat', 'func'])
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
    ignore: !hasGit,
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
    ignore: !hasGit,
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
    ignore: !hasGit,
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
    ignore: !hasGit,
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
    ignore: !hasGit,
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
    ignore: !hasGit,
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
