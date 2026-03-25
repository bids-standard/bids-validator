/**
 * Integration test for readGitTree() with a bare git-annex repository.
 *
 * Clones ds000001 as a bare repo, initialises git-annex, fetches one local
 * annex object, then validates at tag 1.0.0 and asserts exact output.
 */
import { join } from '@std/path'
import { assertEquals } from '@std/assert'
import { readGitTree } from './git.ts'
import { validate } from '../validators/bids.ts'

const REPO_URL = 'https://github.com/openneurodatasets/ds000001.git'
const REF = '1.0.0'

async function run(cmd: string[]): Promise<void> {
  const proc = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: 'inherit',
    stderr: 'inherit',
  })
  const status = await proc.output()
  if (!status.success) {
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
