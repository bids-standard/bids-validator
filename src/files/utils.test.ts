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

export async function run(cmd: string[]): Promise<void> {
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

export async function capture(cmd: string[]): Promise<string> {
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
    await run(['git', '-C', tmpDir, 'commit', '-m', 'init'])
    await test(tmpDir)
  } finally {
    await new Deno.Command('chmod', { args: ['-R', '+w', tmpDir] }).output()
    await Deno.remove(tmpDir, { recursive: true })
  }
}
