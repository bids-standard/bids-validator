import { dirname, join } from '@std/path'
import { stub } from '@std/testing/mock'
import { hashDirLower, hashDirMixed } from './repo.ts'

async function commandExists(cmd: string): Promise<boolean> {
  try {
    const proc = new Deno.Command(cmd, { args: ['--help'], stdout: 'null', stderr: 'null' })
    const { success } = await proc.output()
    return success
  } catch {
    return false
  }
}

export const hasGit = await commandExists('git')
export const isWindows = Deno.build.os === 'windows'
export const hasGitAnnex = await commandExists('git-annex')

export interface CommandOptions {
  /** Extra environment variables for the command. */
  env?: Record<string, string>
}

export async function run(cmd: string[], options: CommandOptions = {}): Promise<void> {
  const proc = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    env: options.env,
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

export async function capture(cmd: string[], options: CommandOptions = {}): Promise<string> {
  const proc = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    env: options.env,
    stdout: 'piped',
    stderr: 'inherit',
  })
  const output = await proc.output()
  if (!output.success) {
    throw new Error(`Command failed: ${cmd.join(' ')}`)
  }
  return new TextDecoder().decode(output.stdout).trim()
}

/**
 * Create a temporary git repo, run a setup callback to populate it,
 * commit everything, then run a test callback with the repo path.
 * Cleans up the temp directory in `finally`.
 */
export async function withRepo(
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
    await run(['git', '-C', tmpDir, 'commit', '--no-gpg-sign', '-m', 'init'])
    await test(tmpDir)
  } finally {
    if (!isWindows) {
      await new Deno.Command('chmod', { args: ['-R', '+w', tmpDir] }).output()
    }
    await Deno.remove(tmpDir, { recursive: true })
  }
}

/** Write an annex object at `gitdir/annex/objects/<hashDirMixed>/<key>/<key>`. */
export async function writeAnnexObject(
  gitdir: string,
  key: string,
  content: string | Uint8Array,
): Promise<void> {
  const [h0, h1] = await hashDirMixed(key)
  const path = join(gitdir, 'annex', 'objects', h0, h1, key, key)
  await Deno.mkdir(dirname(path), { recursive: true })
  if (typeof content === 'string') {
    await Deno.writeTextFile(path, content)
  } else {
    await Deno.writeFile(path, content)
  }
}

/**
 * Write a `git-annex` branch, using git plumbing, that records a public S3 remote
 * holding each annex key at the given path in its bucket.
 *
 * The presigned URL of a key is `https://s3.example.com/bucket/<path>?versionId=v1`.
 *
 * @param repo - Path to the repository work tree.
 * @param objects - Maps each annex key to its object path in the bucket.
 */
export async function addAnnexRemote(
  repo: string,
  objects: Record<string, string>,
): Promise<void> {
  const uuid = '00000000-0000-0000-0000-000000000001'
  const files: Record<string, string> = {
    'remote.log':
      `${uuid} name=s3-PUBLIC type=S3 bucket=bucket host=s3.example.com public=yes timestamp=1700000000s\n`,
  }
  for (const [key, path] of Object.entries(objects)) {
    const dir = (await hashDirLower(key)).join('/')
    files[`${dir}/${key}.log.rmet`] = `1700000000s ${uuid}:V +v1#${path}\n`
  }

  const tmp = await Deno.makeTempDir()
  try {
    const env = { GIT_INDEX_FILE: join(tmp, 'index') }
    const git = ['git', '-C', repo]
    for (const [path, content] of Object.entries(files)) {
      const file = join(tmp, 'blob')
      await Deno.writeTextFile(file, content)
      const oid = await capture([...git, 'hash-object', '-w', file])
      await run([...git, 'update-index', '--add', '--cacheinfo', `100644,${oid},${path}`], { env })
    }
    const tree = await capture([...git, 'write-tree'], { env })
    const commit = await capture(
      [...git, 'commit-tree', tree, '-m', 'git-annex'],
      { env },
    )
    await run([...git, 'update-ref', 'refs/heads/git-annex', commit])
  } finally {
    await Deno.remove(tmp, { recursive: true })
  }
}

/**
 * Stub `globalThis.fetch` to serve annexed content from memory, so that tests
 * do not use the network.
 *
 * Requests are answered by `new URL(input).pathname`: `bodies[path]` when present
 * (200), else `404 Not Found`. Use with `using`.
 *
 * @param bodies - Response bodies by URL path, e.g. `/bucket/sub-01/a.nii.gz`.
 */
export function annexFetchStub(bodies: Record<string, string | Uint8Array>) {
  return stub(
    globalThis,
    'fetch',
    (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : input
      const body = bodies[new URL(url).pathname]
      return Promise.resolve(
        body === undefined
          ? new Response('Not Found', { status: 404, statusText: 'Not Found' })
          : new Response(body as BodyInit),
      )
    },
  )
}
